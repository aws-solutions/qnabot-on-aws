/* eslint-disable max-len */
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const defaultSettings = {
    ENABLE_DEBUG_RESPONSES: 'false', // Appends a debugging message in the aws-lex-web-ui client for each QnABot response.
    ENABLE_DEBUG_LOGGING: 'false', // Controls verbosity of the QnABot Cloudwatch log. Set to true to see QnABot debug messages.
    ES_USE_KEYWORD_FILTERS: '${ES_USE_KEYWORD_FILTERS}', // Determines whether to detect keywords from Comprehend when searching for answers. Defaults to TRUE when not using Embeddings, and FALSE if using Embeddings.
    ES_EXPAND_CONTRACTIONS: '{"you\'re":"you are","I\'m":"I am","can\'t":"cannot"}', // Dictionary of contractions and their expansions. Used to replace contracted forms such as `I'm` to `I am` for improved matching.
    ES_KEYWORD_SYNTAX_TYPES: 'NOUN,PROPN,VERB,INTJ', // Comprehend will return these parts of speech found by Amazon Comprehend
    ES_SYNTAX_CONFIDENCE_LIMIT: 0.20, //  Comprehend makes a best effort to determine the parts of speech in a sentence. The keywords will only be used if the confidence limit is greater than this amount
    ES_MINIMUM_SHOULD_MATCH: '2<75%', // A query string that specifies a matching condition for OpenSearch, such as the minimum number of words to match and/or the percentage of words that must match. Refer to https://opensearch.org/docs/latest/query-dsl/minimum-should-match/ for more information
    ES_NO_HITS_QUESTION: 'no_hits', // The QID of the question when no answers could be found for a user's question
    ES_ERROR_QUESTION: 'error_msg', // The QID of the question when no answers could be found for a user's question due to an error
    ES_USE_FUZZY_MATCH: 'false', // Enables or disabled fuzzy matching which tries to correct for any possible misspellings. Refer to https://opensearch.org/docs/latest/query-dsl/term/fuzzy/
    ES_PHRASE_BOOST: 4, // If the user's question is a phrase match to a question in the knowledge then boost the score by this factor.
    ES_SCORE_ANSWER_FIELD: 'false', // If no 'qna' answer meets the score threshold, then query the answer field of qna items
    ES_SCORE_TEXT_ITEM_PASSAGES: 'true', // If no 'qna' answer meets the score threshold, then query the text field of 'text' items
    ENABLE_SENTIMENT_SUPPORT: 'true', // Determines whether to use Comprehend for sentiment analysis.  Refer to https://docs.aws.amazon.com/comprehend/latest/dg/how-sentiment.html
    ENABLE_MULTI_LANGUAGE_SUPPORT: 'false', // Enables automatic translation of incoming message to QnABot native language
    ENABLE_CUSTOM_TERMINOLOGY: 'false', // Enables the user of custom terminology preventing specific phrases from being translated for brand protection
    MINIMUM_CONFIDENCE_SCORE: 0.6, // The minimum confidence before Amazon Comprehend will determine the user's language
    ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE: 'HIGH', // Minimum score of a Kendra result that can be returned to the user. Should be one of 'VERY_HIGH'|'HIGH'|'MEDIUM'|'LOW'
    ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE: 'HIGH', // Minimum score of a Kendra result that can be returned to the user. Should be one of 'VERY_HIGH'|'HIGH'|'MEDIUM'|'LOW'
    ALT_SEARCH_KENDRA_S3_SIGNED_URLS: 'true', // If S3 document URL is in the search result, convert to signed URL. Please ensure IAM FulfillmentLambdaRole has access to S3 objects in Kendra index (default role grants access to buckets starting with name QNA or qna).
    ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS: 300, // Expiry time for signed URLs
    ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT: 2, // limit number of document search results returned by Kendra fallback
    ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE: 'Amazon Kendra suggested answer.', // Message displayed in the client when a Kendra result is returned
    ALT_SEARCH_KENDRA_FAQ_MESSAGE: 'Answer from Amazon Kendra FAQ.', // Message displayed in the client when a Kendra FAQ result is returned 
    ALT_SEARCH_KENDRA_ANSWER_MESSAGE:
        'While I did not find an exact answer, these search results from Amazon Kendra might be helpful.', // Message displayed when a search comes from Kendra
    ALT_SEARCH_KENDRA_RESPONSE_TYPES: 'ANSWER,DOCUMENT,QUESTION_ANSWER', // Types of responses Kendra will return to the user
    ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML: 'true', // Abbreviates the Kendra result for voice users
    KENDRA_FAQ_CONFIG_MAX_RETRIES: 8, // User can override number of max retries in AWS SDK configurations
    KENDRA_FAQ_CONFIG_RETRY_DELAY: 600, // User can override number of miliseconds delay between retries in AWS SDK configurations
    KENDRA_FAQ_ES_FALLBACK: 'true', // Optional OpenSearch Fallback engine for if KendraFAQ fails
    ENABLE_KENDRA_WEB_INDEXER: 'false', // Enables web crawler -- indexes pages specified by KENDRA_INDEXER_URLS
    KENDRA_INDEXER_URLS: '', // comma separated list of urls for Kendra to crawler
    KENDRA_INDEXER_CRAWL_DEPTH: 3, // The number of recursive links to open to index
    KENDRA_INDEXER_CRAWL_MODE: 'SUBDOMAINS', // Should be one of 'HOST_ONLY'|'SUBDOMAINS'|'EVERYTHING'
    KENDRA_INDEXER_SCHEDULE: 'rate(1 day)', // See https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html for valid expressions
    KENDRA_INDEXED_DOCUMENTS_LANGUAGES: 'en', // Comma separated language list, Eg: "en,es,fr". Should be one of supported Kendra languages mentioned in https://docs.aws.amazon.com/kendra/latest/dg/in-adding-languages.html
    ERRORMESSAGE: 'Unfortunately I encountered an error when searching for your answer. Please ask me again later.',
    EMPTYMESSAGE: 'You stumped me! Sadly I do not know how to answer your question.',
    DEFAULT_ALEXA_LAUNCH_MESSAGE: 'Hello, Please ask a question', // Default message returned to the user when the QnABot Alexa app is activated
    DEFAULT_ALEXA_REPROMPT:
        'Please either answer the question, ask another question or say Goodbye to end the conversation.', // Default reprompt message returned to the user when the QnABot Alexa app is activated
    DEFAULT_ALEXA_STOP_MESSAGE: 'Goodbye', // Default utterance to end the Alexa conversation
    SMS_HINT_REMINDER_ENABLE: 'true',
    SMS_HINT_REMINDER: ' (Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)',
    SMS_HINT_REMINDER_INTERVAL_HRS: 24,
    IDENTITY_PROVIDER_JWKS_URLS: [], // User can override this empty list to add trusted IdPs (eg from Lex-Web-UI)
    ENFORCE_VERIFIED_IDENTITY: 'false', // set to true to make QnABot require verified identity from client
    NO_VERIFIED_IDENTITY_QUESTION: 'no_verified_identity', // if user identity cannot be verified, replace question string with this.
    ELICIT_RESPONSE_MAX_RETRIES: 3, // Number of times an elicitResponse LexBot can be called before giving up when the Bot returns Failed
    ELICIT_RESPONSE_RETRY_MESSAGE: 'Please try again.', // Default retry message when working with LexBot
    ELICIT_RESPONSE_BOT_FAILURE_MESSAGE: 'Your response was not understood. Please start again.', // Message used when maximum number of retries is exceeded
    ELICIT_RESPONSE_DEFAULT_MSG: 'Ok. ', // Ok. with an intentional blank space after the period
    CONNECT_IGNORE_WORDS: '', // Throw an error if the transcript provided by connect only contains the words in this list (case insensitive)
    CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT: 'false', // Return bot response in session attribute to enable contact flow to use response as an interruptible prompt.
    CONNECT_NEXT_PROMPT_VARNAME: 'connect_nextPrompt', // Name of session var to use for next prompt
    ENABLE_REDACTING: 'false', // Enable the system to redact log output
    REDACTING_REGEX: '\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b', // default regex to use for redacting - redacts 4 digit numbers not followed by a '-', 9 digit numbers (SSN with no '-'s), and Standard SSN format
    ENABLE_REDACTING_WITH_COMPREHEND: 'false', // Enables redaction of PII using Comprehend
    COMPREHEND_REDACTING_CONFIDENCE_SCORE: 0.99, // Only redact PII if the score is above the configured percentage
    COMPREHEND_REDACTING_ENTITY_TYPES:
        'ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER', // See https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/ for valid types
    PII_REJECTION_ENABLED: false, // Enables PII Rejection
    PII_REJECTION_QUESTION: 'pii_rejection_question', // If PII is found, the user's request (question) will change to this phrase
    PII_REJECTION_REGEX: '\\b\\d{4}\\b(?![-])|\\b\\d{9}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b', // Regex to use to find PII.,
    PII_REJECTION_ENTITY_TYPES: 'ADDRESS,EMAIL,SSN,PHONE,PASSWORD,BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER', // See https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/ for valid types
    PII_REJECTION_CONFIDENCE_SCORE: 0.99, // Score confidence for Comprehend to reject
    DISABLE_CLOUDWATCH_LOGGING: 'false', // disable all logging in fulfillment es query handler lambda. does not disable logging from Lambda Hooks or Conditional Chaining Lambda functions
    MINIMAL_ES_LOGGING: 'false', // do not log utterances or session attributes to opensearch for OpenSearchDashboards logging
    S3_PUT_REQUEST_ENCRYPTION: '', // enable header x-amz-server-side-encryption header and set with this value
    BOT_ROUTER_WELCOME_BACK_MSG: 'Welcome back to QnABot.', // The text used by QnABot when ending communication from a specialty bot
    BOT_ROUTER_EXIT_MSGS: 'exit,quit,goodbye,leave', // The exit phrases in comma separated list available for the a user to end communication with a specialty bot
    RUN_LAMBDAHOOK_FROM_QUERY_STEP: 'true', // Enables the use of lambda hooks in the content designer question bank
    LAMBDA_PREPROCESS_HOOK: '', // Lambda to invoke before matching a users query
    LAMBDA_POSTPROCESS_HOOK: '', // Lambda to invoke after matching a users query
    SEARCH_REPLACE_QUESTION_SUBSTRINGS: '', // Replaces substring in users utterance with replacement text before sending for matching
    PROTECTED_UTTERANCES: 'help,help me,thumbs up,thumbs down,repeat,no_hits,no_verified_identity,reset language,detect language,english,french,spanish,german,italian,chinese,arabic,greek,repeat,can you repeat that,can you please say that again,please repeat that', // User utterances that will not be translated or disambiguated
    EMBEDDINGS_ENABLE: '${EMBEDDINGS_ENABLE}', // Set to TRUE or FALSE to enable or disable use of embeddings for semantic search
    EMBEDDINGS_SCORE_THRESHOLD: '${EMBEDDINGS_SCORE_THRESHOLD}', // If embedding similarity score is under threshold the match is rejected and QnABot reverts to scoring answer field (if ES_SCORE_ANSWER_FIELD is true).
    EMBEDDINGS_SCORE_ANSWER_THRESHOLD: 0.8, // Applies only when if ES_SCORE_ANSWER_FIELD is true. If embedding similarity score on answer field is under threshold the match is rejected.
    EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD: '${EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD}', // Applies only when if ES_SCORE_TEXT_ITEM_PASSAGES is true. If embedding similarity score on text item field is under threshold the match is rejected.
    EMBEDDINGS_MAX_TOKEN_LIMIT: '${EMBEDDINGS_MAX_TOKEN_LIMIT}', // Max number of tokens the embeddings model can handle
    LLM_GENERATE_QUERY_ENABLE: '${LLM_GENERATE_QUERY_ENABLE}', // Enables query disambiguation
    LLM_GENERATE_QUERY_PROMPT_TEMPLATE: '${LLM_GENERATE_QUERY_PROMPT_TEMPLATE}', // Template to send to the LLM to generate a query from
    LLM_GENERATE_QUERY_MODEL_PARAMS: '${LLM_GENERATE_QUERY_MODEL_PARAMS}', // LLM model parameters
    LLM_QA_ENABLE: '${LLM_QA_ENABLE}', // Enables text summarization
    LLM_QA_USE_KENDRA_RETRIEVAL_API: '${LLM_QA_ENABLE}', // Enables RAG with Kendra retrieval
    LLM_QA_PROMPT_TEMPLATE: '${LLM_QA_PROMPT_TEMPLATE}', // Template to send to send to the LLM to summarize a response from
    LLM_QA_MODEL_PARAMS: '${LLM_QA_MODEL_PARAMS}', // LLM model parameters
    LLM_QA_PREFIX_MESSAGE: 'LLM Answer:', // Message to append in the chat client when the LLM generates a response
    LLM_QA_SHOW_CONTEXT_TEXT: 'true', // Enables the full text passage to append to the chat client message that the LLM response was generated from.
    LLM_QA_SHOW_SOURCE_LINKS: 'true', // Provides links to the sources the LLM generated text from
    LLM_CHAT_HISTORY_MAX_MESSAGES: 12, // The maximum number of historical chat messages to send to the LLM for additional context. Used by both query generation and RAG.
    LLM_QA_NO_HITS_REGEX: '${LLM_QA_NO_HITS_REGEX}', // Regex match of LLM response that will redirect to no hits
    LLM_PROMPT_MAX_TOKEN_LIMIT: '${LLM_PROMPT_MAX_TOKEN_LIMIT}', // Max number of tokens the LLM can handle. QnABot will truncate the message to fit within this limit.
    KNOWLEDGE_BASE_PREFIX_MESSAGE: 'From Knowledge Base:', // Message to append in the chat client when the knowledge base generates a response
    KNOWLEDGE_BASE_SHOW_REFERENCES: 'true', // Enables the knowledge base to provide full-text references to the sources the knowledge base generated text from
    KNOWLEDGE_BASE_S3_SIGNED_URLS: 'true', // Enables the knowledge base to provide signed URLs for the knowledge base documents.
    KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS: 300, // The number of seconds the signed URL will be valid for.
    KNOWLEDGE_BASE_PROMPT_TEMPLATE: '${KNOWLEDGE_BASE_PROMPT_TEMPLATE}', // The template used to construct a prompt that is sent to the model for response generation.
    KNOWLEDGE_BASE_MAX_NUMBER_OF_RETRIEVED_RESULTS: '', // Sets maximum number of retrieved result where each result corresponds to a source chunk. When querying a knowledge base, Amazon Bedrock returns up to five results by default.
    KNOWLEDGE_BASE_SEARCH_TYPE: 'DEFAULT', // Select the search type which defines how data sources in the knowledge base are queried. If using an Amazon OpenSearch Serverless vector store that contains a filterable text field, you can specify whether to query the knowledge base with a HYBRID search using both vector embeddings and raw text, or SEMANTIC search using only vector embeddings. For other vector store configurations, only SEMANTIC search is available.
    KNOWLEDGE_BASE_METADATA_FILTERS: '{}', // Specifies the filters to use on the metadata in the knowledge base data sources before returning results.
    KNOWLEDGE_BASE_MODEL_PARAMS: '{}', // Customize the knowledge base model by providing inference parameters
    BEDROCK_GUARDRAIL_IDENTIFIER: '', // A unique identifier for the guardrail that provides additional safeguards on top of the native protections of foundational models specified through cloudformation parameters LLMBedrockModelId and BedrockKnowledgeBaseModel
    BEDROCK_GUARDRAIL_VERSION: '', // A version of the guardrail which takes effect only when specifying BEDROCK_GUARDRAIL_IDENTIFIER

};

