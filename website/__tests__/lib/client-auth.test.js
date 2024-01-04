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
import clientAuthModule from '../../js/lib/client-auth';

const jwt = require('jsonwebtoken');

jest.mock('aws-sdk', () => ({
    config: {
        region: '',
    },
    CognitoIdentityCredentials: class {},
}));

jest.mock('axios', () => ({
    head: jest.fn().mockReturnValue(Promise.resolve({
        headers: {
            'api-stage': 'dev',
        },
    })),
    get: jest.fn().mockReturnValue(Promise.resolve({
        data: {
            region: 'us-weast-1',
            UserPool: 'test-user-pool',
            PoolId: 'test-pool-id',
        },
    })),
}));

jest.mock('jsonwebtoken', () => ({
    decode: jest.fn().mockReturnValue({
        'cognito:username': 'test-username',
    }),
}));

jest.mock('query-string', () => ({
    parse: jest.fn().mockReturnValue({ id_token: 'test-token' }),
}));

describe('js lib client-auth module', () => {
    const windowSpy = jest.spyOn(window, 'window', 'get');
    windowSpy.mockReturnValue({
        location: {
            href: '',
            hash: 'test-hash',
        },
    });

    test('client auths', async () => {
        await clientAuthModule().catch(() => {});
        expect(jwt.decode).toHaveBeenCalledTimes(1);
        expect(jwt.decode).toHaveBeenCalledWith('test-token');
    });
});
