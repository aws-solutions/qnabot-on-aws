/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require("stream");
const { sdkStreamMixin } = require('@smithy/util-stream');

function mockStream(config, s3Mock, payload = "") {
    const stream = new Readable();
    stream.push(JSON.stringify(config));
    stream.push(null);
    const sdkStream = sdkStreamMixin(stream);
    if (payload != "") {
        s3Mock.on(GetObjectCommand, payload).resolves({ Body: sdkStream })
    } else {
        s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
    }
};
exports.mockStream = mockStream;