const privateSettings = {
    NATIVE_LANGUAGE: '${Language}', // Native Language is the Language chosen during a deployment which will be the core language used for the OpenSearch analyzers. NOTE: This language should only be changed from the Stack
    EMBEDDINGS_MODEL_ID: '${EMBEDDINGS_MODEL_ID}', // Required when EmbeddingsApi is set to BEDROCK.
    LLM_API: '${LLMApi}',
    LLM_MODEL_ID: '${LLM_MODEL_ID}', // Required when LLMApi is set to BEDROCK.
    KNOWLEDGE_BASE_ID: '${KNOWLEDGE_BASE_ID}',
    KNOWLEDGE_BASE_MODEL_ID: '${KNOWLEDGE_BASE_MODEL_ID}',
    ALT_SEARCH_KENDRA_INDEXES: '${AltSearchKendraIndexes}', // Add Kendra index to array to enable Amazon Kendra as a fallback source of answers
    ALT_SEARCH_KENDRA_INDEX_AUTH: '${AltSearchKendraIndexAuth}',
    KENDRA_FAQ_INDEX: '${KendraFaqIndexId}', // Kendra Index specific for FAQ for if Kendra FAQ sync is enabled
    KENDRA_WEB_PAGE_INDEX: '${KendraWebPageIndexId}', // The index touse for the web crawler, a custom data source will automatically be added to the specified index.
};

