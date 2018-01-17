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
        var self=this
        console.log(self.password)
        outputs.delay(2*2000).then(function(output){
            console.log(output.ContentDesignerLogin)
            return client.init()
            .url(output.ContentDesignerLogin)
            .getTitle().then(title=>test.equal(title,"Signin"))
            .execute(function(username,password){
                document.querySelector('#username').value=username
                document.querySelector('#password').value=password
                document.querySelector('input[name="signInSubmitButton"]').click()
            },self.username,self.password)
            .waitUntil(function(){
                return this.getTitle().then(title=>{
                    console.log(title)
                    return title==="QnABot Designer"
                })
            },5000)
            .then(console.log)
            .catch(err=>{
                console.log(err)
                test.ifError(err)
            })
        })
        .finally(test.done)
    },
    tearDown:function(cb){
        user.delete(this.username).finally(cb)
    }
}
