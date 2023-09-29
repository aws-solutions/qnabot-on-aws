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
const AWS = require('aws-sdk');
const qnabot = require('qnabot/logging');

function getDistinctValues(list, objectId, sortField) {
    let distinctItems = [...new Set(list.map((item) => item[objectId]))];
    const sortedItems = _.cloneDeep(list).sort((a, b) => {
        if (a[sortField] == b[sortField]) {
            return 0;
        }
        return a.sortField < b.sortField ? 1 : -1;
    });
    distinctItems = distinctItems.map((id) => sortedItems.filter((item) => item[objectId] == id).reverse()[0]);
    return distinctItems;
}
async function update_userInfo(res) {
    const topics = _.get(res, '_userInfo.recentTopics', []);
    const distinctTopics = getDistinctValues(topics, 'topic').slice(0, 10);
    _.set(res, '_userInfo.recentTopics', distinctTopics);
    qnabot.log(res._userInfo);
    const userId = _.get(res, '_userInfo.UserName') && _.get(res, '_userInfo.isVerifiedIdentity') == 'true' ? _.get(res, '_userInfo.UserName') : _.get(res, '_userInfo.UserId');
    _.set(res, '_userInfo.UserId', userId);
    const usersTable = process.env.DYNAMODB_USERSTABLE;
    const docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
    const params = {
        TableName: usersTable,
        Item: res._userInfo,
    };
    qnabot.log('Saving response user info to DynamoDB: ', params);
    let ddbResponse = {};
    try {
        ddbResponse = await docClient.put(params).promise();
    } catch (e) {
        qnabot.log('ERROR: DDB Exception caught - can\'t save userInfo: ', e);
    }
    qnabot.log('DDB Response: ', ddbResponse);
    return ddbResponse;
}

module.exports = async function userInfo(req, res) {
    qnabot.log('Entering userInfo Middleware');

    await update_userInfo(res);
    return { req, res };
};
