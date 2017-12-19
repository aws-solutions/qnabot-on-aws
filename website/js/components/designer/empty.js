function empty(input){
    if(input.type==='string'){
        return ""
    }else if(input.type==='array'){
        return [empty(input.items)]
    }else if(input.type==='object'){
        var out={}
        Object.keys(input.properties || {})
        .forEach(key=>out[key]=empty(input.properties[key]))

        return out
    }
}
module.exports=empty
