var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        es(event).then(function(result){
            var tmp1=result[Object.keys(result)[0]].mappings
            var schema=tmp1[Object.keys(tmp1)[0]]
            var out=schema._meta.schema
            
            Object.keys(schema.properties)
                .filter(x=>!['_meta','qid','a','q','r','l','t'].includes(x))
                .filter(x=>!x.match(/_.*/))
                .forEach(x=>out.properties[x]={
                    type:"string",
                    title:x
                })
            delete out.properties.questions
            test2string(out)
            callback(null,out)
        })
        .catch(callback)
    } catch(e){
        callback(e)
    }
}
function test2string(obj){
    console.log(obj) 
    if(obj.type==="text"){
        obj.type="string"
    }

    if(obj.properties){
        Object.keys(obj.properties)
        .map(x=>test2string(obj.properties[x]))
    }
    if(obj.items){
        test2string(obj.items)
    }
}
es = (event) => {
    return new Promise(function(res,rej){
        var endpoint =  new aws.Endpoint(event.endpoint);
        var req = new aws.HttpRequest(endpoint);

        req.method = event.method 
        req.path = event.path
        req.region =aws.config.region;
        if(event.body){
            if(Array.isArray(event.body)){
                req.body=event.body.map(JSON.stringify).join('\n')
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
                    respond(httpResp,body,res,rej)
                });
            }, 
            function(err) {
                console.log('Error: ' + err);
                rej(err)
            }
        );
    }
)}

function respond(httpResp,body,res,rej){
    var status=httpResp.statusCode.toString()
    console.log("status:"+status)
    if(status.match(/2../)){
        console.log("Response:" + body)
        try{
            var out=JSON.parse(body)
            res(out) 
        }catch(e){
            res(out) 
        }
    }else{
        console.log(httpResp.statusMessage)
        rej(status)
    }
}
