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
            obj[key] = val.replace(re,'XXXXX');
        } else if ( key === "recentIntentSummaryView") {
            if (val) {
                processKeysForRegEx(val, re);
            }
        } else {
            if (typeof val === 'string') {
                obj[key] = val.replace(re,'XXXXX');
            }
        }
    });
}

function stringifySessionAttribues(res) {
    var sessionAttrs = _.get(res,"session",{}) ;
    for (var key of Object.keys(sessionAttrs)) {
        if (typeof sessionAttrs[key] != 'string') {
            sessionAttrs[key]=JSON.stringify(sessionAttrs[key]);
        }
    }
}

module.exports=function(event, context, callback){
    //data to send to general metrics logging
    var date = new Date()
    var now = date.toISOString()
    // need to unwrap the request and response objects we actually want from the req object
    var req =event.req
    var res =event.res
    var sessionAttributes = _.cloneDeep(_.get(res,"session",{}));
    
    // response session attributes are logged as JSON string values to avoid 
    // ES mapping errors after upgrading from previous releases.
    stringifySessionAttribues(res);

    let redactEnabled = _.get(req, '_settings.ENABLE_REDACTING');
    let redactRegex = _.get(req, '_settings.REDACTING_REGEX', "\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b");
    let cloudwatchLoggingDisabled = _.get(req, '_settings.DISABLE_CLOUDWATCH_LOGGING');

    if (cloudwatchLoggingDisabled) {
        console.log("RESULT", "cloudwatch logging disabled");
    } else {
        if (redactEnabled) {
            console.log("redact enabled");
            let re = new RegExp(redactRegex, "g");
            processKeysForRegEx(req, re);
            processKeysForRegEx(res, re);
            processKeysForRegEx(sessionAttributes, re);
            console.log("RESULT", JSON.stringify(event).replace(re, 'XXXXX'));
        } else {
            console.log("RESULT", JSON.stringify(event));
        }
    }

    let jsonData = {
        entireRequest: req,
        entireResponse: res,
        qid: _.get(res.result, "qid"),
        utterance: String(req.question).toLowerCase().replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g, ""),
        answer: _.get(res, "message"),
        topic: _.get(res.result, "t", ""),
        session: sessionAttributes,
        clientType: req._clientType,
        datetime: now
    }

    if (cloudwatchLoggingDisabled) {
        jsonData.entireRequest = undefined;
        jsonData.utterance = undefined;
        jsonData.session = undefined;
    }
    // encode to base64 string to put into firehose and
    // append new line for proper downstream kinesis processing in kibana and/or athena queries over s3
    var objJsonStr = JSON.stringify(jsonData) + '\n';
    var firehose = new aws.Firehose()
    
    var params = {
          DeliveryStreamName: process.env.FIREHOSE_NAME, /* required */
          Record: { /* required */
            Data: Buffer.from(objJsonStr) /* Strings will be Base-64 encoded on your behalf */ /* required */
        }
    }
    
    firehose.putRecord(params, function(err, data) {
      if (err) console.log(err, err.stack) // an error occurred
      else     console.log(data)          // successful response
    })
   
}
