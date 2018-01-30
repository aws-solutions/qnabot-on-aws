var Promise=require('bluebird')
var _=require('lodash')

module.exports=class router {
    constructor(){
        this.middleware=[] 
    }

    start(event,callback){
        console.log("Request:"+JSON.stringify(event,null,2))
        
        Promise.resolve(this._walk(
            {_event:event},
            {},
            0)
        )
        .then(res=>{
            console.log("final:",JSON.stringify(res,null,2))
            callback(null,res)
        })
        .tapCatch(console.log)
        .catch(e=>e.action==='END',e=>callback(null,"END") )
        .catch(e=>e.action==='RESPOND',e=>callback(null,e.message))
        .catch(e=>callback(e))
        
    }
    _walk(req,res,index){
        var self=this
        if(this.middleware[index]){
            return Promise.resolve(this.middleware[index](req,res))
            .then(()=>self._walk(req,res,++index))
        }else{
            return Promise.resolve(res)
        }
    }
    add(fnc){
        this.middleware.push(fnc)
    }
}



