var webdriverio = require('webdriverio');
var outputs=require('../../bin/exports')('dev/master',{wait:true})
var options = { 
    desiredCapabilities: { browserName: 'chrome' } 
};
var client = webdriverio.remote(options);
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
            console.log("logging in")
            outputs.then(function(output){
                self.client=client.init()
                .url(output.ContentDesignerLogin)
                .execute(function(username,password){
                    document.querySelector('#username').value=username
                    document.querySelector('#password').value=password
                    document.querySelector('input[name="signInSubmitButton"]').click()
                },user.username,user.password)
                .waitUntil(function(){
                    return this.getTitle().then(title=>{
                        return title==="QnABot Designer"
                    })
                },5000)
                return self.client
            })
            .then(()=>{
                cb()
            })
        },
        tearDown:function(cb){
            this.client.waitForVisible('#logout-button')
            .execute(function(username,password){
                document.getElementById('logout-button').click()
            },user.username,user.password)
            .end()
            .then(()=>cb())
        }
    },
    login:function(test){
        var self=this
        outputs.then(function(output){
            console.log(output.ContentDesignerLogin)
            return client.init()
            .url(output.ContentDesignerLogin)
            .getTitle().then(title=>test.equal(title,"Signin"))
            .execute(function(username,password){
                document.querySelector('#username').value=username
                document.querySelector('#password').value=password
                document.querySelector('input[name="signInSubmitButton"]').click()
            },user.username,user.password)
            .waitUntil(function(){
                return this.getTitle().then(title=>{
                    console.log(title)
                    return title==="QnABot Designer"
                })
            },5000)
            .waitForVisible('#logout-button')
            .execute(function(username,password){
                document.getElementById('logout-button').click()
            },user.username,user.password)
            .waitUntil(function(){
                return this.getTitle().then(title=>{
                    console.log(title)
                    return title==="Signin"
                })
            },5000)
            .then(console.log)
            .catch(err=>{
                console.log(err)
                test.ifError(err)
            })
        })
        .finally(test.done)
    }
}
