var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION
const qnabot = require("qnabot/logging")
const qna_settings = require("qnabot/settings")


var s3=new aws.S3({apiVersion: "2006-03-01", region:process.env.REGION})
var _=require('lodash')
var parse=require('./parseJSON')
var create=require('./createFAQ')

/**
 * Function to retrieve QnABot settings
 * @returns {*}
 */
async function get_settings() {
    let settings = qna_settings.merge_default_and_custom_settings();
    // TODO: investigate why this value is being 'set' to undefined instead of
    // being 'unset' or ignored all together
    _.set(settings, "DEFAULT_USER_POOL_JWKS_URL");

    qnabot.log("Merged Settings: ", settings);
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
        qnabot.log("Request",JSON.stringify(event,null,2))
        var Bucket=event.Records[0].s3.bucket.name
        var Key=decodeURI(event.Records[0].s3.object.key)
        var VersionId=_.get(event,"Records[0].s3.object.versionId")
        qnabot.log(Bucket,Key)

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
        qnabot.log("Parsed content JSON into Kendra FAQ file format stored locally");


        // get QnABot settings to retrieve KendraFAQIndex
        var settings = await get_settings();
        qna_settings.set_environment_variables(settings)

        var kendra_faq_index = _.get(settings, 'KENDRA_FAQ_INDEX', "");
        if (kendra_faq_index == "") {
            throw new Error(`No FAQ Index set: ${kendra_faq_index}`);
        }
        qnabot.log(`kendra faq index is ${kendra_faq_index}`);

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
        qnabot.log('Completed JSON converting to FAQ ' + JSON.stringify(status));


        await update_status(process.env.OUTPUT_S3_BUCKET, 'Sync Complete');
        qnabot.log(`completed sync`);
        return 'Synced';

    } catch (err) {
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Error');
        qnabot.log(err);
        qnabot.log(`failed sync`);
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
    qnabot.log('updated config file status to ' + new_stat);
    return x;
}