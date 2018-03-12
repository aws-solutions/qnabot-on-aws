#! /usr/bin/env node
var fs = require('fs');
var util = require('util');
var label=process.argv[3]
var log_file = fs.createWriteStream(__dirname + `/output/log-${label}.log`, {flags : 'a'});
var output_file = fs.createWriteStream(__dirname + `/output/output-${label}.log`, {flags : 'a'});
var _log=console.log
const stripAnsi = require('strip-ansi');

var log=function(x){
    log_file.write(stripAnsi(util.format(x)) + '\n'); 
    output_file.write(stripAnsi(util.format(x)) + '\n'); 
    _log(x)
}

console.log=function(x){
    log_file.write(stripAnsi(util.format(x)) + '\n'); 
}.bind(console)

var reporter = require('./reporter');

reporter
    .run([process.argv[2]],null,null,log)
    .then(x=>fs.writeFileSync(__dirname+`/output/output-${label}.json`,JSON.stringify(x)))





