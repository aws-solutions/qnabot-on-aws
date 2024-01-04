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
const Url=require('url')
const fs=require('fs')
const exists=require('./util').exists
const run=require('./util').run
const api=require('./util').api

module.exports={
    root:{
        get:test=>{
            api({
                path:"/",
                method:"get"
            })
            .then((result) => {
                console.log(result);
                test.ok(result);
                return Promise.all(_.values(result._links).map(x=>{
                    return api({
                        href:x.href,
                        method:"get"
                    })
                    .then(res => {
                        test.ok(res)
                        return res
                    })
                    .catch(error => {
                        console.log("error", x.href)
                        test.ifError(error)
                    })
                }))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
        }
    },
    bot:{
        get:test=>{
            api({
                path:"bot",
                method:"get"
            })
            .then((result) => {
                console.log(result);
                test.ok(result);
                return Promise.all(_.values(result._links).map(x=>api({
                    href:x.href,
                    method:"get"
                }).then(res => {
                    test.ok(res);
                    return res
                })
                .catch(error => {
                    console.log("error", x.href)
                    test.ifError(error)
                    })
                ))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
        }
    },
    health:{
        get:test=>run({
            path:"health",
            method:"get"
        },test)
    },
    pages:{
         client:test=>run({
            path:"pages/client",
            method:"get"
        },test),
        designer:test=>run({
            path:"pages/designer",
            method:"get"
        },test)
    },
    static:{
        get:test=>run({
            path:"static/index.html",
            method:"get"
        },test),
        head:test=>run({
            path:"static/index.html",
            method:"head"
        },test),
        error:test=>run({
            path:"static/notHere.html",
            method:"head"
        },test,false)
    },
    qa:{
        list:test=>run({
            path:"questions",
            method:"get"
        },test),
        filter:test=>run({
            path:"questions?filter=who",
            method:"get"
        },test),
        search:test=>run({
            path:"questions?query=who",
            method:"get"
        },test),
        options:test=>run({
            path:"questions?",
            method:"options"
        },test)
    },
    examples:{
        documents:async test=>{
            const exampleHrefs = await api({
                path:"examples",
                method:"get"
            })

            const documents = await api({
                href:exampleHrefs._links.documents.href,
                method:"get"
            })
            await Promise.all(
                documents.examples.map(x=>{
                    return api({
                        href:x.document.href,
                        method:"get"
                    })
                })
            )
            test.done()
        },
        photos:async test=>{
            const exampleHrefs=await api({
                path:"examples",
                method:"get"
            })

            const photos=await api({
                href:exampleHrefs._links.photos.href,
                method:"get"
            })
            console.log(photos.photos)
            await Promise.all(
                photos.photos
                .filter(x=>x.match('svg'))
                .map(href=>{
                    return api({
                        href,
                        method:"get"
                    })
                })
            )
            test.done()
        }
    },
    jobs:{
        get:test=>{
            api({
                path:"/jobs",
                method:"get"
            })
            .then((result) => {
                console.log(result);
                test.ok(result);
                return Promise.all(_.values(result._links).map(x=>api({
                    href:x.href,
                    method:"get"
                }).then(test.ok).catch(test.ifError)
                ))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
        }
    }
}

