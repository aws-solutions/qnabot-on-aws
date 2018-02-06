var webdriverio = require('webdriverio');
var Promise=require('bluebird')
var _=require('lodash')
var options = { 
    desiredCapabilities: { 
        browserName: 'chrome',
        chromeOptions:{
            args:["allow-file-access-from-files",
            "use-fake-device-for-media-stream",
            "use-fake-ui-for-media-stream"]
        }
    } 
};
var client = webdriverio.remote(options);
var requireDir = require('require-dir');

var modules=_.values(requireDir('.'))
    .reduce((acc,x)=>x(acc),class empty {})

class Page extends modules{
    constructor(){
        super()
    }
    open(){
        this.client=client.init()
        return this.client
    }
    close(){
        return this.client.end()
    }
    async refresh(){
        await this.client.refresh()
        await this.client.waitUntil(function(){
            return this.getUrl().then(x=>x.match(/.*#\/edit/))
        },10000)
    }
    log(){
        this.client=this.client.log('browser').then(console.log)
        return this.client
    }
    async waitClick(selector){
        try{
            await this.client.waitForVisible(selector)
            await this.client.scroll(selector)
            await Promise.delay(500)
            await this.client.click(selector)
        }catch(e){
            if(e.message.match('is not clickable at point')){
                await this.client.execute(function(id){
                   document.querySelector(selector).click() 
                },selector)
            }else{
                throw e
            }
        }
    }
    waitTillTitle(title){
        this.client=this.client.waitUntil(function(){
            return this.getTitle().then(title_now=>{
                return title_now===title
            })
        },5000)
        return Promise.resolve(this.client)
    }
}
module.exports=Page


