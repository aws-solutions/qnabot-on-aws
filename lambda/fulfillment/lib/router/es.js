var bodybuilder = require('bodybuilder')
var _=require('lodash')

module.exports=function(request){
    return bodybuilder()
    .orQuery('nested',{
        path:'questions',
        score_mode:'max',
        boost:2},
        q=>q.query('match','questions.q',request.question)
    )
    .orQuery('match','a',request.question)
    .orQuery('match','t',_.get(request,'session.topic',''))
    .from(0)
    .size(1)
    .build()
}
