#! /usr/bin/env node
var sass=require('node-sass')
var fs=require('fs')

var client=sass.renderSync({
    data:fs.readFileSync(__dirname+'/client.scss','utf8'),
    outputStyle:"compressed"
}).css.toString()

var designer=sass.renderSync({
    data:fs.readFileSync(__dirname+'/designer.scss','utf8'),
    outputStyle:"compressed"
}).css.toString()

module.exports={
    client,
    designer
}
    
