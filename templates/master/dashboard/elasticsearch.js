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

const fs = require('fs');
const _ = require('lodash');
const util = require('./util');
const lambdas = require('./lambdas');

module.exports = function (offset) {
    const title = util.Title('## ElasticSearch', offset);
    const widgets = [
        {
            type: 'metric',
            width: 6,
            height: 6,
            properties: {
                view: 'timeSeries',
                stacked: false,
                metrics: [
                    ['AWS/ES', 'ReadLatency', 'DomainName', '${ESVar.ESDomain}', 'ClientId', '${AWS::AccountId}'],
                ],
                region: '${AWS::Region}',
            },
        },
        {
            type: 'metric',
            width: 6,
            height: 6,
            properties: {
                view: 'timeSeries',
                stacked: false,
                metrics: [
                    ['AWS/ES', 'ReadIOPS', 'DomainName', '${ESVar.ESDomain}', 'ClientId', '${AWS::AccountId}'],
                    ['.', 'ReadThroughput', '.', '.', '.', '.', { yAxis: 'right' }],
                ],
                region: '${AWS::Region}',
            },
        },
        {
            type: 'metric',
            width: 6,
            height: 6,
            properties: {
                view: 'timeSeries',
                stacked: false,
                metrics: [
                    ['AWS/ES', 'CPUUtilization', 'DomainName', '${ESVar.ESDomain}', 'ClientId', '${AWS::AccountId}'],
                ],
                region: '${AWS::Region}',
            },
        },
        {
            type: 'metric',
            x: 18,
            y: 0,
            properties: {
                view: 'timeSeries',
                stacked: false,
                metrics: [
                    ['AWS/ES', 'ClusterUsedSpace', 'DomainName', '${ESVar.ESDomain}', 'ClientId', '${AWS::AccountId}'],
                    ['.', 'SearchableDocuments', '.', '.', '.', '.', { yAxis: 'right' }],
                ],
                region: '${AWS::Region}',
            },
        },
        {
            type: 'metric',
            width: 6,
            height: 6,
            properties: {
                view: 'timeSeries',
                stacked: false,
                metrics: [
                    ['AWS/ES', 'ClusterStatus.green', 'DomainName', '${ESVar.ESDomain}', 'ClientId', '${AWS::AccountId}', { color: '#2ca02c' }],
                    ['.', 'ClusterStatus.red', '.', '.', '.', '.', { color: '#d62728' }],
                    ['.', 'ClusterStatus.yellow', '.', '.', '.', '.', { color: '#bcbd22' }],
                ],
                region: '${AWS::Region}',
            },
        },
    ].map(util.place(offset + title.height));

    return _.flatten([title, widgets]);
};
