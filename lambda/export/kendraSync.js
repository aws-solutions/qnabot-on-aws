var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION

var s3=new aws.S3({apiVersion: "2006-03-01", region:process.env.REGION})
var _=require('lodash')
var parse=require('./parseJSON')
var create=require('./createFAQ')
const sleep = require('util').promisify(setTimeout)



/**
 * Function to check if a string has a JSON structure
 * @param str
 * @returns boolean
 */
function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function str2bool(settings) {
    var new_settings = _.mapValues(settings, x => {
        if (_.isString(x)) {
            x = x.replace(/^"(.+)"$/,'$1');  // remove wrapping quotes
            if (x.toLowerCase() === "true") {
                return true ;
            }
            if (x.toLowerCase() === "false") {
                return false ;
            }
        }
        return x;
    });
    return new_settings;
}


/**
 * Function to get parameters from QnABot settings
 * @param param_name
 * @returns {*}
 */
async function get_parameter(param_name) {
    var ssm = new aws.SSM();
    var params = {
        Name: param_name,
        WithDecryption: true
    };
    // TODO: update permissions
    var response = await ssm.getParameter(params).promise();
    var settings = response.Parameter.Value
    if (isJson(settings)) {
        settings = JSON.parse(response.Parameter.Value);
        settings = str2bool(settings) ;
    }
    return settings;
}

/**
 * Function to retrieve QnABot settings
 * @returns {*}
 */
async function get_settings() {
    var default_settings_param = process.env.DEFAULT_SETTINGS_PARAM;
    var custom_settings_param = process.env.CUSTOM_SETTINGS_PARAM;

    console.log("Getting Default QnABot settings from SSM Parameter Store: ", default_settings_param);
    var default_settings = await get_parameter(default_settings_param);

    console.log("Getting Custom QnABot settings from SSM Parameter Store: ", custom_settings_param);
    var custom_settings = await get_parameter(custom_settings_param);

    var settings = _.merge(default_settings, custom_settings);
    _.set(settings, "DEFAULT_USER_POOL_JWKS_URL");

    console.log("Merged Settings: ", settings);

    if (settings.ENABLE_REDACTING) {
        console.log("redacting enabled");
        process.env.QNAREDACT="true";
        process.env.REDACTING_REGEX=settings.REDACTING_REGEX;
    } else {
        console.log("redacting disabled");
        process.env.QNAREDACT="false";
        process.env.REDACTING_REGEX="";
    }
    return settings;
}


/**
 * Function to perform Kendra Sync of exported QnABot content into FAQ
 * @param event
 * @param context
 * @param cb
 * @returns 'Synced' if successful
 */
exports.performSync=async function(event,context,cb){
    try{
        console.log("Request",JSON.stringify(event,null,2))
        var Bucket=event.Records[0].s3.bucket.name
        var Key=decodeURI(event.Records[0].s3.object.key)
        var VersionId=_.get(event,"Records[0].s3.object.versionId")
        console.log(Bucket,Key)
        
        // triggered by export file, waits to be uploaded
        await s3.waitFor('objectExists',{Bucket,Key,VersionId}).promise()
        let x = await s3.getObject({Bucket,Key,VersionId}).promise()
        var content = x.Body.toString()
        
        // parse JSON into Kendra format
        var parseJSONparams = {
            json_name:'qna_FAQ.json',
            content:content,
            output_path:'/tmp/qna_FAQ.json',
        }
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Parsing content JSON');
        await parse.handler(parseJSONparams)
        console.log("Parsed content JSON into Kendra FAQ file format stored locally");
        
        
        // get QnABot settings to retrieve KendraFAQIndex
        var settings = await get_settings();
        var kendra_faq_index = _.get(settings, 'KENDRA_FAQ_INDEX', "");
        if (kendra_faq_index == "") {
            throw new Error(`No FAQ Index set: ${kendra_faq_index}`);
        }
        console.log(`kendra faq index is ${kendra_faq_index}`);
        
        // create kendra FAQ from JSON
        var createFAQparams = {
            faq_name:'qna-facts',
            faq_index_id:kendra_faq_index,
            json_path:parseJSONparams.output_path,
            json_name:parseJSONparams.json_name,
            s3_bucket:process.env.OUTPUT_S3_BUCKET,
            s3_key:"kendra_json" + "/" + parseJSONparams.json_name,
            kendra_s3_access_role:process.env.KENDRA_ROLE,
            region:process.env.REGION
        }
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Creating FAQ');
        var status = await create.handler(createFAQparams);
    
        // wait for index to complete creation
        // TODO: https://docs.aws.amazon.com/kendra/latest/dg/create-index.html
        console.log('Completed JSON converting to FAQ ' + JSON.stringify(status));
        
        
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Sync Complete');
        console.log(`completed sync`);
        return 'Synced';
        
    } catch (err) {
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Error');
        console.log(err);
        console.log(`failed sync`);
        return err
    }
}


async function update_status(bucket, new_stat) {
    var status_params = {
        Bucket:bucket,
        Key:'status/qna-kendra-faq.txt'
    }
    
    // TODO: check the return value of the object in case of an error...
    var x = await s3.getObject(status_params).promise();
    var config = JSON.parse(x.Body.toString());
    config.status = new_stat;
    status_params.Body = JSON.stringify(config);
    x = await s3.putObject(status_params).promise();
    console.log('updated config file status to ' + new_stat);
    return x;
}