var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var util=require('./util')
var AWS=require('aws-sdk');
const qnabot = require("qnabot/logging")


function getDistinctValues(list,objectId,sortField){
    var dt = new Date();

    var distinctItems = [...new Set(list.map(item => item[objectId]))];
    var sortedItems = _.cloneDeep(list).sort((a,b) => {
        if(a[sortField] == b[sortField]){
            return 0;
        }
        return a["sortField"] < b["sortField"] ? 1 : -1
    });
    distinctItems = distinctItems.map(id => sortedItems.filter( item => item[objectId] == id ).reverse()[0])
    return distinctItems
}
async function update_userInfo(res) {
    var topics = _.get(res,"_userInfo.recentTopics",[])
    var distinctTopics= getDistinctValues(topics,"topic").slice(0,10)
    _.set(res,"_userInfo.recentTopics",distinctTopics)
    qnabot.log(res._userInfo)
    var userId = _.get(res,"_userInfo.UserName") && _.get(res,"_userInfo.isVerifiedIdentity") == "true" ? _.get(res,"_userInfo.UserName") : _.get(res,"_userInfo.UserId");
    _.set(res,"_userInfo.UserId",userId)
    var usersTable = process.env.DYNAMODB_USERSTABLE;
    var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    var params = {
        TableName: usersTable,
        Item: res._userInfo,
    };
    qnabot.log("Saving response user info to DynamoDB: ", params);
    var ddbResponse={}
    try {
        ddbResponse = await docClient.put(params).promise();
    }catch(e){
        qnabot.log("ERROR: DDB Exception caught - can't save userInfo: ", e)
    }
    qnabot.log("DDB Response: ", ddbResponse);
    return ddbResponse;
}

module.exports=async function userInfo(req,res){
    qnabot.log("Entering userInfo Middleware")

    await update_userInfo(res);
    return {req,res}
}

