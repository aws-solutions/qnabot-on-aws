process.env.AWS_PROFILE=require('../../../config').profile
process.env.AWS_DEFAULT_REGION=require('../../../config').profile
var handler=require('./handler').handler
module.exports={
    get:function(test){
        handler({
            fnc:'getBots',
            params:{maxResults:2}
        },{},function(err,result){
            console.log("error",err)
            console.log("result:",JSON.stringify(result,null,2))
            test.ifError(err)
            test.ok(result)
            test.done()
        })
    }
}
