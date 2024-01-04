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

it('renders master template correctly', () => {
    const template = create();
    expect(template).toMatchSnapshot({
        Resources: {
            AssetZipVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            AwsSdkLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            CFNVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            CfnLambdaLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            CommonModulesLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            Deployment: {
                Properties: {
                    buildDate: expect.any(Date),
                },
            },
            ESProxyCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            EsProxyLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            FulfillmentCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            InfoVar: {
                Properties: {
                    BuildDate: expect.any(Date),
                    BuildDateString: expect.any(String),
                    Version: expect.any(String),
                },
            },
            LexBuildCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            LexV2Bot: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            Lexv2BotCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            QnABotCommonLayerCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            SchemaLambdaCodeVersion: {
                Properties: {
                    BuildDate: expect.any(String),
                },
            },
            Unzip: {
                Properties: {
                    buildDate: expect.any(Date),
                },
            },
        },
    });
});
