#! /usr/bin/env node
/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
var readdir=Promise.promisify(require('recursive-readdir'))

var files=readdir(__dirname+'/../')
    .filter(x=>!x.match(/.*node_modules.*/))

var jsfiles=files.filter(x=>x.match(/.*\.js$/)).tap(x=>console.log(x.length+" js files"))
var vuefiles=files.filter(x=>x.match(/.*\.vue$/)).tap(x=>console.log(x.length+" vue files"))

Promise.join(
    jsfiles.map(js),
    vuefiles.map(vue)
).tap(()=>console.log("done"))

var license=fs.readFileAsync(__dirname+'/license.txt','utf8')
.then(function(file){
    var tmp=file.split('\n')
    return tmp.slice(0,tmp.length-1)

})

function js(name){
    var source=fs.readFileAsync(name,'utf8').then(x=>x.split('\n'))
    Promise.join(source,license)
    .spread(function(file,license){
        var position=file[0].match('#!') ? 1 : 0
        return fs.writeFileAsync(name,insert(file,license,position))
    })
}
function vue(name){
    var source=fs.readFileAsync(name,'utf8').then(x=>x.split('\n'))
    Promise.join(source,license)
    .spread(function(file,license){
        var position=file.findIndex(x=>x.match('<script>'))+1
        return fs.writeFileAsync(name,insert(file,license,position))
    })
}
function insert(file,license,position){
    if(file[position].match('/*license')){
        file=file.join('\n').replace(/\/\*license[\s\S]*\*\/[\n\r]/,'').split('\n') 
    }
    return file.slice(0,position)
        .concat(license)
        .concat(file.slice(position,file.length))
        .join('\n')

}



