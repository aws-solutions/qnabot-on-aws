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
                console.log('Uploaded CSV to S3 successfully: ');
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
            console.log('FAQ conversion params are : ')
            console.log(params);
            if (err) {
                console.log(err, err.stack); // an error occurred
                reject(err);
            }
            else {
                console.log('Converted CSV to FAQ successfully: ');
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
            new AWSKendra({apiVersion: '2019-02-03'}));
    let s3Client = (process.env.REGION ?
            new AWSS3({apiVersion: '2006-03-01', region: process.env.REGION}) :
            new AWSS3({apiVersion: '2006-03-01'}));
    
    console.log('clients created');
    
    
    // read in CSV and upload to S3 bucket
    var fs = require('fs');
    let csv_path = './test/qna_FAQ.csv';
    
    var s3_params = {
      Bucket: 'explore-kendra-solar',
      Key: 'qna_FAQ.csv',
      ACL: 'private',
      Body: fs.createReadStream(csv_path),  // use read stream option in case file is large
    };
    await s3Uploader(s3Client, s3_params);
    
    
    // create the FAQ
    var faq_params = {
      IndexId: 'e1c23860-e5c8-4409-ae26-b05bd6ced00a',
      Name: 'explore-qnabot',
      RoleArn: 'arn:aws:iam::425742325899:role/service-role/AmazonKendra-question-bucketer',
      S3Path: {
        Bucket: 'explore-kendra-solar',
        Key: 'qna_FAQ.csv'
      },
      Description: 'Exported FAQ of questions from QnABot designer console',
      Tags: [] // no tags
    };
    console.log('starting FAQ conversion');
    var faq_response = await faqConverter(kendraClient, faq_params);

    return faq_response;
}

// TODO: event and context will be triggered by the clicking on the menu item
exports.handler = async() => {
    return createFAQ();
}