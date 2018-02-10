var fs=require('fs')
var _=require('lodash')
var lambdas=require('./lambdas')
var elasticsearch=require('./elasticsearch')
var lex=require('./lex')
var util=require('./util')

var widgets=[util.Title("# QnABot:${AWS::StackName} Dashboard",0)]

widgets=widgets.concat(lex(util.yOffset(widgets)))
widgets=widgets.concat(elasticsearch(util.yOffset(widgets)))
widgets=widgets.concat(lambdas(util.yOffset(widgets)))

module.exports={widgets}
