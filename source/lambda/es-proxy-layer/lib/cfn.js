/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
    qnabot.log('OpenSearch Response', JSON.stringify(res, null, 2));
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

async function remove_alias_from_indices(api, index_alias, res, index_name) {
    try {
        api.method = 'GET';
        api.path = `/_alias/${index_alias}`;
        api.body = '';
        res = await run_es_query(api); // NOSONAR - javascript:S1226 - res is passed as parameter
        qnabot.log('Fetched details of existing alias: ', res);
        qnabot.log('Delete existing alias, if exists:', index_alias);
        const indexKeys = Object.keys(res);
        
        await Promise.all(indexKeys.map(async (index_key) => {
            if (indexKeys?.length > 0 && index_key !== index_name) {
                api.method = 'DELETE';
                api.path = `/${index_key}/_alias/${index_alias}`;
                api.body = '';
                const deleteRes = await run_es_query(api);
                qnabot.log('Deleting alias returned: ', deleteRes);
            }
        }));
        
        return res;
    } catch (error) {
        // If alias doesn't exist (404), that's fine - nothing to remove
        if (error.status === 404) {
            qnabot.log(`Alias ${index_alias} does not exist yet - nothing to remove`);
            return {};
        }
        throw error;
    }
};

exports.Create = async function (params) {
    try {
        const { create } = params;
        let res; let index_alias; let
            index_name;
        if (create.replaceTokenInBody) {
            // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
            // used to replace tokenized index names in OpenSearchDashboards Dashboard JSON
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
            qnabot.log('Create new index response: ', res);
            
            try {
                res = await remove_alias_from_indices(create, index_alias, res, index_name);
            } catch (err) {
                qnabot.error(`Remove alias from indices failed: ${err?.status} ${err?.code} ${err?.message}`);
            }
            
            qnabot.log('Create alias for new index:', index_alias);
            create.method = 'PUT';
            create.path = `/${index_name}/_alias/${index_alias}`;
            create.body = '';
            res = await run_es_query(create);
            qnabot.log('Create alias response: ', res);
        } else {
            // use request params from CfN
            res = await run_es_query(create);
            qnabot.log('Create response using request params: ', res);
        }
        return { PhysicalResourceId: index_alias, FnGetAttrsDataObj: { index_name, index_alias } };
    } catch (error) {
        qnabot.error('Error in Create function:', error);
        throw error;
    }
};

exports.Update = async function (ID, params, oldparams) {
    try {
        if (params.NoUpdate) {
            return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
        }
        let res; let index_alias; let
            index_name;
        const update = params.create;
        if (update.replaceTokenInBody) {
            // replaceTokenInBody is array of objects like [{f:"find_pattern",r:"replace_pattern"},{...}]
            // used to replace tokenized index names in OpenSearchDashboards Dashboard JSON
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
                qnabot.error(`Deleting reindex returned: ${err?.status} ${err?.code} ${err?.message}`);
            }
            qnabot.log('Reindex response returned: ', res);
            try {
                res = await remove_alias_from_indices(update, index_alias, res, index_name);
            } catch (err) {
                qnabot.error(`Deleting alias returned: ${err?.status} ${err?.code} ${err?.message}`);
            }
            try {
                qnabot.log('Delete existing index, if exists from earlier release:', index_alias);
                update.method = 'DELETE';
                update.path = `/${index_alias}`;
                update.body = '';
                res = await run_es_query(update);
                qnabot.log('Delete existing index response: ', res);
            } catch (err) {
                qnabot.error(`Delete index returned: ${err?.status} ${err?.code} ${err?.message}`);
            }
            qnabot.log('Update alias for new index:', index_alias);
            update.method = 'PUT';
            update.path = `/${index_name}/_alias/${index_alias}`;
            update.body = '';
            res = await run_es_query(update);
            qnabot.log('Update alias response: ', res);
        } else {
            // use request params from CfN
            res = await run_es_query(update);
            qnabot.log('Update alias response using request params: ', res);
        }
        return { PhysicalResourceId: ID, FnGetAttrsDataObj: { index_name, index_alias } };
    } catch (error) {
        qnabot.error('Error in Update function:', error);
        throw error;
    }
};

exports.Delete = async function (ID, params) {
    try {
        if (params.delete) {
            qnabot.log('Delete resource using ES params:', JSON.stringify(params.delete));
            const res = await run_es_query(params.delete);
            qnabot.log('Delete resource response: ', res);
            return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
        }
        return { PhysicalResourceId: ID, FnGetAttrsDataObj: {} };
    } catch (error) {
        qnabot.error('Error in Delete function:', error);
        throw error;
    }
};

exports.resource = cfnLambda({
    Create: async (params, reply) => {
        try {
            const result = await exports.Create(params);
            reply(null, result.PhysicalResourceId, result.FnGetAttrsDataObj);
        } catch (error) {
            qnabot.error('Create operation failed:', error);
            reply(error);
        }
    },
    Update: async (ID, params, oldparams, reply) => {
        try {
            const result = await exports.Update(ID, params, oldparams);
            reply(null, result.PhysicalResourceId, result.FnGetAttrsDataObj);
        } catch (error) {
            qnabot.error('Update operation failed:', error);
            reply(error);
        }
    },
    Delete: async (ID, params, reply) => {
        try {
            const result = await exports.Delete(ID, params);
            reply(null, result.PhysicalResourceId, result.FnGetAttrsDataObj);
        } catch (error) {
            qnabot.error('Delete operation failed:', error);
            reply(error);
        }
    }
});
