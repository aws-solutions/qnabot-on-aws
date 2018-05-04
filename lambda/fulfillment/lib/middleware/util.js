exports.getLambdaArn=function(name){
    var match=name.match(/QNA:(.*)/)
    if(match){
        return process.env[match[1]] || name
    }else{
        return name
    }
}
