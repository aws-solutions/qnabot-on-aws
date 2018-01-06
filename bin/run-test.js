#! /usr/bin/env node
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var _log=console.log
const stripAnsi = require('strip-ansi');

var log=function(x){
    log_file.write(stripAnsi(util.format(x)) + '\n'); 
    _log(x)
}

console.log=function(x){
    log_file.write(stripAnsi(util.format(x)) + '\n'); 
}.bind(console)

var reporter = require('./reporter');

reporter.run([
    "../templates/api/unit/index.js",
    '../lambda/test.js',
    "../website/test/index.js"
],null,null,log);





