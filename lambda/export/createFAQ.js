// createFAQ.js

// TODO: don't hardcode


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
async function createFAQ() {
    let kendraClient = (process.env.REGION ?
            new AWSKendra({apiVersion: '2019-02-03', region: process.env.REGION}) :
            new AWSKendra({apiVersion: '2019-02-03', region: "us-east-1"})
            );
    let s3Client = (process.env.REGION ?
            new AWSS3({apiVersion: '2006-03-01', region: process.env.REGION}) :
            new AWSS3({apiVersion: '2006-03-01'}));
    console.log('clients created');
    
    
    // FAQ attributes // TODO: don't hardcode (also for the region)
    let faq_name = 'solar-facts';
    let faq_index_id = 'e1c23860-e5c8-4409-ae26-b05bd6ced00a';
    let csv_path = './test/qna_FAQ.csv';
    
    
    // read in CSV and upload to S3 bucket
    var fs = require('fs');
    var s3_params = {
      Bucket: 'explore-kendra-solar',
      Key: 'qna_FAQ.csv',
      ACL: 'private',   // TODO: do we want this to be publicly readable by linking QID's?
      Body: fs.createReadStream(csv_path),  // use read stream option in case file is large
    };
    var s3_response = await s3Uploader(s3Client, s3_params);
    
    
    // if FAQ exists already: then the old one and update it
    var index_params = {
      IndexId: faq_index_id,
      MaxResults: '30'      // default max number of FAQs in developer edition
    //   NextToken: ''      // TODO: for when the number of FAQs goes over a page...
    };
    // TODO: this errors when there are no FAQs already
    var list_faq_response = await faqLister(kendraClient, index_params);
    // TODO: does it always have this field?
    var j, elem, index=null;
    for (j=0; j<list_faq_response.FaqSummaryItems.length; j++) {
        elem = list_faq_response.FaqSummaryItems[j];
        if (elem.Name == faq_name) {
            index = elem.Id;
            break;
        }
    }
    if (index != null) {
        var delete_faq_params = {
          Id: index,
          IndexId: faq_index_id
        }
        var del_faq_response = await faqDeleter(kendraClient, delete_faq_params);
    }
    
    // create the FAQ
    var faq_params = {
      IndexId: faq_index_id,
      Name: faq_name,
      RoleArn: 'arn:aws:iam::425742325899:role/service-role/AmazonKendra-question-bucketer',
      S3Path: {
        Bucket: 'explore-kendra-solar',
        Key: 'qna_FAQ.csv'
      },
      Description: 'Exported FAQ of questions from QnABot designer console'
    //   Tags: [{Key: 'key1', Value: 'val1'}] // if no tags, just comment out! throttling exception caused with empty tags array (and remove ending object comma)
    };
    var faq_response = await faqConverter(kendraClient, faq_params);

    return faq_response;
}

// TODO: event and context will be triggered by the clicking on the menu item
exports.handler = async() => {
    return createFAQ();
}
