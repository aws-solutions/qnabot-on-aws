var webdriverio = require('webdriverio');
var Promise=require('bluebird')
var _=require('lodash')
var options = { 
    desiredCapabilities: { browserName: 'chrome' } 
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
    refresh(){
        this.client=this.client.refresh()
        return this.client
    }
    log(){
        this.client=this.client.log('browser').then(console.log)
        return this.client
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


