/*
function to delete existing {qids} from a opensearch index
the information to delete existing {qids} should be made available in a "/options/{filename} file in the QnABot {import} S3 bucket
*/
var aws=require("aws-sdk");
var objS3 = new aws.S3();
var objLambda = new aws.Lambda();

const _ = require('lodash');

async function delete_existing_content (esindex, config, ES_formatted_content) {
    var ESdelete_query ='{"query":{"match_all":{}}}';  //opensearch query to delete all records in a index
    var ESdeletebody={
        endpoint:process.env.ES_ENDPOINT,
        method:"POST",
        path:esindex + "/_delete_by_query?conflicts=proceed&refresh=true",
        body:ESdelete_query
    };

    var key = config.key.split("/")[1];  //get the filename and not the whole path
    var params = {
        "Bucket": config.bucket, 
        "Key": "options/" + key
    };
    try {
        console.log (params);
        await objS3.waitFor('objectExists', params).promise(); //check if the options file exists for the Import request. This is currently only available when the Import process is initiated via the QnABot CLI
    }
    catch (e) {
        console.log (e.code + ": " + e.message);
        console.log ("The Import process does not include a " + params.Key + " file in the request. This option is currently only supported when the Import process is initiated via the QnABot CLI.");
        console.log ("Safe to ignore if the Import process was not initiated using the QnABot CLI.");
        return ES_formatted_content;
    }
    var data = await objS3.getObject(params).promise(); //get the options file 
    var objBody = JSON.parse(data.Body.toString()); //get the Body content of the options file
	var objectDatetime = new Date (data.LastModified);  //get the datetime of the object
	var import_datetime = new Date (objBody.import_datetime);   //get the datetime when the import was initiated

	while (objectDatetime < import_datetime) {  //loop until the object in S3 is the latest file that needs to be used
        if (objectDatetime < import_datetime) { // get the object again and check if the file in S3 is the latest that needs to be used
            data = await objS3.getObject(params).promise(); //get the options file 
            objBody = JSON.parse(data.Body.toString()); //get the Body content of the options file
        	objectDatetime = new Date (data.LastModified);  //get the datetime of the object
        	import_datetime = new Date (objBody.import_datetime);   //get the datetime when the import was initiated
        }
	}
    if (objBody.options.delete_existing_content) {  // proceed if the value is True
        console.log (objBody);
        console.log ("delete_existing_content: " + objBody.options.delete_existing_content);
        console.log ("deleting existing content");
        var response = await objLambda.invoke({            //invoke lambda function to run query against a opensearch cluster index
            FunctionName:process.env.ES_PROXY,
            Payload:JSON.stringify(ESdeletebody)
        }).promise();
        config.EsErrors.push(JSON.parse(_.get(response,"Payload","{}")).errors);
        console.log (response);
        console.log ("deleted existing content");
    }
    return ES_formatted_content;
}

exports.delete_existing_content = async function (esindex, config, ES_formatted_content) {
    return await delete_existing_content (esindex, config, ES_formatted_content);
};