var fs=require('fs')
var _=require('lodash')
var util=require('./util')

var files=fs.readdirSync(`${__dirname}/..`)
    .filter(x=>!x.match(/README.md|Makefile|dashboard|index|test/))
    .map(x=>require(`../${x}`))
    
var lambdas={}
_.forEach(_.assign.apply({},files),(value,key)=>{
    if(value.Type==='AWS::Lambda::Function' && key!=="ESInfoLambda"){
        var type=_.fromPairs(value.Properties.Tags.map(x=>[x.Key,x.Value])).Type
        if(!lambdas[type]){
            lambdas[type]=[]
        }
        lambdas[type].push(key)
    }
})


module.exports=function(main_offset){
    var Lambda_title=util.Title("## Lambda Function",main_offset+6)

    var lambda_widgets=_.map(lambdas,(value,key)=>{
        return {list:value.map(util.lambda),name:key}
    }).reduce((accumulation,current)=>{
        var title=util.Title(`### ${current.name}`,accumulation.offset)
        accumulation.offset+=title.height
        accumulation.list.push(title)
        
        current.list.map(util.place(accumulation.offset))     
            .forEach(x=>{accumulation.list.push(x)})

        accumulation.offset=Math.max(...accumulation.list.map(x=>x.y))+6
        return accumulation
    },{list:[],offset:main_offset+6+Lambda_title.height})
    return _.flatten([Lambda_title,lambda_widgets.list])
}


