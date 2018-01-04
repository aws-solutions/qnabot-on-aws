var lambda=require('../bin/lambda.js')
var mock=require('../bin/mock')
var Promise=require('bluebird')
var aws=require('../lib/util/aws')
var api=new aws.APIGateway()
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
    api:{
        tearDown:function(cb){
            setTimeout(()=>cb(),2000)
        },
        compress:function(test){
            lifecycle(require('./params/api.compress'),test)
        },
        deploy:function(test){
            var lib=require('../lib/ApiDeployment')
            var params=require('./params/api.deploy')
            var tmp=Promise.promisifyAll(new lib())
            var oldId
            Promise.join(
                params.create(),
                params.update(),
                params.delete()
            ).spread(function(c,u,d){
                return tmp.CreateAsync(c.ResourceProperties).delay(2000)
                .tap(test.ok)
                .log("Create Complete")
                .tap(id=>oldId=id)
                .then(id=>tmp.UpdateAsync(id,
                    c.ResourceProperties,
                    u.ResourceProperties
                ).delay(2000))
                .log("Update Complete")
                .tap(test.ok)
                .then(id=>tmp.DeleteAsync(oldId,u.ResourceProperties))
                .log("Delete Complete")
                .tap(test.ok)
            })
            .catch(test.error)
            .finally(test.done)

            
        }
    },
    lex:require('./lex'),
    es:function(test){
        lifecycle(require('./params/es'),test)
    },
    role:function(test){
        lifecycle(require('./params/role'),test)
    },
    clear:function(test){
        lifecycle(require('./params/s3-clear'),test)
    },
    version:function(test){
        lifecycle(require('./params/s3-version'),test)
    },
    unzip:function(test){
        lifecycle(require('./params/s3-unzip'),test)
    },
    login:function(test){
        lifecycle(require('./params/login'),test)
    },
    variable:function(test){
        lifecycle(require('./params/var'),test)
    },
    domain:function(test){
        lifecycle_chain(
            require('../lib/CognitoDomain'), 
            require('./params/domain'), 
            test
        )
    },
    url:function(test){
        lifecycle(require('./params/url'),test)
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
