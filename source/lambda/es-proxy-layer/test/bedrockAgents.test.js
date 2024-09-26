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

const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { mockClient } = require('aws-sdk-client-mock');
const bedRockAgentMock = mockClient(BedrockAgentRuntimeClient);
const presigner = require('@aws-sdk/s3-request-presigner');
const qnabot = require('qnabot/logging');
const { bedrockRetrieveAndGenerate } = require('../lib/bedrock/bedrockAgents');
const _ = require('lodash');
require('aws-sdk-client-mock-jest');

const region = process.env.AWS_REGION || 'us-east-1';

jest.mock('qnabot/logging');
jest.mock('@aws-sdk/s3-request-presigner');

const promptTemplate = 'test-bedrock-agent-prompt';
const req = {
    question: 'what is ec2?',
    _settings: {
        KNOWLEDGE_BASE_ID: 'testKnowledgeBaseId',
        KNOWLEDGE_BASE_MODEL_ID: 'testModel',
        KNOWLEDGE_BASE_KMS: '',
        KNOWLEDGE_BASE_S3_SIGNED_URLS: true,
        KNOWLEDGE_BASE_SHOW_REFERENCES: true,
        KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS: 300,
        KNOWLEDGE_BASE_PREFIX_MESSAGE: 'Bedrock Agent:',
        KNOWLEDGE_BASE_PROMPT_TEMPLATE: promptTemplate,
        KNOWLEDGE_BASE_MAX_NUMBER_OF_RETRIEVED_RESULTS: 1,
        KNOWLEDGE_BASE_METADATA_FILTERS: '{}',
        KNOWLEDGE_BASE_SEARCH_TYPE: 'DEFAULT',
        KNOWLEDGE_BASE_MODEL_PARAMS: '{"temperature":0.3, "maxTokens": 245, "topP": 0.9 }',
        BEDROCK_GUARDRAIL_IDENTIFIER: '',
        BEDROCK_GUARDRAIL_VERSION: '',
    },
    _preferredResponseType: 'text'
}

const res = {
    _userInfo: {
        knowledgeBaseSessionId: undefined
    }
}

const response = {
    citations: [
        {
            retrievedReferences: [
                {
                    content: {
                        text: "compute capacity in the cloud."
                    },
                    location: {
                        s3Location: {
                            uri: "s3://my-bucket/aws-overview.pdf"
                        },
                        type: "S3"
                    }
                },
                {
                    content: {
                        text: "Deploy a Web UI"
                    },
                    location: {
                        webLocation: {
                          url: "https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/"
                        },
                        type: "WEB"
                    }
                }
            ]
        }
    ],
    output: {
        text: "Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud."
    }
}

const expectedResult = {
    a: 'Bedrock Agent:\n' +
        '\n' +
        'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.\n' +
        '\n' +
        '  compute capacity in the cloud.\n' +
        '\n' +
        '  Deploy a Web UI' +
        '\n' +
        '\n' +
        '  Source Link: https://signedurl.s3.amazonaws.com/aws-overview.pdf, https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/',
    alt: {
        markdown: '\n**Bedrock Agent:**\n' +
            '\n' +
            'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.\n\n<details>' +
            '\n' +
            '            <summary>Context</summary>\n' +
            '            <p style="white-space: pre-line;">\n' +
            '\n' +
            '***\n' +
            '\n' +
            ' <br>\n' +
            '\n' +
            '  compute capacity in the cloud.\n' +
            '\n' +
            '***\n' +
            '\n' +
            ' <br>\n' +
            '\n' +
            '  Deploy a Web UI</p>\n' +
            '            </details>\n' +
            '            <br>' +
            '\n' +
            '\n' +
            '  Source Link: <span translate=no>[aws-overview.pdf](https://signedurl.s3.amazonaws.com/aws-overview.pdf)</span>, <span translate=no>[deploy-a-web-ui-for-your-chatbot](https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/)</span>',
        ssml: '<speak> Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud. </speak>',
    },
    type: 'text',
    answersource: 'BEDROCK KNOWLEDGE BASE'
};

presigner.getSignedUrl.mockImplementation(() => {
    return 'https://signedurl.s3.amazonaws.com/aws-overview.pdf'
});

