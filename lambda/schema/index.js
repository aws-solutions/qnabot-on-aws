// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var schema = {
        quiz: require('./quiz.js'),
        qna: require('./qna.js'),
        slottype: require('./slottype.js'),
        text: require('./text.js')
    }
    console.log('Returned schema:', JSON.stringify(schema, null, 2));
    callback(null,schema);
}

