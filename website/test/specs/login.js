var Page = require('../page')

module.exports={
    login:async function(test){
        try {
            var page=this.page
            await page.logout()
            await page.waitTillTitle("Signin") 
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    refresh:async function(test){
        try {
            var page=this.page
            await page.refresh()
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}

