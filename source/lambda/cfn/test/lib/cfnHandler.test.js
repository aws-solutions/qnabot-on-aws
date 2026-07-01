/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { EventEmitter } = require('events');
const httpsMock = require('https');
const Stream = require('stream');
const cfnHandler = require('../../lib/cfnHandler');

const mockResponseURL = 'https://mock-cfn-response.amazonaws.com/test';

function makeEvent(requestType = 'Create', overrides = {}) {
    return {
        RequestType: requestType,
        ResourceType: 'Custom::Test',
        StackId: 'mock-stack-id',
        RequestId: 'mock-request-id',
        LogicalResourceId: 'mock-logical-id',
        ResponseURL: mockResponseURL,
        ResourceProperties: { ServiceToken: 'mock-token', Param1: 'value1' },
        OldResourceProperties: { ServiceToken: 'mock-token', Param1: 'old-value1' },
        PhysicalResourceId: 'mock-physical-id',
        ...overrides,
    };
}

function makeContext() {
    return { logStreamName: 'mock-log-stream', done: jest.fn(), invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:mock' };
}

function mockHttps() {
    const emitter = new EventEmitter();
    emitter.write = jest.fn();
    emitter.end = jest.fn();
    const message = new Stream();
    httpsMock.request = jest.fn().mockImplementation((options, cb) => {
        cb(message);
        message.emit('end');
        return emitter;
    });
    return { emitter, message };
}

describe('cfnHandler', () => {
    afterEach(() => jest.clearAllMocks());

    it('Create — calls handler.Create with params (ServiceToken stripped)', async () => {
        mockHttps();
        const handler = { Create: jest.fn((params, reply) => reply(null, 'new-id', { key: 'val' })) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Create'), context);
        expect(handler.Create).toHaveBeenCalledWith({ Param1: 'value1' }, expect.any(Function));
        expect(httpsMock.request).toHaveBeenCalled();
    });

    it('Update with changed params — calls handler.Update', async () => {
        mockHttps();
        const handler = { Update: jest.fn((id, params, old, reply) => reply(null, id, {})) };
        const context = makeContext();
        const event = makeEvent('Update'); // Param1 differs from OldResourceProperties
        await cfnHandler(handler, event, context);
        expect(handler.Update).toHaveBeenCalledWith('mock-physical-id', { Param1: 'value1' }, { Param1: 'old-value1' }, expect.any(Function));
    });

    it('Update with identical params (NoUpdate) — skips handler.Update', async () => {
        mockHttps();
        const handler = { Update: jest.fn() };
        const context = makeContext();
        const event = makeEvent('Update', {
            ResourceProperties: { ServiceToken: 'tok', Param1: 'same' },
            OldResourceProperties: { ServiceToken: 'tok', Param1: 'same' },
        });
        await cfnHandler(handler, event, context);
        expect(handler.Update).not.toHaveBeenCalled();
        expect(httpsMock.request).toHaveBeenCalled();
    });

    it('Delete — calls handler.Delete', async () => {
        mockHttps();
        const handler = { Delete: jest.fn((id, params, reply) => reply(null, id, {})) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Delete'), context);
        expect(handler.Delete).toHaveBeenCalledWith('mock-physical-id', { Param1: 'value1' }, expect.any(Function));
    });

    it('Delete failsafe — sends SUCCESS even when handler.Delete calls reply with error', async () => {
        const { emitter } = mockHttps();
        const handler = { Delete: jest.fn((id, params, reply) => reply(new Error('delete failed'))) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Delete'), context);
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
        expect(context.done).toHaveBeenCalled();
    });

    it('reply(err) — sends FAILED response', async () => {
        const { emitter } = mockHttps();
        const handler = { Create: jest.fn((params, reply) => reply(new Error('something broke'))) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Create'), context);
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('FAILED');
        expect(body.Reason).toContain('something broke');
    });

    it('reply(null, physicalId, data) — sends SUCCESS response', async () => {
        mockHttps();
        const handler = { Create: jest.fn((params, reply) => reply(null, 'new-resource-id', { attr: 'value' })) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Create'), context);
        expect(httpsMock.request).toHaveBeenCalled();
    });

    it('AsyncCreate bridge — AsyncCreate promise resolved → reply called with result', async () => {
        mockHttps();
        const handler = {
            AsyncCreate: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'async-id', FnGetAttrsDataObj: { x: 1 } })),
        };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Create'), context);
        expect(handler.AsyncCreate).toHaveBeenCalledWith({ Param1: 'value1' });
        expect(httpsMock.request).toHaveBeenCalled();
    });

    it('AsyncUpdate bridge — AsyncUpdate promise resolved → reply called', async () => {
        mockHttps();
        const handler = {
            AsyncUpdate: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'async-id', FnGetAttrsDataObj: {} })),
        };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Update'), context);
        expect(handler.AsyncUpdate).toHaveBeenCalled();
    });

    it('AsyncDelete bridge — AsyncDelete promise resolved → reply called', async () => {
        mockHttps();
        const handler = {
            AsyncDelete: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'async-id', FnGetAttrsDataObj: {} })),
        };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Delete'), context);
        expect(handler.AsyncDelete).toHaveBeenCalled();
    });

    it('context.done() is called after response sent', async () => {
        mockHttps();
        const handler = { Create: jest.fn((params, reply) => reply(null, 'id', {})) };
        const context = makeContext();
        await cfnHandler(handler, makeEvent('Create'), context);
        expect(context.done).toHaveBeenCalled();
    });
});
