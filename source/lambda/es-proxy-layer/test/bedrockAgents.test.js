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
require('aws-sdk-client-mock-jest');

const region = process.env.AWS_REGION || 'us-east-1';

jest.mock('qnabot/logging');
jest.mock('@aws-sdk/s3-request-presigner');


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
    },
    _preferredResponseType: 'text'
}

const res = {
    _userInfo: {
        knowledgeBaseSessionId : undefined
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
                        text: "secure Linux or Windows Server images"
                    },
                    location: {
                        s3Location: {
                            uri: "s3://my-bucket/aws-overview.pdf"
                        },
                        type: "S3"
                    }
                }
            ]
        }
    ],
    output: {
        text: "Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud."
    }
}


presigner.getSignedUrl.mockImplementation(() => {
    return 'https://signedurl.s3.amazonaws.com/'
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
            input:{
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration:{
                knowledgeBaseConfiguration:{
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                },
                type: 'KNOWLEDGE_BASE',
            }
        });
        expect(result).toStrictEqual([
            {
                _userInfo: {knowledgeBaseSessionId: "newSessionId"},
            },
            {
                a: 'Bedrock Agent:\n' +
                  '\n' +
                  'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.\n' +
                  '\n' +
                  '  compute capacity in the cloud.\n' +
                  '\n' +
                  '  secure Linux or Windows Server images' +
                  '\n' +
                  '\n' +
                  '  Source Link: https://signedurl.s3.amazonaws.com/',
                alt: {
                  markdown: '**Bedrock Agent:**\n' +
                    '\n' +
                    'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.<details>' +
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
                    '  secure Linux or Windows Server images</p>\n' +
                    '            </details>\n' +
                    '            <br>' +
                    '\n' +
                    '\n' +
                    '  Source Link: <span translate=no>[aws-overview.pdf](https://signedurl.s3.amazonaws.com/)</span>',
                  ssml: '<speak> Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud. </speak>',
                },
                type: 'text',
                answersource: 'BEDROCK KNOWLEDGE BASE'
              }
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
            input:{
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration:{
                knowledgeBaseConfiguration:{
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                },
                type: 'KNOWLEDGE_BASE',
            },
            sessionId,
        });
        expect(result).toStrictEqual([
            {
                _userInfo: {knowledgeBaseSessionId: "testSessionId"},
            },
            {
                a: 'Bedrock Agent:\n' +
                  '\n' +
                  'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.\n' +
                  '\n' +
                  '  compute capacity in the cloud.\n' +
                  '\n' +
                  '  secure Linux or Windows Server images' +
                  '\n' +
                  '\n' +
                  '  Source Link: https://signedurl.s3.amazonaws.com/',
                alt: {
                  markdown: '**Bedrock Agent:**\n' +
                    '\n' +
                    'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.<details>' +
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
                    '  secure Linux or Windows Server images</p>\n' +
                    '            </details>\n' +
                    '            <br>' +
                    '\n' +
                    '\n' +
                    '  Source Link: <span translate=no>[aws-overview.pdf](https://signedurl.s3.amazonaws.com/)</span>',
                  ssml: '<speak> Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud. </speak>',
                },
                type: 'text',
                answersource: 'BEDROCK KNOWLEDGE BASE'
              }
        ]);
    });

    test('bedrockRetrieveAndGenerate returns correct body when sessionId is expired or invalid', async () => {
        let sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId

        const e = new Error('Invalid or Expired');
        e.name = 'ValidationException';
        sessionId =  'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).rejectsOnce(e).resolvesOnce(response);

        const result = await bedrockRetrieveAndGenerate(req, res);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 2);
        expect(bedRockAgentMock).toHaveReceivedNthCommandWith(1, RetrieveAndGenerateCommand, {
            input:{
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration:{
                knowledgeBaseConfiguration:{
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                },
                type: 'KNOWLEDGE_BASE',
            },
            sessionId: 'testSessionId',
        });
        expect(bedRockAgentMock).toHaveReceivedNthCommandWith(2, RetrieveAndGenerateCommand, {
            input:{
                text: 'what is ec2?',
            },
            retrieveAndGenerateConfiguration:{
                knowledgeBaseConfiguration:{
                    knowledgeBaseId: 'testKnowledgeBaseId',
                    modelArn: `arn:aws:bedrock:${region}::foundation-model/testModel`,
                },
                type: 'KNOWLEDGE_BASE',
            },
        });
        expect(result).toStrictEqual([
            {
                _userInfo: { knowledgeBaseSessionId: "newSessionId" },
            },
            {
                a: 'Bedrock Agent:\n' +
                  '\n' +
                  'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.\n' +
                  '\n' +
                  '  compute capacity in the cloud.\n' +
                  '\n' +
                  '  secure Linux or Windows Server images' +
                  '\n' +
                  '\n' +
                  '  Source Link: https://signedurl.s3.amazonaws.com/',
                alt: {
                  markdown: '**Bedrock Agent:**\n' +
                    '\n' +
                    'Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud.<details>' +
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
                    '  secure Linux or Windows Server images</p>\n' +
                    '            </details>\n' +
                    '            <br>' +
                    '\n' +
                    '\n' +
                    '  Source Link: <span translate=no>[aws-overview.pdf](https://signedurl.s3.amazonaws.com/)</span>',
                  ssml: '<speak> Amazon EC2 (Amazon Elastic Compute Cloud) is a web service that provides secure, resizable compute capacity in the cloud. </speak>',
                },
                type: 'text',
                answersource: 'BEDROCK KNOWLEDGE BASE'
              }
        ]);
    });

    test('bedrockRetrieveAndGenerate handles other errors', async () => {
        let sessionId = 'testSessionId';
        res._userInfo.knowledgeBaseSessionId = sessionId
        response.sessionId = sessionId

        const e = new Error('Invalid or Expired');
        sessionId =  'newSessionId';
        response.sessionId = sessionId;
        bedRockAgentMock.on(RetrieveAndGenerateCommand).rejects(e);
        
        await expect(bedrockRetrieveAndGenerate(req, res)).rejects.toThrowError(e);
        expect(bedRockAgentMock).toHaveReceivedCommandTimes(RetrieveAndGenerateCommand, 1);
        
    });

});
