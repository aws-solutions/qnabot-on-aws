var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    var endpoint =  new aws.Endpoint(event.endpoint);
    var req = new aws.HttpRequest(endpoint);

    req.method = event.method 
    req.path = event.path
    req.region =aws.config.region;
    if(event.body){
        if(Array.isArray(event.body)){
            req.body=event.body.map(JSON.stringify).join('\n')+'\n'
        }else{
            req.body = JSON.stringify(event.body)
        }
    }
    req.headers['presigned-expires'] = false;
    req.headers['Host'] = endpoint.host;

    // Sign the request (Sigv4)
    var signer = new aws.Signers.V4(req, 'es');
    signer.addAuthorization(aws.config.credentials, new Date());

    // Post document to ES
    var send = new aws.NodeHttpClient();
    send.handleRequest(req, null, 
        function(httpResp) {
            var body = '';
            httpResp.on('data', function (chunk) {
                body += chunk;
            });
            httpResp.on('end', function (chunk) {
                respond(httpResp,body,callback)
                
            });
        }, 
        function(err) {
            console.log('Error: ' + err);
            callback("Error: "+err);
        }
    );
}

function respond(httpResp,body,callback){
    var status=httpResp.statusCode.toString()
    console.log("status:"+status)
    if(status.match(/2../)){
        console.log("Response:" + body)
        try{
            var out=JSON.parse(body)
            callback(null,out)
        }catch(e){
            callback(null,out)
        }
    }else{
        callback("Error:"+status)
    }
}
