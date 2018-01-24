var Page = require('../page')

module.exports={
    pages:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.goToExport()
            await page.goToAlexa()
            await page.goToHooks()
            await page.goToEdit()
            await page.goToTest()
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    client:async function(test){
        try {
            var page=this.page
            await page.goToClient()
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}

