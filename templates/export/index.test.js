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

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

it('renders export template correctly', () => {
    const template = create();
    expect(template).toMatchSnapshot({
        Resources: {
            ConnectCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            Deployment: {
                Properties: {
                    buildDate: expect.any(Date),
                },
            },
            ExportCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            GenesysCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerScheduleUpdateCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            KendraNativeCrawlerStatusCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            SyncCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            TranslateCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
        },
    });
});
