var lambda=require('../bin/lambda.js')
var mock=require('../bin/mock')
var Promise=require('bluebird')
var server
module.exports={
    setUp:function(cb){
        server=mock()
        cb()
    },
    tearDown:function(cb){
        server.close()
        cb()
    },
    role:function(test){
        lifecycle(require('./params/role'),test)
    },
    user:function(test){
        lifecycle(require('./params/user'),test)
    },
    clear:function(test){
        lifecycle(require('./params/s3-clear'),test)
    },
    unzip:function(test){
        lifecycle(require('./params/s3-unzip'),test)
    },
    register:function(test){
        lifecycle(require('./params/register'),test)
    },
    tokenDecode:function(test){
        lifecycle(require('./params/tokenDecode'),test)
    },
    token:function(test){
        lifecycle(require('./params/token'),test)
    },
    login:function(test){
        lifecycle(require('./params/login'),test)
    },
    variable:function(test){
        lifecycle(require('./params/var'),test)
    },
    random:function(test){
        lifecycle(require('./params/random'),test)
    },
    domain:function(test){
        lifecycle_chain(
            require('../lib/CognitoDomain'), 
            require('./params/domain'), 
            test
        )
    },
    domain:function(test){
        lifecycle_chain(
            require('../lib/CognitoUrl'), 
            require('./params/url'), 
            test
        )
    },
    clouddir:function(test){
        lifecycle(require('./params/clouddir'),test)
    },
    clouddirObject:function(test){
        lifecycle_chain(
            require('../lib/ClouddirObject'), 
            require('./params/clouddirObject'), 
            test
        )
    },
    clouddirIndex:function(test){
        lifecycle_chain(
            require('../lib/ClouddirIndex'), 
            require('./params/clouddirIndex'), 
            test
        )
    }
}

function lifecycle(params,test){
        return run(params.create,test)
        .then(()=>run(params.update,test))
        .then(()=>run(params.delete,test))
        .finally(test.done)
}

function lifecycle_chain(lib,params,test){
    var tmp=Promise.promisifyAll(new lib())
   
    Promise.join(
        params.create(),
        params.update(),
        params.delete()
    ).spread(function(c,u,d){
        return tmp.CreateAsync(c.ResourceProperties)
        .tap(test.ok)
        .log("Create Complete")
        .then(id=>tmp.UpdateAsync(id,
            c.ResourceProperties,
            u.ResourceProperties
        ))
        .log("Update Complete")
        .tap(test.ok)
        .then(id=>tmp.DeleteAsync(id,u.ResourceProperties))
        .log("Delete Complete")
        .tap(test.ok)
    })
    .catch(test.error)
    .finally(test.done)
}

function run(params,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .catch(test.ifError)
}
