/* eslint-disable max-len */
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, RetrieveAndGenerateStreamCommand } = require('@aws-sdk/client-bedrock-agent-runtime');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
const customSdkConfig = require('sdk-config/customSdkConfig');
const { signUrls } = require('../signS3URL');
const llm = require('../llm');
const qnabot = require('qnabot/logging');
const _ = require('lodash');
const { sanitize, escapeHashMarkdown } = require('../sanitizeOutput');
const { getConnectionId } = require('../getConnectionId');
const { applyModelIdMapping } = require('./bedrockModelConstants');

const region = process.env.AWS_REGION || 'us-east-1';
const inferenceKeys = ['maxTokens', 'stopSequences', 'temperature', 'topP'];
const client = new BedrockAgentRuntimeClient(customSdkConfig('C41', { region }));

function isNoHitsResponse(req, response) {
    const { text } = response.output;
    const { retrievedReferences } = response.citations;
    return !retrievedReferences && llm.isNoHits(req, text);
}

async function generateResponse(input, streamingAttributes, res) {
    qnabot.log(`Bedrock Knowledge Base Input: ${JSON.stringify(input, null, 2)}`);
    let response;
    const streamingEnable = streamingAttributes?.streamingEndpoint && streamingAttributes?.streamingDynamoDbTable && streamingAttributes?.sessionId || false;

    if (streamingEnable) {
        response =  await retrieveAndGenerateStream(input, streamingAttributes);
    } else {
        response = await client.send(new RetrieveAndGenerateCommand(input));
    }

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

    return { urlListMarkdown };
}

async function retrieveAndGenerateStream(input, streamingAttributes) {
    const command = new RetrieveAndGenerateStreamCommand(input);
    const response = await client.send(command);

    qnabot.debug(`RetrieveAndGenerateStream API Response: ${JSON.stringify(response, null, 2)}`)
    const endpoint = streamingAttributes.streamingEndpoint;
    const tableName = streamingAttributes.streamingDynamoDbTable;
    const sessionId = streamingAttributes.sessionId;
    const connectionId = await getConnectionId(sessionId, tableName);

    const apiClient = new ApiGatewayManagementApiClient(customSdkConfig( 'C053', { region, endpoint }));

    let result = {
        output: {
            text: ''
        },
        sessionId: response?.sessionId,
        citations: []
    };

    for await (const stream of response.stream) {
        if (stream?.output) {
            const part = stream.output?.text;
            result.output.text +=  part;
            try {
                const input = {
                    Data: part, 
                    ConnectionId: connectionId, 
                }
                const command = new PostToConnectionCommand(input);
                await apiClient.send(command);

            } catch (error) {
                qnabot.error(`${error.name}: ${error.message.substring(0, 500)} while posting to stream connection`);
            }
        }

        if (stream?.citation) {
            result.citations.push(stream.citation.citation);
        }

        if (stream?.guardrail?.action) {
            qnabot.log(`Guardrail Action in Bedrock Knowledge Base Response: ${stream?.guardrail.action}`);
        }
    }
    return result;
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
        markdown = `**${KNOWLEDGE_BASE_PREFIX_MESSAGE}**\n\n${markdown}`;
    }

    const { markdownCitations, urls } = processCitations(response);

    if (KNOWLEDGE_BASE_SHOW_REFERENCES) {
        markdown = markdownCitations
            ? `\n${markdown}\n\n<details>
            <summary>Context</summary>
            <p style="white-space: pre-line;">${markdownCitations}</p>
            </details>
            <br>`
            : markdown;
    }

    if (KNOWLEDGE_BASE_S3_SIGNED_URLS && urls.size !== 0) {
        const { urlListMarkdown } = await generateSourceLinks(urls, KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS);
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

    let markdownCitations = '';

    response.citations.forEach((citation) => {
        citation.retrievedReferences.forEach((reference) => {
            markdownCitations += '\n\n';
            markdownCitations += '***';
            markdownCitations += '\n\n <br>';
            if (reference.content.text) {
                const text = escapeHashMarkdown(reference.content.text);
                markdownCitations += `\n\n  ${text}`;
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
    return { markdownCitations, urls };
}

function createModelArn(modelId) {
    // Construct the proper ARN based on whether it's an inference profile or foundation model
    // Inference profiles have 3 dot-separated parts: <region>.<provider>.<model>
    // Foundation models have 2 parts: <provider>.<model>
    const isInferenceProfile = modelId.split('.').length === 3;
    
    if (isInferenceProfile) {
        const accountId = process.env.AWS_ACCOUNT_ID;
        return `arn:aws:bedrock:${region}:${accountId}:inference-profile/${modelId}`;
    }
    return `arn:aws:bedrock:${region}::foundation-model/${modelId}`;
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

    // Apply backward compatibility mapping if available
    const modelId = applyModelIdMapping(KNOWLEDGE_BASE_MODEL_ID);
    
    const modelArn = createModelArn(modelId);
    
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

    qnabot.log(`Bedrock Knowledge Base Request - KB ID: ${KNOWLEDGE_BASE_ID}, Model ID: ${KNOWLEDGE_BASE_MODEL_ID}, Model ARN: ${modelArn}`);
    return retrieveAndGenerateInput;
}

async function bedrockRetrieveAndGenerate(req, res) {

    const { LLM_STREAMING_ENABLED, STREAMING_TABLE } = req._settings;
    const sessionAttributes = req._event?.sessionState?.sessionAttributes;
    let streamingAttributes = {};

    const sessionId = req._event.sessionId;
    const streamingEndpoint = sessionAttributes?.streamingEndpoint;
    let streamingDynamoDbTable = sessionAttributes?.streamingDynamoDbTable;

    if (LLM_STREAMING_ENABLED && streamingEndpoint && !streamingDynamoDbTable) {
        streamingDynamoDbTable = STREAMING_TABLE;
        qnabot.log(`Streaming enabled, using ${streamingEndpoint} and table ${streamingDynamoDbTable} for session ${sessionId}`);
        streamingAttributes = {
            sessionId,
            streamingEndpoint,
            streamingDynamoDbTable
        };
    }

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
            response = await generateResponse(retrieveAndGenerateSessionInput, streamingAttributes, res);
        } else {
            response = await generateResponse(retrieveAndGenerateInput, streamingAttributes, res);
        }
    } catch (e) {
        if (retries < 3 && (e.name === 'ValidationException' || e.name === 'ConflictException')) {
            retries += 1;
            qnabot.log(`Retrying to due ${e.name}...tries left ${3 - retries}`)
            response = await generateResponse(retrieveAndGenerateInput, streamingAttributes, res);
        } else {
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