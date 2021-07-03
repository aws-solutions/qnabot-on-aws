
const filter = text => {
    if (process.env.CLOUDWATCHLOGGINGDISABLED === "true"){
        return "cloudwatch logging disabled";
    } else {
        if (process.env.QNAREDACT === "true") {
            let re = new RegExp(process.env.REDACTING_REGEX, "g");
            return text.replace(re, "XXXXXX");
        } else {
            return text;
        }
    }
}

require('intercept-stdout')(filter, filter);

exports.qid=require('/opt/lib/qid')
exports.logging=require('/opt/lib/logging')
exports.cleanmetrics=require('/opt/lib/cleanmetrics')
exports.utterances=require('/opt/lib/utterances')
exports.handler =require('/opt/lib/handler') 

exports.query=function(event,context,callback){
    require('./lib/query')(event.req,event.res)
    .then((x)=>callback(null,x)) 
    .catch(callback)
}

