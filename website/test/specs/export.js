var Page = require('../page')
module.exports={
    all:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.importFile(`${__dirname}/../../../docs/zombie.json`)
            await page.goToExport()
            await page.exportAll()
            await page.goToEdit() 
            await page.deleteAll()
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    filter:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.importFile(`${__dirname}/../../../docs/zombie.json`)
            await page.goToExport()
            await page.exportFilter("zombie")
            await page.exportFilter("not-here")
            await page.goToEdit() 
            await page.deleteAll()
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    }
}
        
