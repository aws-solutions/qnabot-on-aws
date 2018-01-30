var today = new Date()
var curHr = today.getHours()


exports.handler=function(event,context,cb){
    console.log(JSON.stringify(event,null,2))
    if (curHr < 12) {
        message="good morning, "
    } else if (curHr < 18) {
        message="good afternoon, "
    } else {
        message="good evening, "
    }
    event.res.message=message+event.res.message
    cb(null,event)
}
