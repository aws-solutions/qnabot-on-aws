/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var lib='./lib/middleware'
var router=new (require('./lib/router'))()
var fs=require('fs')
const esWarmer=new (require('./lib/warmer'))();

const filter = text => {
    if (process.env.DISABLECLOUDWATCHLOGGING === "true") {
        return "cloudwatch logging disabled";
    } else {
        // always redact jwts
        text = text.replace(/"accesstokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"accesstokenjwt":"<token redacted>"');
        text = text.replace(/"idtokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"idtokenjwt":"<token redacted>"');
        text = text.replace(/"refreshtoken":\s*"[^"]+?([^\/"]+)"/g, '"refreshtoken":"<token redacted>"');
        if (process.env.QNAREDACT === "true") {
            let re = new RegExp(process.env.REDACTING_REGEX, "g");
            return text.replace(re, "XXXXXX");
        } else {
            return text;
        }
    }
};

require('intercept-stdout')(filter, filter);

var middleware=fs.readdirSync(`${__dirname}/${lib}`)
    .filter(name=>name.match(/\d*_.*\.js/))
    .sort()
    .forEach(name=>{
        router.add(require(`${lib}/${name}`))
    })

exports.handler=function(event,context,callback){
    router.start(event,callback)
}

exports.warmer=async function(event,context,callback) {
    await esWarmer.perform(event,context,callback);
    return "complete";
}



