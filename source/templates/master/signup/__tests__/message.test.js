/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { handler } = require('../message');
const { event } = require('./message.fixtures');

describe('message handler', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    it('should return an error if the email domain is not approved', async () => {
        process.env.APPROVED_DOMAIN = 'notamazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const context = {};
        
        await expect(handler(clonedEvent, context)).rejects.toThrow('EMAIL_DOMAIN_DENIED_ERR');
    });

    it('closes context if approved domain is not set', async () => {
        process.env.APPROVED_DOMAIN = '';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const context = {};

        const result = await handler(clonedEvent, context);
        
        expect(result).toEqual(clonedEvent);
        expect(clonedEvent.response.emailSubject).toEqual('QnABot Signup Verification Code');
        expect(clonedEvent.response.emailMessage).toEqual('Hello, Your QnABot verification code is: test');
    });

    it('closes context if email matches domain and is verified', async () => {
        process.env.APPROVED_DOMAIN = 'amazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const context = {};

        const result = await handler(clonedEvent, context);

        expect(result).toEqual(clonedEvent);
        expect(clonedEvent.response.emailSubject).toEqual('QnABot Signup Verification Code');
        expect(clonedEvent.response.emailMessage).toEqual('Hello, Your QnABot verification code is: test');
    });

    it('closes context if email matches domain and is not verified', async () => {
        process.env.APPROVED_DOMAIN = 'amazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.request.userAttributes.email_verified = 'False';
        const context = {};

        const result = await handler(clonedEvent, context);

        expect(result).toEqual(clonedEvent);
        expect(clonedEvent.response.autoVerifyUser).toEqual(undefined);
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});
