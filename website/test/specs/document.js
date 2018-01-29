var Page = require('../page')

module.exports={
    editPage:{
        add:async function(test){ 
            var data={
                qid:'test.1',
                q:['who','am'],
                a:'the one'
            }
            await this.page.add(data)
            await this.page.refresh()
            var out=this.page.get(data.qid)
            test.deepEqual(data,out)
            test.done()
        }, 
        edit:async function(test){ 
            var data={
                qid:'new.1',
                q:['1','2'],
                a:"11"
            } 
            await this.page.edit('zombie.1',data)
            await this.page.refresh()
            var out=this.page.get(data.qid)
            test.deepEqual(data,out)
            test.done()
        }, 
        deleteSingle:async function(test){ 
            await this.page.deleteId('zombie.1')
            test.equal(await this.page.listQA(),2)
            test.done()
        }, 
        deleteSelection:async function(test){ 
            await this.page.select('zombie.1')
            await this.page.select('zombie.2')
            await this.page.deleteSelected()
            test.equal(await this.page.listQA(),1)
            test.done()
        }, 
        filter:async function(test){ 
            await this.page.setFilter("zombie")
            test.equal(await this.page.listQA(),3)
            await this.page.setFilter("not-here")
            test.equal(await this.page.listQA(),0)
            test.done()
        }, 
        test:async function(test){ 
            await this.page.goToTest()
            await this.page.test("zombie","zombie")
            test.done()
        }, 
        build:async function(test){
            await this.page.buildBot()
            test.done()
        }
    },
    setUp:async function(done){
        await this.page.goToImport()
        await this.page.importFile(`${__dirname}/../../../docs/zombie.json`)
        await this.page.goToEdit()
        done()
    },
    tearDown:async function(done){
        await this.page.goToEdit()
        await this.page.deleteAll()
        done()
    }
}

