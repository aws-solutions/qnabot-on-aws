// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports={
    "region":"us-east-1",
    "profile":"default",
    "publicBucket":"aws-bigdata-blog",
    "publicPrefix":"artifacts/aws-ai-qna-bot",
    "devEmail":"",
    "devEncryption": "ENCRYPTED",
    "devPublicOrPrivate": "PRIVATE",
    "namespace":"dev",
    "LexBotVersion":"LexV2 Only",
    "stackNamePrefix":"QNA",
    "skipCheckTemplate": false,
    "noStackOutput": false,
    "multiBucketDeployment": false,
    "buildType": "Custom",
    "FulfillmentConcurrency":1
}

if (require.main === module) {
    if (process.argv.includes('buildType=AWSSolutions')) {
        module.exports.buildType = 'AWSSolutions';
        module.exports.publicBucket = '%%BUCKET_NAME%%';
        module.exports.publicPrefix = '%%SOLUTION_NAME%%/%%VERSION%%';
        module.exports.skipCheckTemplate = true;
        module.exports.noStackOutput = true;
    } else {
        module.exports.devEmail=process.argv[2] || "user@example.com"
        module.exports.region=process.argv[3] || "us-east-1"
    }
    console.log(JSON.stringify(module.exports,null,2))
}
