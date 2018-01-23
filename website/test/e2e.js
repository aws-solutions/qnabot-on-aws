var outputs=require('../../bin/exports')('dev/master',{wait:true})
var client = require('./browser')
var user=require('./user-config')

module.exports={
    workflows:{
        create:function(test){
            test.ok(true)
            this.client.then(()=>test.done())
        },
        bulk:require('./specs/bulk'),
        client:function(test){
            test.ok(true)
            this.client.then(()=>test.done())
        },
        setUp:function(cb){
            var self=this
            this.client=client.init().login().then(()=>cb())
        },
        tearDown:function(cb){
            this.client.logout().end().then(()=>cb())
        }
    },
    login:function(test){
        var self=this
        return client.init().login().logout()
        .waitUntil(function(){
            return this.getTitle().then(title=>{
                return title==="Signin"
                test.ok(true)
            })
        },5000)
        .catch(err=>{
            console.log(err)
            test.ifError(err)
        })
        .finally(test.done)
    }
}
