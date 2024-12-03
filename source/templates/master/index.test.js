/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const indexModule = require('./index');

function create() {
    const file = `${__dirname}/`;
    return require(file);
}

describe('Verify master template is correct', () => {
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
                ESWarmerCodeVersion: {
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
                SolutionHelperCodeVersion: {
                    Properties: {
                        BuildDate: expect.any(String),
                    },
                },
                S3ClearCodeVersion: {
                    Properties: {
                        BuildDate: expect.any(String),
                    },
                },
            },
        });
    });

    test('that all template parameters have descriptions', () => {
        const parameters = indexModule.Parameters;
        const keys = Object.keys(parameters);
        keys.forEach((key) => {
            const description = parameters[key].Description;
            if (!description) {
                throw new Error(`No description defined for parameter: ${key}`);
            }
        });
    });

    test('that all string template parameters have allowed values or patterns', () => {
        const parameters = indexModule.Parameters;
        const keys = Object.keys(parameters);
        keys.forEach((key) => {
            if (parameters[key].Type == 'String') {
                const allowedValuesOrPatterns = parameters[key].AllowedValues
                    || parameters[key].AllowedPattern;
                if (!allowedValuesOrPatterns) {
                    throw new Error(`No allowed values or patterns defined for parameter: ${key}`);
                }
            }
        });
    });

    test('that all number template parameters have minimum values defined', () => {
        const parameters = indexModule.Parameters;
        const keys = Object.keys(parameters);
        keys.forEach((key) => {
            if (parameters[key].Type == 'Number') {
                if (parameters[key].MinValue == null) {
                    throw new Error(`No minimum value defined for parameter: ${key}`);
                }
            }
        });
    });

    test('that all String parameters have constraint descriptions', () => {
        const parameters = indexModule.Parameters;
        const keys = Object.keys(parameters);
        keys.forEach((key) => {
            if (parameters[key].Type == 'String' && !parameters[key].AllowedValues) {
                const constraintDescription = parameters[key].ConstraintDescription;
                if (!constraintDescription) {
                    throw new Error(`No constraint description defined for parameter: ${key}`);
                }
            }
        });
    });
});
