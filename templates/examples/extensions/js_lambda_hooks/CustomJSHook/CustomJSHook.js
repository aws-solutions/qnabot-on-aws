
exports.handler=function(event,context,cb){
    console.log(JSON.stringify(event,null,2))
    event.res.message="Hi! This is your Custom Javascript Hook speaking!"
    cb(null,event)
}
