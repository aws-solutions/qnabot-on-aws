var Page = require('../page')

module.exports={
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
    },
    refresh:async function(test){
        try {
            var page=new Page()
            await page.open()
            await page.login()
            await page.refresh()
            await page.close().then(()=>test.done())
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}

