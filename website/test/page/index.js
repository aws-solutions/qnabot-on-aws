var webdriverio = require('webdriverio');
var Promise=require('bluebird')
var options = { 
    desiredCapabilities: { browserName: 'chrome' } 
};
var client = webdriverio.remote(options);

var modules=[
    require('./auth')
].reduce((acc,x)=>x(acc),class empty {})

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
    waitTillTitle(title){
        this.client=this.client.waitUntil(function(){
            return this.getTitle().then(title_now=>title)
        },5000)
        return Promise.resolve(this.client)
    }
}
module.exports=Page


