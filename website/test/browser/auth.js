var outputs=require('../../../bin/exports')('dev/master',{wait:true})
var user=require('../user-config')

module.exports=function(browser){
    browser.addCommand("login",function(){
        var self=this
        return outputs.then(function(output){
            return self.url(output.ContentDesignerLogin)
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
        })
        .tap(()=>console.log("logged in"))
    })

    browser.addCommand("logout",function(){
        return this.waitForVisible('#logout-button')
        .execute(function(username,password){
            document.getElementById('logout-button').click()
        },user.username,user.password)
    })
}
    
