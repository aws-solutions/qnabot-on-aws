var Page = require('../page')
module.exports={
    file:async function(test){
        try {
            var page=new Page()
            await page.open()
            await page.login()
            await page.goToImport()
            await page.importFile(`${__dirname}/../../../docs/zombie.json`)
            await page.goToEdit()
            await page.listQA().then(function(ids){
                test.equal(ids.value.length,3) 
            })
            await page.close().then(()=>test.done())
        }catch(e){ 
            test.ifError(e)
            test.done()
        }

        /* 
        .waitForVisible("tbody")
        .waitForVisible("#qa-zombie-1")
        .log("browser").then(
            x=>console.log(
            x.value
            .filter(y=>y.source="console-api")
            .map(y=>y.message)
        )).then(()=>test.done())
        .catch(console.log)*/
    },
    url:function(test){
        test.done()
    }
    
}
        
