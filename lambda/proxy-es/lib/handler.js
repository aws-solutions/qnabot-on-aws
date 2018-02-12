var Url=require('url')
var Promise=require('bluebird')
var request=require('./request')

module.exports= (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    request({
        url:Url.resolve("https://"+event.endpoint,event.path),
        method:event.method,
        body:event.body 
    })
    .tap(x=>console.log(JSON.stringify(x)))
    .tapCatch(x=>console.log(x))
    .then(result=>callback(null,result))
    .catch(error=>callback(JSON.stringify({
        type:error.response.status===404 ? "[NotFoud]" : "[InternalServiceError]",
        status:error.response.status,
        message:error.response.statusText,
        data:error.response.data
    })))
}
