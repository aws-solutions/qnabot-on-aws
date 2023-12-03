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

const Url = require('url');
const cfnLambda = require('cfn-lambda');
const qnabot = require('qnabot/logging');
const request = require('./request');

async function run_es_query(event) {
    qnabot.log('Received event:', JSON.stringify(event, null, 2));
    const res = await request({
        url: Url.resolve(`https://${event.endpoint}`, event.path),
        method: event.method,
        headers: event.headers,
        body: event.body,
    });
    qnabot.log('ElasticSearch Response', JSON.stringify(res, null, 2));
    return res;
}

const newname = function (alias) {
    const now = new Date();
    // create formatted time
    const yyyy = now.getFullYear();
    const mm = now.getMonth() < 9 ? `0${now.getMonth() + 1}` : (now.getMonth() + 1); // getMonth() is zero-based
    const dd = now.getDate() < 10 ? `0${now.getDate()}` : now.getDate();
    const hh = now.getHours() < 10 ? `0${now.getHours()}` : now.getHours();
    const mmm = now.getMinutes() < 10 ? `0${now.getMinutes()}` : now.getMinutes();
    const ss = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds();
    // make new index name as alias with timestamp
    const name = `${alias}_${yyyy}${mm}${dd}_${hh}${mmm}${ss}`;
    return name;
};

exports.Create = async function (params) {
    const { create } = params;
    let res; let index_alias; let
        index_name;
    if (create.replaceTokenInBody) {
        // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
        // used to replace tokenized index names in Kibana Dashboard JSON
        let str = JSON.stringify(create.body);
        create.replaceTokenInBody.forEach((item) => str = str.replace(item.f, item.r));
        create.body = JSON.parse(str);
    }
    if (create.index) {
        index_alias = create.index;
        index_name = newname(index_alias);
        qnabot.log('Create new index:', index_name);
        create.method = 'PUT';
        create.path = `/${index_name}`;
        res = await run_es_query(create);
        qnabot.log(res);
        try {
            qnabot.log('Delete existing alias, if exists:', index_alias);
            create.method = 'DELETE';
            create.path = `/*/_alias/${index_alias}`;
            create.body = '';
            res = await run_es_query(create);
            qnabot.log(res);
        } catch (err) {
            qnabot.log(`Delete returned: ${err.response.statusText} [${err.response.status}]`);
        }
        qnabot.log('Create alias for new index:', index_alias);
        create.method = 'PUT';
        create.path = `/${index_name}/_alias/${index_alias}`;
        create.body = '';
        res = await run_es_query(create);
        qnabot.log(res);
    } else {
        // use request params from CfN
        res = await run_es_query(create);
        qnabot.log(res);
    }
    return { PhysicalResourceId: index_alias, FnGetAttrsDataObj: { index_name, index_alias } };
};

exports.Update = async function (ID, params, oldparams) {
    if (params.NoUpdate) {
        return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
    }
    let res; let index_alias; let
        index_name;
    const update = params.create;
    if (update.replaceTokenInBody) {
        // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
        // used to replace tokenized index names in Kibana Dashboard JSON
        let str = JSON.stringify(update.body);
        update.replaceTokenInBody.forEach((item) => str = str.replace(item.f, item.r));
        update.body = JSON.parse(str);
    }
    if (update.index) {
        index_alias = update.index;
        index_name = newname(index_alias);
        qnabot.log('Update: create new index:', index_name);
        update.method = 'PUT';
        update.path = `/${index_name}`;
        res = await run_es_query(update);
        qnabot.log(res);
        try {
            qnabot.log('Update: reindex existing index to new index:', `${index_alias} -> ${index_name}`);
            const reindex = {
                source: {
                    index: index_alias,
                },
                dest: {
                    index: index_name,
                },
            };
            update.method = 'POST';
            update.path = '/_reindex';
            update.body = reindex;
            res = await run_es_query(update);
        } catch (err) {
            qnabot.log(`Reindex request returned: ${err.response.statusText} [${err.response.status}]`);
        }
        qnabot.log(res);
        try {
            qnabot.log('Delete existing alias, if exists:', index_alias);
            update.method = 'DELETE';
            update.path = `/*/_alias/${index_alias}`;
            update.body = '';
            res = await run_es_query(update);
            qnabot.log(res);
        } catch (err) {
            qnabot.log(`Delete alias returned: ${err.response.statusText} [${err.response.status}]`);
        }
        try {
            qnabot.log('Delete existing index, if exists from earlier release:', index_alias);
            update.method = 'DELETE';
            update.path = `/${index_alias}`;
            update.body = '';
            res = await run_es_query(update);
            qnabot.log(res);
        } catch (err) {
            qnabot.log(`Delete index returned: ${err.response.statusText} [${err.response.status}]`);
        }
        qnabot.log('Update alias for new index:', index_alias);
        update.method = 'PUT';
        update.path = `/${index_name}/_alias/${index_alias}`;
        update.body = '';
        res = await run_es_query(update);
        qnabot.log(res);
    } else {
        // use request params from CfN
        res = await run_es_query(update);
        qnabot.log(res);
    }
    return { PhysicalResourceId: ID, FnGetAttrsDataObj: { index_name, index_alias } };
};

exports.Delete = async function (ID, params) {
    if (params.delete) {
        qnabot.log('Delete resource using ES params:', JSON.stringify(params.delete));
        const res = await run_es_query(params.delete);
        qnabot.log(res);
        return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
    }
    return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
};

exports.resource = cfnLambda({
    AsyncCreate: exports.Create,
    AsyncUpdate: exports.Update,
    AsyncDelete: exports.Delete,
});
