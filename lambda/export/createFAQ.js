// createFAQ.js


const AWSKendra = require('aws-sdk/clients/kendra');
const AWSS3 = require('aws-sdk/clients/s3');
const sleep = require('util').promisify(setTimeout)


/**
 * Function to upload JSON to S3 bucket, return Promise
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
                console.log('Uploaded JSON to S3 successfully:');
                console.log(data);           // successful response
                resolve(data);
            }
            });
    });
}


/**
 * Function to convert uploaded JSON into Kendra FAQ, return Promise
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
                console.log('Converted JSON to FAQ successfully:');
                console.log(data);           // successful response
                poll(() => kendraClient.describeFaq({IndexId: params.IndexId,Id:data.Id }).promise(),(result) => {
                    console.log("describeFaq " + JSON.stringify(result));
                    var status = result.Status == "PENDING_CREATION" || result.Status == "CREATING";
                    return {
                        Status: status ?  "PENDING":result.Status,
                        Message: result.Status == "FAILED" ? result.ErrorMessage : null 
                    }
                
                },5000 )
                .then(() => {
                    return resolve(data)})
                .catch(() => reject("Could not sync Kendra FAQ"))       // successful response
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
                console.log("Delete parameters " + JSON.stringify(params));   
                //describeFaq should cause an exception when the faq has been deleted.
                poll(() => kendraClient.describeFaq(params).promise(),(result) => {return {Status:"PENDING"}},5000 ).then(() => resolve(data));        // successful response
                
            }
            });
    });
}

function wait(ms = 1000) {
    return new Promise(resolve => {
      console.log(`waiting ${ms} ms...`);
      setTimeout(resolve, ms);
    });
  }

async function poll(fn, fnCondition, ms) {
    let result = await fn();
 
    while (fnCondition(result).Status == "PENDING") {
 
      await wait(ms);
 
      try{
        result = await fn();
      } catch(e)
      {
 
          if(e.Propragate)
          {
              throw(e.Message)
          }
 
          return e;
      }
    }
    if(result.Status == "FAILED")
    {
        throw ("Error during Kendra Sync")
    }
   return result;
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
 * Function to upload JSON into S3 bucket and convert into Kendra FAQ, return Promise
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
    
    
    // read in JSON and upload to S3 bucket
    var fs = require('fs');
    var s3_params = {
      Bucket: params.s3_bucket,
      Key: params.s3_key,
      ACL: 'bucket-owner-read',                     // TODO: should this param be public?
      Body: fs.createReadStream(params.json_path),   // use read stream option in case file is large
    };
    
    let count=0;
    while (count<1) {
        try {
            var s3_response = await s3Uploader(s3Client, s3_params);
            count++;
        } catch (error) {
            if (error.code=='ThrottlingException') {
                console.log(`Throttling exception: trying upload CSV again in 10 seconds`);
                await sleep(10000);
                continue;
            } else {
                throw error;
            }
        }
    }
    await sleep(10000);

    
    // if FAQ exists already, delete the old one and update it
    var index_params = {
      IndexId: params.faq_index_id,
      MaxResults: '30'      // default max number of FAQs in developer edition
    };
    
    count=0;
    while (count<1) {
        try {
            var list_faq_response = await faqLister(kendraClient, index_params);
            count++;
        } catch (error) {
            if (error.code=='ThrottlingException') {
                console.log(`Throttling exception: trying list FAQs again in 10 seconds`);
                await sleep(10000);
                continue;
            } else {
                throw error;
            }
        }
    }
    await sleep(10000);
    
    
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
        count=0;        
        while (count<1) {
            try {
                var del_faq_response = await faqDeleter(kendraClient, delete_faq_params);
                count++;
            } catch (error) {
                if (error.code=='ThrottlingException') {
                    console.log(`Throttling exception: trying delete FAQ again in 10 seconds`);
                    await sleep(10000);
                    continue;
                } else {
                    throw error;
                }
            }
        }
    } else {
        console.log("No old FAQ to delete");
    }
    await sleep(10000);
    
    // create the FAQ
    var faq_params = {
      IndexId: params.faq_index_id,
      Name: params.faq_name,
      RoleArn: params.kendra_s3_access_role,
      FileFormat: "JSON",
      S3Path: {
        Bucket: params.s3_bucket,
        Key: params.s3_key
      },
      Description: 'Exported FAQ of questions from QnABot designer console'
      // if no tags, delete parameter because empty arrays cause throttling exceptions
    };

    count=0;        
    while (count<1) {
        try {
            var faq_response = await faqConverter(kendraClient, faq_params,delete_faq_params);
            count++;
        } catch (error) {
            if (error.code=='ThrottlingException') {
                console.log(`Throttling exception: trying convert to FAQ again in 10 seconds`);
                await sleep(10000);
                continue;
            } else {
                throw error;
            }
        }
    }
    await sleep(10000);
    return faq_response;
}


exports.handler = async(params) => {
    return await createFAQ(params);
}
