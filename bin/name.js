#! /usr/bin/env node
var config=require('../config')
var fs=require('fs')
var _=require('lodash')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile

module.exports=run

if (require.main === module) {
    var argv=require('commander')
    var ran
    var args=argv.version('1.0')
        .name(process.argv[1].split('/').reverse()[0])
        .arguments('[stack]')
        .usage("[stack] [options]")
        .option('--inc',"increment value")
        .option('-s --set <value>',"set the value")
        .option('-n --namespace <name>',"stack namespace")
        .option('-p --prefix',"get stacks prefix") 
        .action(function(stack,options){
            if(stack || options.prefix) ran=true
            console.log(run(stack,options))
        })
        .parse(process.argv)
    if(!ran){
        argv.outputHelp()
    }
}

function run(stack,options={}){
    try {
        var increments=require('./.inc')
    } catch(e){
        var increments={}
    }
    var full=[options.namespace].concat(stack.split('/')).filter(x=>x).join('-')
    
    if(options.hasOwnProperty("set")){
        increment=options.set
        increments[full]=increment
        fs.writeFileSync(__dirname+'/.inc.json',JSON.stringify(increments))
    }else{
        increment=increments[full] || 0
    }

    if(options.inc){
        increment++
        increments[full]=increment
        fs.writeFileSync(__dirname+'/.inc.json',JSON.stringify(increments))
    }
    if(options.prefix){
        return ['QNA',options.namespace || config.namespace]
            .filter(x=>x)
            .join('-') 
    }else{
        return ['QNA',options.namespace || config.namespace,full,increment]
            .filter(x=>x)
            .join('-') 
    }
}


