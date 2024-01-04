/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

const config=require('../../../config.json')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
const query=require('query-string').stringify
const _=require('lodash')
const zlib=require('zlib')
const axios=require('axios')
const { URL } = require('url');
const sign=require('aws4').sign
const fs=require('fs')
const region=config.region
const { fromEnv } = require('@aws-sdk/credential-providers');
const outputs=require('../../../bin/exports')

exports.exists=async function(id,test,not=true){
    try {
        await api({
            path: "questions/" + id,
            method: "HEAD"
        })
        return not ? test.ok(true) : test.ifError(true)
    } catch {
        return !not ? test.ok(true) : test.ifError(true)
    }
}
exports.run=async function(opts,test,not=true){
    try {
        const result = await api(opts)
        test.ok(opts.method.toUpperCase() === 'HEAD' ? true : result)
        return not ? test.ok(true) : test.ifError(true)
    } catch {
        return !not ? test.ok(true) : test.ifError(true)
    } finally {
        return test.done()
    }
}
exports.api=api
async function  api(opts){
    const output = await outputs('dev/master', { wait: true })
    const href = opts.path ? output.ApiEndpoint + '/' + opts.path : opts.href
    console.log(opts)
    const url = new URL(href)
    const request = {
        host: url.host,
        method: opts.method.toUpperCase(),
        url: url.href,
        path: url.pathname + url.search,
        headers: opts.headers || {}
    }
    if (opts.body) {
        request.body = JSON.stringify(opts.body),
            request.data = opts.body,
            request.headers['content-type'] = 'application/json'
    }
    console.log("Request", JSON.stringify(request, null, 2))
    const credentials = fromEnv()
    const signed = sign(request, credentials)
    delete request.headers["Host"]
    delete request.headers["Content-Length"]
    const x = axios(signed);
    console.log("response:",JSON.stringify(x.data, null, 2))
    return x.data
}
