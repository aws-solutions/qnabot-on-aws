/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.event = {
    RequestType: 'Create',
    ResponseURL: 'https://localhost',
    ResourceProperties: {
        Bucket: 'test-bucket',
        method: 'PUT',
        body: JSON.stringify({
            PhysicalResourceId: 'mock log stream name',
        }),
    },
};

exports.endMock = jest.fn();

exports.writeMock = jest.fn().mockImplementation((body) => {
    expect(JSON.parse(body).PhysicalResourceId).toEqual('mock log stream name');
});

exports.doneMock = jest.fn();

