var _=require('lodash')
var util=require('./util')
const qnabot = require("qnabot/logging")


module.exports = async function hook(req,res) {
    
    // handle list of lambda hooks, from possible qid merge after conditional chaining
    var lambdahooks = _.get(res.result, "lambdahooks",[]);
    // no lambdahooks array (no previous chaining), so initialise array from 'l' and 'args' fields
    if ( lambdahooks.length == 0 ) {
        lambdahooks = [
                {
                    l:      _.get(res.result, "l"),
                    args:   _.get(res.result, "args",[]),
                }
            ];
    }
     _.set(req,"_fulfillment.step","lambdahook")
   
    var event = {req,res};
    var i=0;
    while (i<lambdahooks.length) {
        if (lambdahooks[i].l) {
            event.res.result.l = lambdahooks[i].l;
            event.res.result.args = lambdahooks[i].args ;
            qnabot.log("Lambda Hook ", i, ": ", lambdahooks[i].l, " => Args: ", lambdahooks[i].args);
            let arn=util.getLambdaArn(lambdahooks[i].l);
            if (arn) {
                event = await util.invokeLambda({
                    FunctionName:arn,
                    req:event.req,
                    res:event.res
                }) ;            
            }
        }  
        i=i+1 ;
    }
    req = event.req
    res = event.res

    console.log(JSON.stringify(event))
    let posthook = _.get(req,'_settings.LAMBDA_POSTPROCESS_HOOK',undefined)
    _.set(req,"_fulfillment.step","postprocess")
    if(posthook){
         event = await util.invokeLambda({
            FunctionName:posthook,
            req,res
        })
    }
        _.set(req,"_fulfillment.step","")

    return event;
}
