var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|index|test|outputs/))
    .map(x=>require(`./${x}`))

module.exports={
    "Resources":_.assign.apply({},files),
    "Conditions": {},
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Template for export resources",
    "Outputs": require('./outputs'),
    "Parameters": {
        "CFNLambda":{"Type":"String"},
        "CFNInvokePolicy":{"Type":"String"},
        "BootstrapBucket":{"Type":"String"},
        "BootstrapPrefix":{"Type":"String"},
        "VarIndex": {"Type":"String"},
        "EsEndpoint": {"Type":"String"},
        "EsProxyLambda": {"Type":"String"},
        "ImportBucket": {"Type":"String"}
    }
}