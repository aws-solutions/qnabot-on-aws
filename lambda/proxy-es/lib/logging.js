//start connection
var Promise=require('bluebird')
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var url=require('url')
var _=require('lodash')
var myCredentials = new aws.EnvironmentCredentials('AWS'); 
var request=require('./request')

module.exports=function(req,res){
    console.log(req,res)
            
    //data to send to general metrics logging
    var date = new Date()
    var now = date.toISOString()
    var jsonData = {
        qid:_.get(res.result,"qid"),
        utterance:req.question,
        answer:_.get(res.message,"a"),
        topic:_.get(res.result,"t",""),
        clientType:req._type,
        datetime:now
    }
    // encode to base64 string to put into firehose
    var objJsonStr = JSON.stringify(jsonData);
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