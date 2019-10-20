var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var util=require('./util')
var AWS=require('aws-sdk');

async function update_userInfo(res) {
    var dt = new Date();
    var usersTable = process.env.DYNAMODB_USERSTABLE;
    var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    var params = {
        TableName: usersTable,
        Item: res._userInfo,
    };
    console.log("Saving response user info to DynamoDB: ", params);
    var ddbResponse={}
    try {
        ddbResponse = await docClient.put(params).promise();
    }catch(e){
        console.log("ERROR: DDB Exception caught - can't save userInfo: ", e)
    }
    console.log("DDB Response: ", ddbResponse);
    return ddbResponse;
}

module.exports=async function userInfo(req,res){
    console.log("Entering userInfo Middleware")
    await update_userInfo(res);
    return {req,res}
}
