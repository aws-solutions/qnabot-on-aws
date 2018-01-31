//start connection
var Promise=require('bluebird')
var aws=require('../aws')
var _=require('lodash')

module.exports=function(req,res){
    console.log("query-postprocess")
    if(res.result){ 
        res.type="PlainText"
        console.log(res.message)
        res.message=res.result.a
        var card=_.get(res,"result.r.title") ? res.result.r : null
        
        if(card){
            res.card.send=true
            res.card.title=_.get(card,'title')
            res.card.imageUrl=_.get(card,'imageUrl')
        }

        res.session.topic=_.get(res.result,"t")

        res.session.previous={
            qid:_.get(res.result,"qid"),
            a:_.get(res.result,"a"),
            q:req.question
        }
    }else{
        res.type="PlainText"
        res.message=process.env.EMPTYMESSAGE
    }
}

