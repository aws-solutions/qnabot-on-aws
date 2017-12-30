exports.handler=function(event,context,cb){
    console.log(JSON.stringify(event,null,2))
    event.res.message="hook"
    cb(null,event)
}
