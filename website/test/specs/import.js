var Page = require('../page')
module.exports={
    file:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.importFile(`${__dirname}/../../../docs/zombie.json`)
            await page.goToEdit()
            var ids=await page.listQA()
            test.equal(ids.value.length,3) 
            
            await page.deleteAll()
            
            var ids2=await page.listQA()
            test.equal(ids2.value.length,0) 
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    url:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.importUrl("https://raw.githubusercontent.com/awslabs/aws-ai-qna-bot/master/docs/blog-samples.json")
            await page.goToEdit()
            var ids=await page.listQA()
            test.equal(ids.value.length,8) 
            
            await page.deleteAll()
            
            var ids2=await page.listQA()
            test.equal(ids2.value.length,0) 
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
    },
    examples:async function(test){
        try {
            var page=this.page
            await page.goToImport()
            await page.importExample("zombie.json")
            await page.goToEdit()
            var ids=await page.listQA()
            test.equal(ids.value.length,3) 
            
            await page.deleteAll()
            
            var ids2=await page.listQA()
            test.equal(ids2.value.length,0) 
            test.done()
        }catch(e){ 
            test.ifError(e)
            test.done()
        }
        test.done()
    }
}
        
