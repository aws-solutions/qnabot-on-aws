var Promise=require('./promise')
exports.SUCCESS = "SUCCESS";
exports.FAILED = "FAILED";
 
exports.send = function(params,cb){
    return new Promise(function(res,rej){
    var responseBody = JSON.stringify({
        Status: params.responseStatus,
        Reason: params.reason,
        PhysicalResourceId: params.physicalResourceId || params.context.logStreamName,
        StackId: params.event.StackId,
        RequestId: params.event.RequestId,
        LogicalResourceId: params.event.LogicalResourceId,
        Data: params.responseData || {}
    });
 
    console.log("Response body:\n", responseBody);
 
    var https = require("https");
    var url = require("url");
 
    var parsedUrl = url.parse(params.event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
 
    var request = https.request(options, function(response) {
        console.log("Status code: " + response.statusCode);
        console.log("Status message: " + response.statusMessage);
        res()
    });
 
    request.on("error", function(error) {
        console.log("send(..) failed executing https.request(..): " + error);
        rej(error)
    });
 
    request.write(responseBody);
    request.end();
    })
}