describe('bedrockAgents', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        bedRockAgentMock.reset();
    });

    test('bedrockRetrieveAndGenerate returns correct body when sessionId is new', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(req, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            },
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });


    test('bedrockRetrieveAndGenerate returns correct body when sessionId is existing', async () => {
        const sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(req, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            },
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
            sessionId,
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "testSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when sessionId is expired or invalid', async () => {
        let sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId

        const e = new Error('Invalid or Expired');
        e.name = 'ValidationException';
        sessionId = 'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).rejectsOnce(e).resolvesOnce(response);

        const result = await bedrockRetrieveAndGenerate(req, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 2);
        expect(bedRockAgentMock).toHaveReceivedNthCommandWith(1, RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            },
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
            sessionId: 'testSessionId',
        });
        expect(bedRockAgentMock).toHaveReceivedNthCommandWith(2, RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            }
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate modifies request and return correct body when additionalModelRequestFields is passed', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.KNOWLEDGE_BASE_MODEL_PARAMS = '{"temperature":0.3, "maxTokens": 245, "topP": 0.9, "top_k": 240 }'


        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            },
                        },
                        additionalModelRequestFields: {
                            "top_k": 240
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when prompt template and inference parameters are empty', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.KNOWLEDGE_BASE_PROMPT_TEMPLATE = '';
        modifiedReq._settings.KNOWLEDGE_BASE_MODEL_PARAMS = '{}'
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when prompt template is empty but inference parameters are not empty', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.KNOWLEDGE_BASE_PROMPT_TEMPLATE = '';
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            },
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when prompt template and inference config are empty but additionalModelRequestFields is not empty', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.KNOWLEDGE_BASE_PROMPT_TEMPLATE = '';
        modifiedReq._settings.KNOWLEDGE_BASE_MODEL_PARAMS = '{"top_k": 240 }'
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1
                        }
                    },
                    generationConfiguration: {
                        additionalModelRequestFields: {
                            "top_k": 240
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when VectorSearchConfiguration is overriden with SearchTyoe', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.KNOWLEDGE_BASE_SEARCH_TYPE = 'HYBRID'
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1,
                            overrideSearchType: 'HYBRID'
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            }
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when GuardrailConfiguration is overriden', async () => {
        const sessionId = 'newSessionId';
        response.sessionId = sessionId;
        const modifiedReq = _.cloneDeep(req)
        modifiedReq._settings.BEDROCK_GUARDRAIL_IDENTIFIER = 'ds9asa'
        modifiedReq._settings.BEDROCK_GUARDRAIL_VERSION = '2'
        bedRockAgentMock.on(RetrieveAndGenerateCommand).resolves(response);

        const result = await bedrockRetrieveAndGenerate(modifiedReq, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(bedRockAgentMock).toHaveReceivedCommandWith(RetrieveAndGenerateCommand, {
            input: {
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration: {
                knowledgeBaseConfiguration: {
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                    retrievalConfiguration: {
                        vectorSearchConfiguration: {
                            numberOfResults: 1,
                        }
                    },
                    generationConfiguration: {
                        promptTemplate: {
                            textPromptTemplate: promptTemplate,
                        },
                        inferenceConfig: {
                            textInferenceConfig: {
                                "maxTokens": 245,
                                "temperature": 0.3,
                                "topP": 0.9
                            }
                        },
                        guardrailConfiguration: {
                            guardrailId: 'ds9asa',
                            guardrailVersion: '2'
                        },
                    },
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
                got_hits: 1,
                session: { qnabot_gotanswer: true },
            },
            expectedResult
        ]);
    });

    test('bedrockRetrieveAndGenerate handles other errors', async () => {
        let sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId

        const e = new Error('Invalid or Expired');
        sessionId = 'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).rejects(e);

        await expect(bedrockRetrieveAndGenerate(req, res)).rejects.toThrowError(e);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        expect(qnabot.log).toHaveBeenCalledTimes(4);

    });

    test('bedrockRetrieveAndGenerate handles ValidationException correctly', async () => {
        let sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId

        const e = new Error('Model is not valid');
        e.name = "ValidationException";
        sessionId = 'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).rejects(e);

        await expect(bedrockRetrieveAndGenerate(req, res)).rejects.toThrowError(e);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 2);
        expect(qnabot.log).toHaveBeenCalledTimes(5);

    });
});
