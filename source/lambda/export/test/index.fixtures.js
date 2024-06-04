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
	 
 const { GetObjectCommand } = require('@aws-sdk/client-s3');
 const { Readable } = require('stream');
 const { sdkStreamMixin } = require('@smithy/util-stream');
 
 function mockStream(config, s3Mock) {
     const stream = new Readable();
     stream.push(JSON.stringify(config));
     stream.push(null);
     const sdkStream = sdkStreamMixin(stream);
     s3Mock.on(GetObjectCommand).resolves({ Body: sdkStream });
 };
 exports.mockStream = mockStream;