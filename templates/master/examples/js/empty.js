exports.handler=function(event,context,cb){
    console.log(JSON.stringify(event,null,2))
    cb(null,event)
}
