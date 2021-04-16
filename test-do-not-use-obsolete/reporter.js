/*!
 * Nodeunit
 * Copyright (c) 2010 Caolan McMahon
 * MIT Licensed
 */

/**
 * Module dependencies
 */
var base="../node_modules/nodeunit/lib/reporters/"
var chalk=require('chalk')
const ora = require('ora');
var _=require('lodash')
var Promise=require('bluebird')
var nodeunit = require(base+'../nodeunit'),
    utils = require(base+'../utils'),
    fs = require('fs'),
    track = require(base+'../track'),
    path = require('path'),
    AssertionError = require(base+'../assert').AssertionError;

/**
 * Reporter info string
 */

exports.info = "Default tests reporter";


/**
 * Run all tests within each module, reporting the results to the command-line.
 *
 * @param {Array} files
 * @api public
 */

exports.run = function (files, options={}, callback,_log) {
return new Promise(function(res,rej){
    var options=options || {}
    var start = new Date().getTime();
    var report=[]
    var tracker = track.createTracker(function (tracker) {
        if (tracker.unfinished()) {
            _log('');
            _log('FAILURES: Undone tests (or their setups/teardowns): ');
            var names = tracker.names();
            for (var i = 0; i < names.length; i += 1) {
                _log('/' + names[i]);
            }
            _log('');
            _log('To fix this, make sure all tests call test.done()');
            rej(tracker.unfinished())
        }
    });
    var timer 
    var spinner
	var opts = {
	    testspec: options.testspec,
	    testFullSpec: options.testFullSpec,
        recursive: options.recursive,
        moduleStart: function (name) {
            _log('\n' + name);
        },
        testDone: function (name, assertions) {
            tracker.remove(name);
            var duration=(new Date())-timer
            if (!assertions.failures()) {
                spinner.succeed(' ('+assertions.length+') '+ name +" "+duration/1000+'s' );
                report.push({name:name.toString(),status:"success",duration})
            }
            else {
                spinner.fail(' ' + name + '\n');
                var tmp={name:name.toString(),status:"fail",duration,messages:[]}
                assertions.forEach(function (a) {
                    if (a.failed()) {
                        a = utils.betterErrors(a);
                        if (a.error instanceof AssertionError && a.message) {
                            tmp.message.push(a.message)
                            _log(
                                'Assertion Message: ' +
                                assertion_message(a.message)
                            );
                        }
                        _log(a.error.stack + '\n');
                    }
                });
                report.push(tmp)
            }
        },
        done: function (assertions, end) {
            var end = end || new Date().getTime();
            var duration = end - start;
            if (assertions.failures()) {
                _log(
                    '\n' + 'FAILURES: ' + assertions.failures() +
                    '/' + assertions.length + ' assertions failed (' +
                    assertions.duration/1000 + 's)'
                );
            }
            else {
                _log(
                   '\n' + 'OK: ' + assertions.length +
                   ' assertions (' + assertions.duration/1000 + 's)'
                );
            }
            res(report)
            if (callback) callback(assertions.failures() ? new Error('We have got test failures.') : undefined);
        },
        testStart: function(name) {
            name.toString=()=>{
                return name.filter(x=>_.isString(x)).join('/')
            }
            spinner = ora({
                text:name,
                spinner:"simpleDots"
            }).start();
            spinner.color = 'yellow';

            timer=new Date()
            tracker.put(name);
        }
    };
	if (files && files.length) {
	    var paths = files.map(function (p) {
	        return path.resolve(p);
	    });
	    nodeunit.runFiles(paths, opts);
	} else {
		nodeunit.runModules(files,opts);
	}
})
};
