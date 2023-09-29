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

const aws=require('./aws')
const s3=new aws.S3()
const con=require('./connection')
const _=require('lodash')

module.exports=async function(params){
    const es=con(params.address)
    const searchResults= await es.search({
        index:process.env.INDEX,
        scroll:'10s',
        body: {
            query: {match_all: {}}
        }
    });
    const scrollId=searchResults._scroll_id
    const result=searchResults.hits.hits
    while (true) {
        const scrollResults=await es.scroll({
            scrollId,
            scroll:'10s'
        })
        const hits=scrollResults.hits.hits;
        hits.forEach(x=>result.push(x));
        if (!hits.length) break
    }
    const esUtterances = _.compact(_.uniq(_.flatten(result
        .map(qa=>qa._source.questions ? qa._source.questions.map(y=>y.q) : [])
    )));

    const s3Response=await s3.getObject({
        Bucket:process.env.UTTERANCE_BUCKET,
        Key:process.env.UTTERANCE_KEY
    }).promise()
    console.log(s3Response)

    const s3Utterances=JSON.parse(s3Response.Body.toString())
    const combinedUtterances= [esUtterances, s3Utterances ]
    const utterances=_.compact(_.uniq(_.flatten(combinedUtterances)))

    return utterances
}