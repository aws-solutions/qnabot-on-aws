//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')

function processKeysForRegEx(obj, re) {
    Object.keys(obj).forEach(function(key,index) {
        let val = obj[key];
        if (_.isPlainObject(val)) {
            processKeysForRegEx(val, re);
        } else if ( key === "slot") {
            val = val.replace(re,'XXXXX');
            obj[key] = val;
        } else if ( key === "recentIntentSummaryView") {
            if (val) {
                processKeysForRegEx(val, re);
            }
        } else {
            if (typeof val === 'string') {
                val = val.replace(re,'XXXXX');
                obj[key] = val;
            }
        }
    });
}

module.exports=function(req,res){
    //data to send to general metrics logging
    var date = new Date()
    var now = date.toISOString()
    // need to unwrap the request and response objects we actually want from the req object
    var unwrappedReq =req.req
    var unwrappedRes =req.res

    let redactEnabled = _.get(unwrappedReq, '_settings.ENABLE_REDACTING', "false");
    let redactRegex = _.get(unwrappedReq, '_settings.REDACTING_REGEX', "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b");

    if (redactEnabled === "true") {
        console.log("redact enabled");
        let re = new RegExp(redactRegex, "g");
        processKeysForRegEx(unwrappedReq, re);
        processKeysForRegEx(unwrappedRes, re);
        console.log("RESULT",JSON.stringify(req).replace(re, 'XXXXX'),JSON.stringify(res).replace(re, 'XXXXX'));
    } else {
        console.log("RESULT",JSON.stringify(req),JSON.stringify(res));
    }

    let jsonData = {
        entireRequest: unwrappedReq,
        entireResponse: unwrappedRes,
        qid: _.get(unwrappedRes.result, "qid"),
        utterance: String(unwrappedReq.question).toLowerCase().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ""),
        answer: _.get(unwrappedRes, "message"),
        topic: _.get(unwrappedRes.result, "t", ""),
        clientType: unwrappedReq._type,
        datetime: now
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