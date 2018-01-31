var Promise=require('bluebird')
var _=require('lodash')

module.exports=class router {
    constructor(){
        this.middleware=[] 
    }

    start(event,callback){
        console.log("Request:"+JSON.stringify(event,null,2))
        try{  
            Promise.resolve(this._walk(
                {_event:event},
                {},
                0)
            )
            .then(res=>{
                console.log("final:",JSON.stringify(res,null,2))
                callback(null,res)
            })
            
        }catch(e){
            console.log("error",e)
            if(e.action==='END'){
                callback(null,"END")
            }else if(e.action==="RESPOND"){
                callback(null,e.message)
            }else{
                callback(e)
            }
        }
        
    }
    _walk(req,res,index){
        var self=this
        if(this.middleware[index]){
            return Promise.resolve(this.middleware[index](req,res))
            .then(()=>self._walk(req,res,++index))
        }else{
            return Promise.resolve(_.get(res,"out",res))
        }
    }
    add(fnc){
        this.middleware.push(fnc)
    }
}



