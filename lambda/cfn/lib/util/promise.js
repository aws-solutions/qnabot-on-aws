var Promise=require('bluebird')
var aws=require('aws-sdk')

aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.AWS_REGION || 'us-east-1'
aws.config.signatureVersion='v4'
var cw=new aws.CloudWatchLogs()

Promise.if=function(test,func){
    return Promise.resolve().if(test,func)
}

Promise.prototype.if=function(test,func){
    var self=this
    if(typeof test === 'function'){
        return self.then(function(result){
            return test(result) ? self.then(func) : self
        })
    }else{
        return test ? self.then(func) : self
    }
}

Promise.prototype.log=function(label){
    return this.tap(x=>console.log(label,x))
}
Promise.prototype.logCatch=function(label){
    return this.tapCatch(x=>console.log(label,x))
}
Promise.prototype.retry=function(fnc,retries=10){
    return this.then(function(results){
        return Promise.retry(()=>fnc(results),retries)
    })
}
Promise.retry=function(fnc,retries=10){
    return new Promise(function(res,rej){
        var next=function(count){
            console.log("retries left:"+count)
            fnc().then(res).catch(function(err){
                if(count>0){
                    return setTimeout(()=>next(--count),1000)
                }else{
                    rej(err)
                }
            })
        }
        next(retries)
    })
}

module.exports=Promise
