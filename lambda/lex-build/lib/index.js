// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const lexV1Status=process.env.STATUS_KEY;
const getUtterances=require('./utterances');

module.exports=async function(params){ 
    const utterances=getUtterances(params);
    let promises=[];
    if (lexV1Status) {
        console.log("Starting Lex V1");
        let LexV1Bot=require('./lexv1bot');
        let lexV1 = LexV1Bot(utterances);
        promises.push(lexV1);
    }
    console.log("Starting Lex V2");
    let LexV2Bot=require('./lexv2bot');
    var lexV2 = LexV2Bot(utterances);
    promises.push(lexV2);
    await Promise.all(promises);
    console.log("All Done");
    return 1;
};

