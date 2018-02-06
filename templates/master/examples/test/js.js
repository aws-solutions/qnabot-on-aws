var Promise=require('bluebird')
module.exports={
    hello:async function(test){
        var handler=Promise.promisifyAll(require('../js/hello')).handlerAsync
        var result=await handler({
            req:{},
            res:{message:"this is the message"}
        },null)
        console.log(result)
        test.done()
    }
}
