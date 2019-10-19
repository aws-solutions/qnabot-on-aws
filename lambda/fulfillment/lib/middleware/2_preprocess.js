var util=require('./util')
var _=require('lodash')
var Promise=require('bluebird');
var AWS=require('aws-sdk');

async function get_userInfo(userId) {
    var default_userInfo = {
        UserId:{S:userId},
        UserName:{S:"None"},
        FirstSeen:{S:""},
        LastSeen:{S:""},
        InteractionCount:{N:0},
        UserProperties:{S:JSON.stringify({})},
    };
    var usersTable = process.env.DYNAMODB_USERSTABLE;
    var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    var params = {
        TableName: usersTable,
        Key: {
            'UserId': {S: userId}
        },
    };
    console.log("Getting user info for user: ", userId, "from DynamoDB table: ", usersTable);
    var ddbResponse = {};
    try {
        ddbResponse = await ddb.getItem(params).promise();
    }catch(e){
        console.log("DDB Exception caught.. can't retrieve userInfo: ", e)
    }
    console.log("DDB Response: ", ddbResponse);
    var req_userInfo = _.get(ddbResponse,"Item",default_userInfo);
    console.log("Request User Info: ", req_userInfo);
    return req_userInfo;
}

async function update_userInfo(userId, req_userInfo) {
    var dt = new Date();
    var userName = req_userInfo.UserName.S;
    var firstSeen = req_userInfo.FirstSeen.S || dt.toString();
    var lastSeen = dt.toString();
    var interactionCount = (parseInt(req_userInfo.InteractionCount.N) + 1).toString();
    var userProperties = req_userInfo.UserProperties.S;
    var res_userInfo = {
        'UserId': {S: userId},
        'UserName': {S: userName},
        'FirstSeen': {S: firstSeen},
        'LastSeen': {S: lastSeen},
        'InteractionCount': {N: interactionCount},
        'UserProperties': {S: userProperties},
    };
    console.log("Response User Info: ", res_userInfo);
    return res_userInfo;
}

module.exports=async function preprocess(req,res){

    // Add _userInfo to req, from UsersTable
    var userId = req._userId;
    var req_userInfo = await get_userInfo(userId);
    _.set(req,"_userInfo", req_userInfo);
    // Add _userInfo to res, with updated timestamps
    // May be further mofified by lambda hooks
    // Will be saved back to DynamoDB in userInfo.js
    var res_userInfo = await update_userInfo(userId, req_userInfo);
    _.set(res,"_userInfo", res_userInfo);
    
    _.set(req,"_info.es.address",process.env.ES_ADDRESS)
    _.set(req,"_info.es.index",process.env.ES_INDEX)
    _.set(req,"_info.es.type",process.env.ES_TYPE)
    _.set(req,"_info.es.service.qid",process.env.ES_SERVICE_QID)
    _.set(req,"_info.es.service.proxy",process.env.ES_SERVICE_PROXY)
    
    if(process.env.LAMBDA_PREPROCESS){
        return await util.invokeLambda({
            FunctionName:process.env.LAMBDA_PREPROCESS,
            req,res
        })
    }else{
        return {req,res}
    }
}
