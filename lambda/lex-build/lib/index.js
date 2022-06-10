// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const lexV1Status=process.env.STATUS_KEY;
const getUtterances=require('./utterances');
const getQidsandquestions=require('./qidsandquestions');


module.exports=async function(params){ 
    let promises=[];
    if (lexV1Status) {
        const utterances=getUtterances(params);
        console.log("Starting Lex V1");
        let LexV1Bot=require('./lexv1bot');
        let lexV1 = LexV1Bot(utterances);
        promises.push(lexV1);
    }
    console.log("Starting Lex V2");
    const qidsandquestions=getQidsandquestions(params);
    let LexV2Bot=require('./lexv2bot');
    var lexV2 = LexV2Bot(qidsandquestions);
    promises.push(lexV2);
    await Promise.all(promises);
    console.log("All Done");
    return 1;
};

