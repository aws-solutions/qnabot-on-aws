//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')

module.exports=function(req,res){
    console.log("RESULT",JSON.stringify(req),JSON.stringify(res))
            
    //data to send to general metrics logging
    var date = new Date()
    var now = date.toISOString()
    // need to unwrap the request and response objects we actually want from the req object
    var unwrappedReq =req.req
    var unwrappedRes =req.res
    let jsonData = {};

    let redactEnabled = _.get(unwrappedReq, '_settings.ENABLE_REDACTING', "false");
    let redactRegex = _.get(unwrappedReq, '_settings.REDACTING_REGEX', "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b");

    if (redactEnabled === "true") {
        console.log("redact enabled");
        let re = new RegExp(redactRegex,"g");
        let unWrappedReqText = JSON.stringify(unwrappedReq).replace(re, 'XXXXX');
        let unWrappedResponseText = JSON.stringify(unwrappedRes).replace(re, 'XXXXX');
        jsonData = {
            entireRequest: { "value": unWrappedReqText},
            entireResponse: { "value": unWrappedResponseText},
            qid: _.get(unwrappedRes.result, "qid"),
            utterance: String(unwrappedReq.question).toLowerCase().replace(re, 'XXXXX').replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ""),
            answer: _.get(unwrappedRes, "message").replace(re, 'XXXXX'),
            topic: _.get(unwrappedRes.result, "t", ""),
            clientType: unwrappedReq._type,
            datetime: now
        }
    } else {
        console.log("redact disabled");
        jsonData = {
            entireRequest: unwrappedReq,
            entireResponse: unwrappedRes,
            qid: _.get(unwrappedRes.result, "qid"),
            utterance: String(unwrappedReq.question).toLowerCase().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ""),
            answer: _.get(unwrappedRes, "message"),
            topic: _.get(unwrappedRes.result, "t", ""),
            clientType: unwrappedReq._type,
            datetime: now
        }
    }

    // encode to base64 string to put into firehose and
    // append new line for proper downstream kinesis processing in kibana and/or athena queries over s3
    var objJsonStr = JSON.stringify(jsonData) + '\n';
    var firehose = new aws.Firehose()
    
    var params = {
          DeliveryStreamName: process.env.FIREHOSE_NAME, /* required */
          Record: { /* required */
            Data: new Buffer(objJsonStr) /* Strings will be Base-64 encoded on your behalf */ /* required */
        }
    }
    
    firehose.putRecord(params, function(err, data) {
      if (err) console.log(err, err.stack) // an error occurred
      else     console.log(data)          // successful response
    })
   
}