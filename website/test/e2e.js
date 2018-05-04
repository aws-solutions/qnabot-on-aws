var Page = require('./page')
var requireDir = require('require-dir');

module.exports=Object.assign(
requireDir('./specs'),
{
    setUp:async function(cb){
        var page=new Page()
        await page.open()
        await page.login()
        this.page=page
        cb()
    },
    tearDown:async function(cb){
        await this.page.close()
        cb()
    }

})

