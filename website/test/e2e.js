var webdriverio = require('webdriverio');
var outputs=require('../../bin/exports')('dev/master',{wait:true})
var options = { 
    desiredCapabilities: { browserName: 'chrome' } 

};
var client = webdriverio.remote(options);
var user=require('./lib/user')
module.exports={
    setUp:function(cb){
        var self=this
        user.create().then(function(result){
            self.username=result.username
            self.password=result.password
        })
        .then(cb)
    },
    login:function(test){
        outputs.then(function(output){
            console.log(output.ContentDesignerLogin)
            return client.init()
            .url(output.ContentDesignerLogin)
            .getUrl()
            .then(console.log)
            .catch(console.log)
        })
        .finally(test.done)
    },
    tearDown:function(cb){
        user.delete(this.username).finally(cb)
    }
}
