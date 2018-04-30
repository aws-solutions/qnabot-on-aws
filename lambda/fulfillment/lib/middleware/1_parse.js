var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')


module.exports=function(req,res){
    req._type=req._event.version ? "ALEXA" : "LEX"
    console.log(req,res)

    switch(req._type){
        case 'LEX':
            Object.assign(req,lex.parse(req._event))
            break;
        case 'ALEXA':
            Object.assign(req,alexa.parse(req._event))
            break;
    }
    
    Object.assign(res,{
        type:"PlainText",
        message:"",
        session:_.mapValues(_.omit(_.cloneDeep(req.session),["appContext"]),
            x=>{
                try {
                    return JSON.parse(x)
                } catch(e){
                    return x
                }
            }),
        card:{
            send:false,
            title:"",
            text:"",
            url:""
        }
    })
    return {req,res}
}



