/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const start = require('../../lib/start');
const load = require('../../lib/load');
jest.mock('../../lib/load');

describe('when calling start function', () => {
    
    jest.mock('../../lib/start', () => ({
        query: jest.fn(),
    }));

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should start and invoke load function when filter is not null', async () => {

        require('../../lib/start').query.mockReturnValue({
            size: 1000,
            _source: {
                exclude: ['questions.q_vector', 'a_vector'],
            },
            query: {
                bool: {
                    must: { match_all: {} },
                    filter: {
                        regexp: {
                            qid: 'filter',
                        },
                    },
                },
            },
        });

        load.mockResolvedValue({ sample: 'response' });
        const config = {
            index: 'index',
            filter: 'filter',
            status: 'status',
            startDate: 'startDate',
            parts: ['part']
        };
        const expectedConfig = {
            bucket: 'contentdesigneroutputbucket',
            index: 'index',
            filter: 'filter',
            status: 'InProgress',
            startDate: expect.any(String),
            parts: [],
        };
        await start(config);
        expect(config.status).toEqual('InProgress')
        expect(config.parts).toEqual([])
        expect(load).toHaveBeenCalledWith(expectedConfig, {
            endpoint: process.env.ENDPOINT,
            method: 'POST',
            path: `${config.index}/_search?scroll=1m`,
            body: require('../../lib/start').query(),
        });
    });

    it('should start and invoke load function when filter is null', async () => {

        const config = {
            index: 'index',
            filter: null,
            status: 'status',
            startDate: 'startDate',
            parts: ['part']
        };
        const expectedConfig = {
            bucket: 'contentdesigneroutputbucket',
            index: 'index',
            filter: null,
            status: 'InProgress',
            startDate: expect.any(String),
            parts: [],
        };

        require('../../lib/start').query.mockReturnValue({
            size: 1000,
            _source: {
                exclude: ['questions.q_vector', 'a_vector'],
            },
            query: {
                bool: {
                    must: { match_all: {} },
                },
            },
        });

        load.mockResolvedValue({ sample: 'response' });
        await start(config);
        expect(config.status).toEqual('InProgress')
        expect(config.parts).toEqual([])
        expect(load).toHaveBeenCalledWith(expectedConfig, {
            endpoint: process.env.ENDPOINT,
            method: 'POST',
            path: `${config.index}/_search?scroll=1m`,
            body: require('../../lib/start').query(),
        });
    });

    it('should response with error if load function fails', async () => {

        const config = {
            index: 'index',
            filter: 'filter',
            status: 'status',
            startDate: 'startDate',
            parts: ['part']
        }
        const expected = new Error('load function error');
        load.mockRejectedValue(expected);
        await expect(start(config)).rejects.toEqual(expected);
    });
});