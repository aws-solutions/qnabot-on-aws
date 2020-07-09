// createFAQ.js


const AWSKendra = require('aws-sdk/clients/kendra');
const AWSS3 = require('aws-sdk/clients/s3');


/**
 * Function to upload CSV to S3 bucket, return Promise
 * @param s3Client
 * @param params
 * @returns {*}
 */
function s3Uploader(s3Client,params) {
    return new Promise(function(resolve, reject) {
        s3Client.putObject(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(err);
            }
            else {
                console.log('Uploaded CSV to S3 successfully:');
                console.log(data);           // successful response
                resolve(data);
            }
            });
    });
}


/**
 * Function to convert uploaded CSV into Kendra FAQ, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqConverter(kendraClient,params) {
    return new Promise(function(resolve, reject) {
        kendraClient.createFaq(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(err);
            }
            else {
                console.log('Converted CSV to FAQ successfully:');
                console.log(data);           // successful response
                resolve(data);
            }
            });
    });
}
        

/**
 * Function to delete old FAQ from Kendra index, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqDeleter(kendraClient,params) {
    return new Promise(function(resolve, reject) {
        kendraClient.deleteFaq(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(err);
            }
            else {
                console.log('Deleted old FAQ successfully. New list of FAQs in index ' + params.IndexId + ':');
                console.log(data);           // successful response
                resolve(data);
            }
            });
    });
}


/**
 * Function to list existing FAQs in a Kendra index, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqLister(kendraClient,params) {
    return new Promise(function(resolve, reject) {
        kendraClient.listFaqs(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(err);
            }
            else {
                console.log('Checked for pre-existing FAQ successfully. List of FAQs for index ' + params.IndexId + ':');
                console.log(data);           // successful response
                resolve(data);
            }
            });
    });
}




/**
 * Function to upload CSV into S3 bucket and convert into Kendra FAQ, return Promise
 * @returns {*}
 */
async function createFAQ(params) {
    
    // create kendra and s3 clients    
    let kendraClient = (process.env.REGION ?
            new AWSKendra({apiVersion:'2019-02-03', region:process.env.REGION}) :
            new AWSKendra({apiVersion:'2019-02-03', region:params.region})
            );
    let s3Client = (process.env.REGION ?
            new AWSS3({apiVersion:'2006-03-01', region:process.env.REGION}) :
            new AWSS3({apiVersion:'2006-03-01', region:params.region}));
    console.log('clients created');
    
    
    // read in CSV and upload to S3 bucket
    var fs = require('fs');
    var s3_params = {
      Bucket: params.s3_bucket,
      Key: params.s3_key,
      ACL: 'bucket-owner-read',                     // TODO: should this param be public?
      Body: fs.createReadStream(params.csv_path),   // use read stream option in case file is large
    };
    var s3_response = await s3Uploader(s3Client, s3_params);
    
    
    // if FAQ exists already, delete the old one and update it
    var index_params = {
      IndexId: params.faq_index_id,
      MaxResults: '30'      // default max number of FAQs in developer edition
    };
    var list_faq_response = await faqLister(kendraClient, index_params);
    var j, elem, index=null;
    for (j=0; j<list_faq_response.FaqSummaryItems.length; j++) {
        elem = list_faq_response.FaqSummaryItems[j];
        if (elem.Name == params.faq_name) {
            index = elem.Id;
            break;
        }
    }
    if (index != null) {
        var delete_faq_params = {
          Id: index,
          IndexId: params.faq_index_id
        }
        var del_faq_response = await faqDeleter(kendraClient, delete_faq_params);
    } else {
        console.log("No old FAQ to delete");
    }
    
    
    // create the FAQ
    var faq_params = {
      IndexId: params.faq_index_id,
      Name: params.faq_name,
      RoleArn: params.kendra_s3_access_role,
      S3Path: {
        Bucket: params.s3_bucket,
        Key: params.s3_key
      },
      Description: 'Exported FAQ of questions from QnABot designer console'
      // if no tags, delete parameter because empty arrays cause throttling exceptions
    };
    var faq_response = await faqConverter(kendraClient, faq_params);

    return faq_response;
}

// TODO: event and context will be triggered by the clicking on the menu item
exports.handler = async(params) => {
    return createFAQ(params);
}
