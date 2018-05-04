var outputs=require('../../../bin/exports')('dev/master',{wait:true})
var user=require('../user-config')
var Promise=require('bluebird')

module.exports=(A)=>class auth extends A{
    login(){
        var self=this
        return outputs.then(function(output){
            self.client=self.client.url(output.DesignerLogin)
            .execute(function(username,password){
                document.querySelector('#username').value=username
                document.querySelector('#password').value=password
                document.querySelector('input[name="signInSubmitButton"]').click()
            },user.username,user.password)
            .waitUntil(function(){
                return this.getUrl().then(x=>x.match(/.*#\/edit/))
            },3000)
            
            return self.client
        })
        .catch(console.log)
    }
    logout(){
        this.client=this.client.waitForVisible('#logout-button')
        .execute(function(username,password){
            document.getElementById('logout-button').click()
        },user.username,user.password)
        return Promise.resolve(this.client)
    }
}
