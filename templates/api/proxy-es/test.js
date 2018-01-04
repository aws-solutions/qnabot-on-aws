process.env.AWS_PROFILE=require('../../../config').profile
process.env.AWS_DEFAULT_REGION=require('../../../config').profile
var handler=require('./handler').handler
var env=require('../../../bin/exports')()

module.exports={
    head404:function(test){    
        env.then(function(envs){
        handler({
            endpoint:envs["QNA-DEV-MASTER-ES"],
            method:'HEAD',
            path:"/test/test/test",
        },{},function(error,result){
            console.log("error:",error)
            test.ok(error)
            console.log("result:",JSON.stringify(result,null,2))
            test.done()
        })
        })
    }
}
