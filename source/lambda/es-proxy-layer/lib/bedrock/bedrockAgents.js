/* eslint-disable max-len */
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
const customSdkConfig = require('sdk-config/customSdkConfig');
const { signUrls } = require('../signS3URL');
const llm = require('../llm');
const qnabot = require('qnabot/logging');
const _ = require('lodash');

const region = process.env.AWS_REGION || 'us-east-1';

function isNoHitsResponse(req, response) {
    const { text } = response.output;
    const { retrievedReferences } = response.citations;
    return !retrievedReferences && llm.isNoHits(req, text);
}

async function generateResponse(client, input, res) {
    const response = await client.send(new RetrieveAndGenerateCommand(input));
    const sessionId  = response.sessionId;
    if (res._userInfo.knowledgeBaseSessionId !== sessionId) {
        qnabot.debug(`Saving sessionId: ${sessionId}`);
        res._userInfo.knowledgeBaseSessionId = sessionId;
    }
    return response;
}

async function generateSourceLinks(urls, KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS) {
    const urlArr = Array.from(urls);
    const signedUrls = await signUrls(urlArr, KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS);
    const signedUrlArr = Array.from(signedUrls);
    qnabot.debug(`signedUrls: ${JSON.stringify(signedUrlArr)}`);
    const urlListMarkdown = signedUrlArr.map((url, i) => {
        const label = urlArr[i].split('/').pop();
        return `<span translate=no>[${label}](${url})</span>`;
    });

    return { signedUrlArr, urlListMarkdown };
}
async function createHit(req, response) {
    const KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS = _.get(req._settings, 'KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS', 300);
    const KNOWLEDGE_BASE_S3_SIGNED_URLS = _.get(req._settings, 'KNOWLEDGE_BASE_S3_SIGNED_URLS', true);
    const KNOWLEDGE_BASE_SHOW_REFERENCES = _.get(req._settings, 'KNOWLEDGE_BASE_SHOW_REFERENCES');
    const KNOWLEDGE_BASE_PREFIX_MESSAGE = _.get(req._settings, 'KNOWLEDGE_BASE_PREFIX_MESSAGE'); 
    const helpfulLinksMsg = 'Source Link';
    const generatedText = response.output.text;
    let plainText = generatedText;
    let markdown = generatedText;
    const ssml = `<speak> ${generatedText} </speak>`;

    if (KNOWLEDGE_BASE_PREFIX_MESSAGE) {
        plainText = `${KNOWLEDGE_BASE_PREFIX_MESSAGE}\n\n${plainText}`;
        markdown = `**${KNOWLEDGE_BASE_PREFIX_MESSAGE}**\n\n${markdown}`;
    }

    const urls = new Set();

    let plainTextCitations = '';
    let markdownCitations = '';

    response.citations.forEach((citation) => {
        citation.retrievedReferences.forEach((reference) => {
            markdownCitations += '\n\n';
            markdownCitations += '***';
            markdownCitations += '\n\n <br>';
            if (reference.content.text) {
                markdownCitations += `\n\n  ${reference.content.text}`;
                plainTextCitations += `\n\n  ${reference.content.text}`;
            }

            if (reference.location.type === 'S3') {
                const { uri } = reference.location.s3Location;
                urls.add(uri);
            }
        });
    });

    if (KNOWLEDGE_BASE_SHOW_REFERENCES) {
        plainText += plainTextCitations;
        markdown = markdownCitations
            ? `${markdown}<details>
            <summary>Context</summary>
            <p style="white-space: pre-line;">${markdownCitations}</p>
            </details>
            <br>`
            : markdown;
    }

    if (KNOWLEDGE_BASE_S3_SIGNED_URLS && urls.size !== 0) {
        const { signedUrlArr, urlListMarkdown } = await generateSourceLinks(urls, KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS);

        plainText += `\n\n  ${helpfulLinksMsg}: ${signedUrlArr.join(', ')}`;
        markdown += `\n\n  ${helpfulLinksMsg}: ${urlListMarkdown.join(', ')}`;
    }

    const hit = {
        a: plainText,
        alt: {
            markdown,
            ssml,
        },
        type: 'text',
        answersource: 'BEDROCK KNOWLEDGE BASE',
    };

    qnabot.log(`Returned hit from Bedrock Knowledge Base: ${JSON.stringify(hit)}`);
    return hit;
}

async function bedrockRetrieveAndGenerate(req, res) {
    const {
        KNOWLEDGE_BASE_ID,
        KNOWLEDGE_BASE_MODEL_ID,
        KNOWLEDGE_BASE_KMS,
    } = req._settings;
    
    const client = new BedrockAgentRuntimeClient(customSdkConfig('C41', { region }));
    const { question } = req;

    let retrieveAndGenerateInput, retrieveAndGenerateSessionInput, response;

    retrieveAndGenerateInput = {
        input: {
            text: question,
        },
        retrieveAndGenerateConfiguration: {
            type: 'KNOWLEDGE_BASE',
            knowledgeBaseConfiguration: {
                knowledgeBaseId: KNOWLEDGE_BASE_ID,
                modelArn: `arn:aws:bedrock:${region}::foundation-model/${KNOWLEDGE_BASE_MODEL_ID}`,
            },
        },
    };

    if (KNOWLEDGE_BASE_KMS) {
        retrieveAndGenerateInput.sessionConfiguration = {
            kmsKeyArn: KNOWLEDGE_BASE_KMS,
        };
    }

    qnabot.log(`Bedrock Knowledge Base Id: ${KNOWLEDGE_BASE_ID} and Model Id: ${KNOWLEDGE_BASE_MODEL_ID}`);
    try {
        const sessionId = res._userInfo.knowledgeBaseSessionId;
        qnabot.log(`Bedrock Knowledge Base SessionId: ${sessionId}`);
        if (sessionId) {
            retrieveAndGenerateSessionInput = {
                ...retrieveAndGenerateInput,
                sessionId,
            };
            response = await generateResponse(client, retrieveAndGenerateSessionInput, res);
        } else {
            response = await generateResponse(client, retrieveAndGenerateInput, res);
        };
    } catch (e) {
        if (e.name === 'ValidationException' || e.name === 'ConflictException') {
            response = await generateResponse(client, retrieveAndGenerateInput, res);
        } else {
            qnabot.log(`Bedrock Knowledge Base ${e.name}: ${e.message.substring(0, 500)}`)
            throw e;
        }
    }   
    qnabot.debug(`Response from bedrock knowledge base: ${JSON.stringify(response)}`);

    if (isNoHitsResponse(req, response)) {
        qnabot.log('No hits from knowledge base.');
        return [res, undefined];
    }

    const hit = await createHit(req, response);
    return [res, hit];
}
exports.bedrockRetrieveAndGenerate = bedrockRetrieveAndGenerate;
