#! /usr/bin/env node
var sass=require('sass')
var fs=require('fs')

var client=sass.compileString(
    fs.readFileSync(__dirname+'/client.scss','utf8'),
    {style: 'compressed'}
).css

var designer=sass.compileString(
    fs.readFileSync(__dirname+'/designer.scss','utf8'),
    {style: 'compressed'}
).css

module.exports={
    client,
    designer
}