const defaultGenerateQueryPromptTemplate = 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.<br>Chat History: <br>{history}<br>Follow Up Input: {input}<br>Standalone question:';
const defaultQAPromptTemplate = 'Use the following pieces of context to answer the question at the end. If you don\'t know the answer, just say that you don\'t know, don\'t try to make up an answer. Write the answer in up to 5 complete sentences.<br><br>{context}<br><br>Question: {query}<br>Helpful Answer:';
const defaultModelParams = '{\\"temperature\\":0.01, \\"return_full_text\\":false, \\"max_new_tokens\\": 150}';
const defaultLlmNoHitsRegex = 'Sorry,  //remove comment to enable custom no match (no_hits) when LLM does not know the answer.';
const defaultKnowledgeBaseTemplate = 'Human: You are a question answering agent. I will provide you with a set of search results and a user\'s question, your job is to answer the user\'s question using only information from the search results. If the search results do not contain information that can answer the question, then respond saying \\"Sorry, I don\'t know\\". Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user\'s assertion. Here are the search results in numbered order: $search_results$. Here is the user\'s question: <question> $query$ </question> $output_format_instructions$. Do NOT directly quote the $search_results$ in your answer. Your job is to answer the <question> as concisely as possible. Assistant:';

module.exports = {
    DefaultUserPoolJwksUrl: {
        Type: 'AWS::SSM::Parameter',
        Properties: {
            Description: 'Default QnABot Setting - DO NOT MODIFY',
            Type: 'String',
            Value: {
                'Fn::Join': [
                    '',
                    [
                        'https://cognito-idp.',
                        { Ref: 'AWS::Region' },
                        '.amazonaws.com/',
                        { Ref: 'UserPool' },
                        '/.well-known/jwks.json',
                    ],
                ],
            },
        },
    }, 
    DefaultQnABotSettings: {
        Type: 'AWS::SSM::Parameter',
        Properties: {
            Description: 'Default QnABot Settings - DO NOT MODIFY',
            Type: 'String',
            Tier: 'Advanced',
            Value: {
                'Fn::Sub': [
                    JSON.stringify(defaultSettings),
                    {
                        ES_USE_KEYWORD_FILTERS: { 'Fn::If': ['EmbeddingsEnable', 'false', 'true'] },
                        EMBEDDINGS_ENABLE: { 'Fn::If': ['EmbeddingsEnable', 'true', 'false'] },
                        EMBEDDINGS_MAX_TOKEN_LIMIT: { 'Fn::If': ['EmbeddingsBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'EmbeddingsBedrockModelId'}, 'MaxTokens'] }, ''] },
                        EMBEDDINGS_SCORE_THRESHOLD: { 'Fn::If': ['EmbeddingsBedrock', 0.7, 0.85] },
                        EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD: { 'Fn::If': ['EmbeddingsBedrock', 0.65, 0.8] },
                        LLM_GENERATE_QUERY_ENABLE: { 'Fn::If': ['LLMEnable', 'true', 'false'] },
                        LLM_QA_ENABLE: { 'Fn::If': ['LLMEnable', 'true', 'false'] },
                        LLM_GENERATE_QUERY_PROMPT_TEMPLATE: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'QueryPromptTemplate'] }, defaultGenerateQueryPromptTemplate] },
                        LLM_QA_PROMPT_TEMPLATE: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'QAPromptTemplate'] }, defaultQAPromptTemplate] },
                        LLM_GENERATE_QUERY_MODEL_PARAMS: '{}',
                        LLM_QA_MODEL_PARAMS: '{}',
                        LLM_PROMPT_MAX_TOKEN_LIMIT: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'MaxTokens'] }, ''] },
                        LLM_QA_NO_HITS_REGEX: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'NoHitsRegex'] }, defaultLlmNoHitsRegex] },
                        KNOWLEDGE_BASE_PROMPT_TEMPLATE: { 'Fn::If': ['BedrockKnowledgeBaseEnable', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'BedrockKnowledgeBaseModel'}, 'KnowledgeBasePromptTemplate'] }, defaultKnowledgeBaseTemplate] },
                    },
                ],
            },
        },
    },
    PrivateQnABotSettings: {
        Type: 'AWS::SSM::Parameter',
        Properties: {
            Description: 'Private QnABot Settings - DO NOT MODIFY',
            Type: 'String',
            Tier: 'Advanced',
            Value: {
                'Fn::Sub': [
                    JSON.stringify(privateSettings),
                    {
                        EMBEDDINGS_MODEL_ID: { 'Fn::If': ['EmbeddingsBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'EmbeddingsBedrockModelId'}, 'ModelID'] }, ''] },
                        LLM_MODEL_ID: { 'Fn::If': ['LLMBedrock', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'LLMBedrockModelId'}, 'ModelID'] }, ''] },
                        KNOWLEDGE_BASE_MODEL_ID: { 'Fn::If': ['BedrockKnowledgeBaseEnable', { 'Fn::FindInMap': ['BedrockDefaults', {'Ref' : 'BedrockKnowledgeBaseModel'}, 'ModelID'] }, ''] },
                        KNOWLEDGE_BASE_ID: { 'Fn::If': ['BedrockKnowledgeBaseEnable', {'Ref' : 'BedrockKnowledgeBaseId'}, ''] },
                    },
                ],
            },
        },
    },
    CustomQnABotSettings: {
        Type: 'AWS::SSM::Parameter',
        Properties: {
            Description: 'Custom QnABot Settings - Modify to override defaults, or to add new settings',
            Type: 'String',
            Tier: 'Advanced',
            Value: '{}',
        },
    },
    SolutionHelperParameter: {
        Type: 'AWS::SSM::Parameter',
        Properties: {
            Description: 'Solution Helper Parameter - DO NOT MODIFY',
            Type: 'String',
            Value: '{}',
        },
    },
};
