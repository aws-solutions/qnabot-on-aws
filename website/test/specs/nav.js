var Page = require('../page')

module.exports={
    pages:async function(test){
        try {
            var page=new Page()
            await page.open()
            await page.login()
            await page.goToImport()
            await page.goToExport()
            await page.goToAlexa()
            await page.goToHooks()
            await page.goToEdit()
            await page.goToTest()
            await page.close().then(()=>test.done())
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    client:async function(test){
        try {
            var page=new Page()
            await page.open()
            await page.login()
            await page.goToClient()
            await page.close().then(()=>test.done())
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}

