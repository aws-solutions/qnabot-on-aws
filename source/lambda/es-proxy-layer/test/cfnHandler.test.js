/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { EventEmitter } = require('events');
const httpsMock = require('https');
const Stream = require('stream');
const cfnHandler = require('../lib/cfnHandler');

const mockResponseURL = 'https://mock-cfn-response.amazonaws.com/test';

function makeEvent(requestType = 'Create', overrides = {}) {
    return {
        RequestType: requestType,
        StackId: 'mock-stack-id',
        RequestId: 'mock-request-id',
        LogicalResourceId: 'mock-logical-id',
        ResponseURL: mockResponseURL,
        ResourceProperties: { ServiceToken: 'mock-token', create: { index: null } },
        OldResourceProperties: { ServiceToken: 'mock-token', create: { index: null } },
        PhysicalResourceId: 'mock-physical-id',
        ...overrides,
    };
}

function makeContext() {
    return { done: jest.fn() };
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
    return { emitter };
}

const resource = {
    Create: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'new-id', FnGetAttrsDataObj: {} })),
    Update: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'updated-id', FnGetAttrsDataObj: {} })),
    Delete: jest.fn(() => Promise.resolve({ PhysicalResourceId: 'deleted-id', FnGetAttrsDataObj: {} })),
};

describe('es-proxy-layer cfnHandler', () => {
    beforeEach(() => jest.clearAllMocks());

    it('Create — dispatches to resource.Create and sends SUCCESS', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        await cfnHandler(resource, makeEvent('Create'), context);
        expect(resource.Create).toHaveBeenCalled();
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
        expect(context.done).toHaveBeenCalled();
    });

    it('Update with changed params — dispatches to resource.Update', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        const event = makeEvent('Update', {
            ResourceProperties: { ServiceToken: 'tok', key: 'new' },
            OldResourceProperties: { ServiceToken: 'tok', key: 'old' },
        });
        await cfnHandler(resource, event, context);
        expect(resource.Update).toHaveBeenCalled();
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
    });

    it('Update with identical params (NoUpdate) — skips resource.Update, sends SUCCESS', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        const event = makeEvent('Update', {
            ResourceProperties: { ServiceToken: 'tok', key: 'same' },
            OldResourceProperties: { ServiceToken: 'tok', key: 'same' },
        });
        await cfnHandler(resource, event, context);
        expect(resource.Update).not.toHaveBeenCalled();
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
    });

    it('Delete — dispatches to resource.Delete and sends SUCCESS', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        await cfnHandler(resource, makeEvent('Delete'), context);
        expect(resource.Delete).toHaveBeenCalled();
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
    });

    it('Delete failsafe — sends SUCCESS even when resource.Delete throws', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        resource.Delete.mockRejectedValueOnce(new Error('delete failed'));
        await cfnHandler(resource, makeEvent('Delete'), context);
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('SUCCESS');
        expect(context.done).toHaveBeenCalled();
    });

    it('handler error — sends FAILED and calls context.done()', async () => {
        const { emitter } = mockHttps();
        const context = makeContext();
        resource.Create.mockRejectedValueOnce(new Error('create failed'));
        await cfnHandler(resource, makeEvent('Create'), context);
        const body = JSON.parse(emitter.write.mock.calls[0][0]);
        expect(body.Status).toBe('FAILED');
        expect(body.Reason).toContain('create failed');
        expect(context.done).toHaveBeenCalled();
    });

    it('context.done() called without error even on FAILED path', async () => {
        mockHttps();
        const context = makeContext();
        resource.Create.mockRejectedValueOnce(new Error('boom'));
        await cfnHandler(resource, makeEvent('Create'), context);
        expect(context.done).toHaveBeenCalledWith();  // no error arg
    });
});
