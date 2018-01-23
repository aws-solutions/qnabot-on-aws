var Page = require('./page')

module.exports={
    /*workflows:{
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
    },*/
    login:async function(test){
        try {
            var page=new Page()
            await page.open()
            await page.login()
            await page.logout()
            await page.waitTillTitle("Signin") 
            await page.close().then(()=>test.done())
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}

