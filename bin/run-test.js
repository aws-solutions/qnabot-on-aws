#! /usr/bin/env node
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
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

reporter.run([process.argv[2]],null,null,log);





