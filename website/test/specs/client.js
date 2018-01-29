var Page = require('../page')

module.exports={
    setUp:async function(done){
        await this.page.goToImport()
        await this.page.importFile(`${__dirname}/../../../docs/zombie.json`)
        await this.page.goToClient()
        done()
    },
    textResponse:async function(test){
        await this.page.ask("what is a zombie")
        var anwser=await this.page.getAnwser()

        test.ok(anwser.match('zombie'))
        test.done()
    },
    cardResponse:async function(test){
        test.done()
    },
    tearDown:async function(done){
        await this.page.goToEdit()
        await this.page.deleteAll()
        done()
    }
}

