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
const query = require('query-string').stringify;
const _ = require('lodash');
const axios = require('axios');
const Url = require('url');
const { sign } = require('aws4');
const path = require('path');
const { Mutex } = require('async-mutex');

const mutex = new Mutex();

const reason = function (r) {
    return (err) => {
        console.log(err);
        Promise.reject(r);
    };
};
const failed = false;
module.exports = {

    startKendraIndexing(context, opts) {
        return context.dispatch('_request', {
            url: `${context.rootState.info._links.crawler.href}/start?message=start&topic=${context.rootState.info.KendraCrawlerSnsTopic}`,
            method: 'post',
        });
    },
    // point to new Kendra Lambda instead of the old one
    startKendraV2Indexing(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.crawlerV2.href,
            method: 'post',
        });
    },
    getKendraIndexingStatus(context, opts) {
        return context.dispatch('_request', {
            url: context.rootState.info._links.crawlerV2.href,
            method: 'get',
        });
    },
};
