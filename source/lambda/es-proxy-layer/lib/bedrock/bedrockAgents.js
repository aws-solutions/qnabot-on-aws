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

const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const customSdkConfig = require('sdk-config/customSdkConfig');
const { signUrls } = require('../signS3URL');
const llm = require('../llm');
const qnabot = require('qnabot/logging');
const _ = require('lodash');
const { sanitize, escapeHashMarkdown } = require('../sanitizeOutput');

const region = process.env.AWS_REGION || 'us-east-1';
const inferenceKeys = ['maxTokens', 'stopSequences', 'temperature', 'topP'];
const client = new BedrockAgentRuntimeClient(customSdkConfig('C41', { region }));

function isNoHitsResponse(req, response) {
    const { text } = response.output;
    const { retrievedReferences } = response.citations;
    return !retrievedReferences && llm.isNoHits(req, text);
}

async function generateResponse(input, res) {
    qnabot.log(`Bedrock Knowledge Base Input: ${JSON.stringify(input, null, 2)}`);

    const response = await client.send(new RetrieveAndGenerateCommand(input));

    const sessionId = response.sessionId;
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
        let label = urlArr[i].split('/').pop();
        if (!label) { // Handle crawled URLs ending with a slash
            label = url.split('/').slice(-2, -1)[0];
        }
        const link = `<span translate=no>[${label}](${url})</span>`;
        return link;
    });

    return { signedUrlArr, urlListMarkdown };
}
async function createHit(req, response) {
    const KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS = _.get(req._settings, 'KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS', 300);
    const KNOWLEDGE_BASE_S3_SIGNED_URLS = _.get(req._settings, 'KNOWLEDGE_BASE_S3_SIGNED_URLS', true);
    const KNOWLEDGE_BASE_SHOW_REFERENCES = _.get(req._settings, 'KNOWLEDGE_BASE_SHOW_REFERENCES');
    const KNOWLEDGE_BASE_PREFIX_MESSAGE = _.get(req._settings, 'KNOWLEDGE_BASE_PREFIX_MESSAGE');
    const helpfulLinksMsg = 'Source Link';
    const generatedText = sanitize(response.output.text);
    let plainText = generatedText;
    let markdown = generatedText;
    const ssml = `<speak> ${generatedText} </speak>`;
    if (KNOWLEDGE_BASE_PREFIX_MESSAGE) {
        plainText = `${KNOWLEDGE_BASE_PREFIX_MESSAGE}\n\n${plainText}`;
        markdown = `**${KNOWLEDGE_BASE_PREFIX_MESSAGE}**\n\n${markdown}`;
    }

    const { plainTextCitations, markdownCitations, urls } = processCitations(response);

    if (KNOWLEDGE_BASE_SHOW_REFERENCES) {
        plainText += plainTextCitations;
        markdown = markdownCitations
            ? `\n${markdown}\n\n<details>
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

function processCitations(response) {
    const urls = new Set();

    let plainTextCitations = '';
    let markdownCitations = '';

    response.citations.forEach((citation) => {
        citation.retrievedReferences.forEach((reference) => {
            markdownCitations += '\n\n';
            markdownCitations += '***';
            markdownCitations += '\n\n <br>';
            if (reference.content.text) {
                const text = escapeHashMarkdown(reference.content.text);
                markdownCitations += `\n\n  ${text}`;
                plainTextCitations += `\n\n  ${text}`;
            }

            if (reference.location) {
                const { type, s3Location, webLocation } = reference.location;

                if (type === 'S3' && s3Location?.uri) {
                    const { uri } = reference.location.s3Location;
                    urls.add(uri);
                };

                if (type === 'WEB' && webLocation?.url) {
                    const { url } = reference.location.webLocation;
                    urls.add(url);
                };
            }
        });
    });
    return { plainTextCitations, markdownCitations, urls };
}

function processRequest(req) {
    const {
        KNOWLEDGE_BASE_ID,
        KNOWLEDGE_BASE_MODEL_ID,
        KNOWLEDGE_BASE_KMS,
        KNOWLEDGE_BASE_PROMPT_TEMPLATE,
        KNOWLEDGE_BASE_MAX_NUMBER_OF_RETRIEVED_RESULTS,
        KNOWLEDGE_BASE_SEARCH_TYPE,
        KNOWLEDGE_BASE_METADATA_FILTERS,
        KNOWLEDGE_BASE_MODEL_PARAMS,
        BEDROCK_GUARDRAIL_IDENTIFIER,
        BEDROCK_GUARDRAIL_VERSION,
    } = req._settings;

    const modelArn = `arn:aws:bedrock:${region}::foundation-model/${KNOWLEDGE_BASE_MODEL_ID}`;
    let { question } = req;
    question = question.slice(0, 1000); // No more than 1000 characters - for bedrock query compatibility

    const sessionConfiguration = KNOWLEDGE_BASE_KMS ? { kmsKeyArn: KNOWLEDGE_BASE_KMS } : undefined;
    const promptTemplate = KNOWLEDGE_BASE_PROMPT_TEMPLATE.trim() ? { textPromptTemplate: KNOWLEDGE_BASE_PROMPT_TEMPLATE } : undefined;
    const guardrailId = BEDROCK_GUARDRAIL_IDENTIFIER.trim();
    const guardrailVersion = BEDROCK_GUARDRAIL_VERSION.toString();

    const vectorSearchConfigurationProps = {
        ...(KNOWLEDGE_BASE_MAX_NUMBER_OF_RETRIEVED_RESULTS !== '' && { numberOfResults: KNOWLEDGE_BASE_MAX_NUMBER_OF_RETRIEVED_RESULTS }),
        ...(KNOWLEDGE_BASE_SEARCH_TYPE !== 'DEFAULT' && { overrideSearchType: KNOWLEDGE_BASE_SEARCH_TYPE }),
        ...(KNOWLEDGE_BASE_METADATA_FILTERS !== '{}' && { filter: JSON.parse(KNOWLEDGE_BASE_METADATA_FILTERS) })
    };

    const modelParams = JSON.parse(KNOWLEDGE_BASE_MODEL_PARAMS);
    const textInferenceConfig = _.pick(modelParams, inferenceKeys);
    const additionalModelRequestFields = _.omit(modelParams, inferenceKeys);

    const generationConfiguration = {};

    if (promptTemplate) {
        generationConfiguration.promptTemplate = promptTemplate;
    }

    if (Object.keys(textInferenceConfig).length !== 0) {
        generationConfiguration.inferenceConfig = { textInferenceConfig };
    }

    if (Object.keys(additionalModelRequestFields).length !== 0) {
        generationConfiguration.additionalModelRequestFields = additionalModelRequestFields;
    }

    if (guardrailId && guardrailVersion) {
        generationConfiguration.guardrailConfiguration = { guardrailId, guardrailVersion };
    }

    const retrievalConfiguration = {
        ...(Object.keys(vectorSearchConfigurationProps).length > 0 && { vectorSearchConfiguration: vectorSearchConfigurationProps })
    }

    const retrieveAndGenerateInput = {
        input: {
            text: question,
        },
        retrieveAndGenerateConfiguration: {
            type: 'KNOWLEDGE_BASE',
            knowledgeBaseConfiguration: {
                knowledgeBaseId: KNOWLEDGE_BASE_ID,
                modelArn,
                ...(Object.keys(retrievalConfiguration).length > 0 && { retrievalConfiguration }),
                ...(Object.keys(generationConfiguration).length > 0 && { generationConfiguration }),
            },
        },
        ...(sessionConfiguration && { sessionConfiguration })
    };


    qnabot.log(`Using Bedrock Knowledge Base Id: ${KNOWLEDGE_BASE_ID} and Model Id: ${KNOWLEDGE_BASE_MODEL_ID}`);
    return retrieveAndGenerateInput;
}

async function bedrockRetrieveAndGenerate(req, res) {
    let response, retrieveAndGenerateSessionInput;
    let retrieveAndGenerateInput = processRequest(req);
    let retries = 0;

    try {
        const sessionId = res._userInfo.knowledgeBaseSessionId;
        qnabot.log(`Bedrock Knowledge Base SessionId: ${sessionId}`);
        if (sessionId) {
            retrieveAndGenerateSessionInput = {
                ...retrieveAndGenerateInput,
                sessionId
            };
            response = await generateResponse(retrieveAndGenerateSessionInput, res);
        } else {
            response = await generateResponse(retrieveAndGenerateInput, res);
        }
    } catch (e) {
        if (retries < 3 && (e.name === 'ValidationException' || e.name === 'ConflictException')) {
            retries += 1;
            qnabot.log(`Retrying to due ${e.name}...tries left ${3 - retries}`)
            response = await generateResponse(retrieveAndGenerateInput, res);
        } else {
            qnabot.log(`Bedrock Knowledge Base ${e.name}: ${e.message.substring(0, 500)}`);
            throw e;
        };
    };

    qnabot.log(`Bedrock Knowledge Base Response: ${JSON.stringify(response)}`);

    const guardrailAction = response.guardrailAction;
    if (guardrailAction) {
        qnabot.log(`Guardrail Action in Bedrock Knowledge Base Response: ${guardrailAction}`);
    };

    if (isNoHitsResponse(req, response)) {
        qnabot.log('No hits from knowledge base.');
        return [res, undefined];
    };

    const hit = await createHit(req, response);

    // we got a hit, let's update the session parameters
    _.set(res, 'session.qnabot_gotanswer', true);
    res.got_hits = 1;

    return [res, hit];
}

exports.bedrockRetrieveAndGenerate = bedrockRetrieveAndGenerate;