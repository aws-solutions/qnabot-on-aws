exports.handler=function(event,context,callback){
    console.log("Input:",JSON.stringify(event,null,2))

    callback(null,event)
}

