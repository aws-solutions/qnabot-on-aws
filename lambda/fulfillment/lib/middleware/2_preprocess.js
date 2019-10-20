var _=require('lodash');
var Promise=require('bluebird');
var util=require('./util');
var AWS=require('aws-sdk');

async function get_userInfo(userId, idtoken_payload) {
    var default_userInfo = {
        UserId:{S:userId},
        UserName:{S:"None"},
        GivenName: {S: "None"},
        FamilyName: {S: "None"},
        Email: {S: "None"},
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
    _.set(req_userInfo, 'UserName.S', _.get(idtoken_payload,'preferred_username',"None"));
    _.set(req_userInfo, 'GivenName.S', _.get(idtoken_payload,'given_name',"None"));
    _.set(req_userInfo, 'FamilyName.S', _.get(idtoken_payload,'family_name',"None"));
    _.set(req_userInfo, 'Email.S', _.get(idtoken_payload,'email',"None"));
    console.log("Request User Info: ", req_userInfo);
    return req_userInfo;
}

async function update_userInfo(userId, req_userInfo) {
    var res_userInfo = _.cloneDeep(req_userInfo);
    var dt = new Date();
    res_userInfo.FirstSeen.S = req_userInfo.FirstSeen.S || dt.toString();
    res_userInfo.LastSeen.S = dt.toString();
    res_userInfo.InteractionCount.N = (parseInt(req_userInfo.InteractionCount.N) + 1).toString();
    console.log("Response User Info: ", res_userInfo);
    return res_userInfo;
}

module.exports=async function preprocess(req,res){

    // lex-web-ui: If idtoken session attribute is present, decode it
    var idtoken = _.get(req,'_event.sessionAttributes.idtokenjwt');
    var idtoken_payload={};
    if (idtoken) {
        idtoken_payload = util.jwtdecode(idtoken);
        console.log("Decoded idtoken:",idtoken_payload)
    }
    // Add _userInfo to req, from UsersTable
    // TODO Will need to rework logic if/when we link userid across clients (SMS,WebUI,Alexa)
    var userId = req._userId;
    var req_userInfo = await get_userInfo(userId, idtoken_payload);
    _.set(req,"_userInfo", req_userInfo);
    // Add _userInfo to res, with updated timestamps
    // May be further modified by lambda hooks
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
