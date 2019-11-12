var _=require('lodash');
var Promise=require('bluebird');
var util=require('./util');
var jwt=require('./jwt');
var AWS=require('aws-sdk');


async function get_userInfo(userId, idattrs) {
    var default_userInfo = {
        UserId:userId,
        InteractionCount:0
    };
    var usersTable = process.env.DYNAMODB_USERSTABLE;
    var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    var params = {
        TableName: usersTable,
        Key: {
            'UserId': userId
        },
    };
    console.log("Getting user info for user: ", userId, "from DynamoDB table: ", usersTable);
    var ddbResponse = {};
    try {
        ddbResponse = await docClient.get(params).promise();
    }catch(e){
        console.log("DDB Exception caught.. can't retrieve userInfo: ", e)
    }
    console.log("DDB Response: ", ddbResponse);
    var req_userInfo = _.get(ddbResponse,"Item",default_userInfo);
    // append user identity attributes if known
    if (_.get(idattrs,'preferred_username')) {
        _.set(req_userInfo, 'UserName', _.get(idattrs,'preferred_username'));
    }
    if (_.get(idattrs,'given_name')) {
        _.set(req_userInfo, 'GivenName', _.get(idattrs,'given_name'));
    }
    if (_.get(idattrs,'family_name')) {
        _.set(req_userInfo, 'FamilyName', _.get(idattrs,'family_name'));
    }
    if (_.get(idattrs,'email')) {
        _.set(req_userInfo, 'Email', _.get(idattrs,'email'));
    }
    if (_.get(idattrs,'verifiedIdentity')) {
        _.set(req_userInfo, 'isVerifiedIdentity', _.get(idattrs,'verifiedIdentity'));
    }
    // append time since last seen
    var now = new Date();
    var lastSeen = Date.parse(req_userInfo.LastSeen || "1970/1/1 12:00:00");
    var timeSinceLastInteraction = Math.abs(now - lastSeen)/1000; // seconds
    _.set(req_userInfo, 'TimeSinceLastInteraction', timeSinceLastInteraction);
    console.log("Request User Info: ", req_userInfo);
    return req_userInfo;
}

async function update_userInfo(userId, req_userInfo) {
    var res_userInfo = _.cloneDeep(req_userInfo);
    var dt = new Date();
    res_userInfo.FirstSeen = req_userInfo.FirstSeen || dt.toString();
    res_userInfo.LastSeen = dt.toString();
    res_userInfo.InteractionCount = req_userInfo.InteractionCount + 1;
    console.log("Response User Info: ", res_userInfo);
    return res_userInfo;
}

module.exports=async function preprocess(req,res){

    // lex-web-ui: If idtoken session attribute is present, decode it
    var idtoken = _.get(req,'_event.sessionAttributes.idtokenjwt');
    var idattrs={};
    if (idtoken) {
        var decoded = jwt.decode(idtoken);
        if (decoded) {
            idattrs = _.get(decoded,'payload');
            console.log("Decoded idtoken:",idattrs);
            var kid = _.get(decoded,'header.kid');
            var default_jwks_url = [_.get(req,'_settings.DEFAULT_USER_POOL_JWKS_URL')];
            var identity_provider_jwks_url = _.get(req,'_settings.IDENTITY_PROVIDER_JWKS_URLS');
            var urls = default_jwks_url.concat(identity_provider_jwks_url);
            console.log("Attempt to verify idtoken using jwks urls:",urls);
            var verified_url = await jwt.verify(kid,urls) ;
            if (verified_url) {
                _.set(idattrs,'verifiedIdentity',"true");
                console.log("Verified identity with:",verified_url);
            } else {
                _.set(idattrs,'verifiedIdentity',"false");
                console.log("Unable to verify identity for any configured IdP jwks urls");
            }     
        } else {
            console.log("Invalid idtokenjwt - cannot decode");
        }
    }
    // Add _userInfo to req, from UsersTable
    // TODO Will need to rework logic if/when we link userid across clients (SMS,WebUI,Alexa)
    var userId = req._userId;
    var req_userInfo = await get_userInfo(userId, idattrs);
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
