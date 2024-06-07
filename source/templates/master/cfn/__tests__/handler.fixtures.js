/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

exports.event = {
    RequestType: 'Create',
    ResponseURL: 'https://localhost',
    ResourceProperties: {
        Bucket: 'test-bucket',
        Key: 'test-key',
    },
};

exports.endMock = jest.fn();

exports.writeMock = jest.fn().mockImplementation((body) => {
    expect(JSON.parse(body).PhysicalResourceId).toEqual('mock log stream name');
});

exports.doneMock = jest.fn();

