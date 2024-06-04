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

const { handler } = require('../message');
const { event } = require('./message.fixtures');

describe('message handler', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
    });

    it('should return an error if the email domain is not approved', () => {
        process.env.APPROVED_DOMAIN = 'notamazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const done = jest.fn();
        const context = {
            done,
        };
        handler(
            clonedEvent,
            context,
            () => {},
        );

        expect(done).toHaveBeenCalledWith(
            new Error('EMAIL_DOMAIN_DENIED_ERR'),
            clonedEvent,
        );
    });

    it('closes context if approved domain is not set', () => {
        process.env.APPROVED_DOMAIN = '';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const done = jest.fn();
        const context = {
            done,
        };
        handler(
            clonedEvent,
            context,
            () => {},
        );

        expect(done).toHaveBeenCalledWith(
            null,
            clonedEvent,
        );
        expect(clonedEvent.response.emailSubject).toEqual('QnABot Signup Verification Code');
        expect(clonedEvent.response.emailMessage).toEqual('Hello, Your QnABot verification code is: test');
    });

    it('closes context if email matches domain and is verified', () => {
        process.env.APPROVED_DOMAIN = 'amazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        const done = jest.fn();
        const context = {
            done,
        };

        handler(
            clonedEvent,
            context,
            () => {},
        );

        expect(done).toHaveBeenCalledWith(
            null,
            clonedEvent,
        );

        expect(clonedEvent.response.emailSubject).toEqual('QnABot Signup Verification Code');
        expect(clonedEvent.response.emailMessage).toEqual('Hello, Your QnABot verification code is: test');
    });

    it('closes context if email matches domain and is not verified', () => {
        process.env.APPROVED_DOMAIN = 'amazon.com';
        const clonedEvent = JSON.parse(JSON.stringify(event));
        clonedEvent.request.userAttributes.email_verified = 'False';
        const done = jest.fn();
        const context = {
            done,
        };

        handler(
            clonedEvent,
            context,
            () => {},
        );

        expect(done).toHaveBeenCalledWith(
            null,
            clonedEvent,
        );

        expect(clonedEvent.response.autoVerifyUser).toEqual(undefined);
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });
});
