var Promise=require('bluebird')
var _=require('lodash')

module.exports=class router {
    constructor(){
        this.middleware=[] 
    }

    async start(event,callback){
        console.log("Request:"+JSON.stringify(event,null,2))
        try{
            var res=await this._walk( {_event:event})
            console.log("final:",JSON.stringify(res,null,2))
            callback(null,res)
        }catch(e){
            console.log("throwing response:",JSON.stringify(e))
            if(e.action==='END'){
                callback(null)
            }else if(e.action==="RESPOND"){
                callback(null,e.message)
            }else{
                callback(e)
            }
        }
        
    }
    async _walk(req,res={},index=0){
        console.log(JSON.stringify({req,res},null,2))

        if(this.middleware[index]){
            console.log(`middleware=${this.middleware[index].name}`)
            console.log("settings " + JSON.stringify(req._settings))
            var result=await this.middleware[index](req,res)
            return await this._walk(result.req,result.res,++index)
        }else{
            return _.get(res,"out",res)
        }
    }
    add(fnc){
        this.middleware.push(fnc)
    }
}



