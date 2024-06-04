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
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const request = require('../lib/request');
const { Create, Update, Delete } = require('../lib/cfn');

jest.mock('../lib/request');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

class TestError extends Error {
    constructor() {
      super();
      this.response = {
            statusText: 'test error',
            status: 'Error'
        }
    }
};

describe('cfn Delete', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('send delete request to endpoint', async () => {
        const params = {
            delete: {
                method: 'DELETE',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
                body: {
                    test: 'body'
                },
            }
        };
        const ID = 'test';

        const expectedParams = _.cloneDeep(params.delete);
        expectedParams.url = 'https://url.com/path';
        expectedParams.endpoint = undefined;
        expectedParams.path = undefined;

        const result = await Delete(ID, params);
        expect(request).toBeCalledWith(expectedParams);
        expect(result).toStrictEqual({ PhysicalResourceId: ID, FnGetAttrsDataObj: {} })
    });

    test('does not send delete request when delete param missing', async () => {
        const params = {};
        const ID = 'test';

        const result = await Delete(ID, params);
        expect(request).not.toHaveBeenCalled();
        expect(result).toStrictEqual({ PhysicalResourceId: ID, FnGetAttrsDataObj: {} })
    });
});

describe('cfn Create', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        request.mockReset();
    });

    test('send create request to endpoint', async () => {
        const params = {
            create: {
                replaceTokenInBody: [{
                    f: 'token',
                    r: 'replaced',
                }],
                body: {
                    replace: 'token'
                },
                index: 'index',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
            }
        };

        const firstCallArgs = {
            body: {
                replace: 'replaced'
            },
            headers: {
                test: 'headers'
            },
            method: 'PUT',
            url: expect.stringMatching(/^https:\/\/url\.com\/index_\d{8}_\d{6}/),
        };

        const secondCallArgs = {
            body: '',
            headers: {
                test: 'headers'
            },
            method: 'GET',
            url: expect.stringMatching(/^https:\/\/url.com\/_alias\/index/),
        };

        const thirdCallArgs = {
            body: '',
            headers: {
                test: 'headers'
            },
            method: 'PUT',
            url: expect.stringMatching(/^https:\/\/url\.com\/index_\d{8}_\d{6}\/_alias\/index/),
        };

        const result = await Create(params);
        expect(request).toBeCalledTimes(3);
        expect(request).toHaveBeenNthCalledWith(1, firstCallArgs);
        expect(request).toHaveBeenNthCalledWith(2, secondCallArgs);
        expect(request).toHaveBeenNthCalledWith(3, thirdCallArgs);
        expect(result).toStrictEqual({ PhysicalResourceId: 'index', FnGetAttrsDataObj: { index_name: expect.stringMatching(/^index_\d{8}_\d{6}/), index_alias: 'index' } });
    });

    test('generates index from current time', async () => {
        const params = {
            create: {
                replaceTokenInBody: [{
                    f: 'token',
                    r: 'replaced',
                }],
                body: {
                    replace: 'token'
                },
                index: 'index',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
            }
        };

        jest
            .useFakeTimers()
            .setSystemTime(new Date('2023-01-01 00:00:00'));
        expect(await Create(params)).toStrictEqual({ PhysicalResourceId: 'index', FnGetAttrsDataObj: { index_name: 'index_20230101_000000', index_alias: 'index' } });

        jest.setSystemTime(new Date('2023-12-31 23:59:59'));
        expect(await Create(params)).toStrictEqual({ PhysicalResourceId: 'index', FnGetAttrsDataObj: { index_name: 'index_20231231_235959', index_alias: 'index' } });
    });

    test('send create request with no index', async () => {
        const params = {
            create: {
                body: {
                    replace: 'token'
                },
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
                method: 'CREATE',
            }
        };

        const result = await Create(params);
        expect(request).toBeCalledTimes(1);
        expect(request).toBeCalledWith({
            body: {
                replace: 'token'
            },
            headers: {
                test: 'headers'
            },
            method: 'CREATE',
            url: 'https://url.com/path'
        });
        expect(result).toStrictEqual({ PhysicalResourceId: undefined, FnGetAttrsDataObj: { index_name: undefined, index_alias: undefined } });
    });

    test('handles errors thrown from request', async () => {
        const params = {
            create: {
                replaceTokenInBody: [{
                    f: 'token',
                    r: 'replaced',
                }],
                body: {
                    replace: 'token'
                },
                index: 'index',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
            }
        };

        request
            .mockImplementationOnce(async () => {})
            .mockImplementationOnce(async () => {throw new TestError()})
            .mockImplementationOnce(async () => {throw new TestError()});

        try {
            await Create(params);
            expect(true).toBe(false);
        } catch (err) {
            expect(request).toBeCalledTimes(3);
            expect(err.response.statusText).toBe('test error');
        }
    });
});

