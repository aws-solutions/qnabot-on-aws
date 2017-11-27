#! /usr/bin/env node
var sass=require('node-sass')
var fs=require('fs')

var style=sass.renderSync({
    data:fs.readFileSync(__dirname+'/css.scss','utf8'),
    outputStyle:"compressed"
}).css.toString()

fs.writeFileSync(__dirname+"/custom-css.css",style)
module.exports=style
    