describe('cfn Update', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        request.mockReset();
    });

    test('send update request to endpoint', async () => {
        const ID = 'test';
        const params = {
            NoUpdate: false,
            create: {
                replaceTokenInBody: [{
                    f: 'token',
                    r: 'replaced',
                }],
                body: {
                    replace: 'token'
                },
                index: 'index',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
            }
        };

        const firstCallArgs = {
            body: {
                replace: 'replaced'
            },
            headers: {
                test: 'headers'
            },
            method: 'PUT',
            url: expect.stringMatching(/^https:\/\/url\.com\/index_\d{8}_\d{6}/),
        };

        const secondCallArgs = {
            body: {
                dest: {
                    index: expect.stringMatching(/^index_\d{8}_\d{6}/)
                },
                source: {
                    index: 'index',
                },
            },
            headers: {
                test: 'headers'
            },
            method: 'POST',
            url: expect.stringMatching(/^https:\/\/url.com\/_reindex/),
        };

        const thirdCallArgs = {
            body: '',
            headers: {
                test: 'headers'
            },
            method: 'GET',
            url: expect.stringMatching(/^https:\/\/url.com\/_alias\/index/),
        };

        const fouthCallArgs = {
            body: '',
            headers: {
                test: 'headers'
            },
            method: 'DELETE',
            url: expect.stringMatching(/^https:\/\/url.com\/index/),
        };

        const fifthCallArgs = {
            body: '',
            headers: {
                test: 'headers'
            },
            method: 'PUT',
            url: expect.stringMatching(/^https:\/\/url\.com\/index_\d{8}_\d{6}\/_alias\/index/),
        };

        const result = await Update(ID, params);
        expect(request).toBeCalledTimes(5);
        expect(request).toHaveBeenNthCalledWith(1, firstCallArgs);
        expect(request).toHaveBeenNthCalledWith(2, secondCallArgs);
        expect(request).toHaveBeenNthCalledWith(3, thirdCallArgs);
        expect(request).toHaveBeenNthCalledWith(4, fouthCallArgs);
        expect(request).toHaveBeenNthCalledWith(5, fifthCallArgs);
        expect(result).toStrictEqual({ PhysicalResourceId: 'test', FnGetAttrsDataObj: { index_name: expect.stringMatching(/^index_\d{8}_\d{6}/), index_alias: 'index' } });
    });

    test('handles errors thrown from request', async () => {
        const ID = 'test';
        const params = {
            NoUpdate: false,
            create: {
                replaceTokenInBody: [{
                    f: 'token',
                    r: 'replaced',
                }],
                body: {
                    replace: 'token'
                },
                index: 'index',
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
            }
        };

        request
            .mockImplementationOnce(async () => {})
            .mockImplementationOnce(async () => {throw new TestError()})
            .mockImplementationOnce(async () => {throw new TestError()})
            .mockImplementationOnce(async () => {throw new TestError()})
            .mockImplementationOnce(async () => {throw new TestError()});

        try {
            await Update(ID, params);
            expect(true).toBe(false);
        } catch (err) {
            expect(request).toBeCalledTimes(5);
            expect(err.response.statusText).toBe('test error');
        }
    });

    test('send update request with no index', async () => {
        const ID = 'test';
        const params = {
            create: {
                body: {
                    replace: 'token'
                },
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
                method: 'UPDATE',
            }
        };

        const result = await Update(ID, params);
        expect(request).toBeCalledTimes(1);
        expect(request).toBeCalledWith({
            body: {
                replace: 'token'
            },
            headers: {
                test: 'headers'
            },
            method: 'UPDATE',
            url: 'https://url.com/path'
        });
        expect(result).toStrictEqual({ PhysicalResourceId: 'test', FnGetAttrsDataObj: { index_name: undefined, index_alias: undefined } });
    });

    test('early exit when NoUpdate is true', async () => {
        const ID = 'test';
        const params = {
            NoUpdate: true,
            create: {
                body: {
                    replace: 'token'
                },
                headers: {
                    test: 'headers'
                },
                endpoint: 'url.com',
                path: '/path',
                method: 'UPDATE',
            }
        };

        const result = await Update(ID, params);
        expect(request).toBeCalledTimes(0);
        expect(result).toStrictEqual({ PhysicalResourceId: 'test', FnGetAttrsDataObj: {} });
    });

});
