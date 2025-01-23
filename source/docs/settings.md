# QnABot Settings

| Setting | Valid values | Description |
|---------|--------------|--------------|
| ENABLE_DEBUG_RESPONSES | true or false | Determines whether to log original English responses and translated responses for debugging
| ES_USE_KEYWORD_FILTERS | true or false | Determines whether to detect keywords from Comprehend when searching for answers
| ES_EXPAND_CONTRACTIONS | JSON format   | Expand contractions to resolve problems with keyword filters
| ES_KEYWORD_SYNTAX_TYPES | comma separate list <br/> See [Analyze Syntax](https://docs.aws.amazon.com/comprehend/latest/dg/how-syntax.html) | A list of tokens representing parts of speech identified by Amazon Comprehend for matching questions
| ES_SYNTAX_CONFIDENCE_LIMIT | decimal between 0 and 0.99 | Amazon Comprehend makes a best effort to determine the parts of speech  in a sentence. The keywords will only be used if the confidence limit is greater than this amount
| ES_MINIMUM_SHOULD_MATCH |"2<75%" <br/> See [query-dsl-minimum-should-match](https://opensearch.org/docs/latest/query-dsl/minimum-should-match/) for syntax |  Determines how close a question should match to return a hit
| ES_NO_HITS_QUESTION | text | The question QnABot should use when it cannot find an answer
| ES_ERROR_QUESTION | text | The question QnABot should use when a backend error ocurred
| ES_USE_FUZZY_MATCH  | true or false | Determines whether QnABot should return answers similar to the question asked. See [Fuzzy Query](https://opensearch.org/docs/latest/query-dsl/term/fuzzy/) for more information
| ES_PHRASE_BOOST | integer | If the user's question is a phrase match to a question in the knowledge then boost the score by this factor
| ES_SCORE_ANSWER_FIELD | true or false | Search the content of the answer field as a 2nd pass query (if there's no good match from 1st pass query on question fields)
| ENABLE_SENTIMENT_SUPPORT | true or false | Enables [Amazon Comprehend](https://docs.aws.amazon.com/comprehend/latest/dg/how-sentiment.html) be used for sentiment analysis
| ENABLE_MULTI_LANGUAGE_SUPPORT | true or false | Enable or Disable Amazon Translate support. See list of [Supported Languages](multilanguage_support/README.md#supported-languages)
| ENABLE_CUSTOM_TERMINOLOGY| true or false |  Enable support for installed [Custom Terminology](https://aws.amazon.com/blogs/machine-learning/introducing-amazon-translate-custom-terminology/) files when using Amazon Translate
| MINIMUM_CONFIDENCE_SCORE | decimal between 0.0 and 0,99 | The minimum confidence before Amazon Comprehend will determine the user's language
| ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE | VERY_HIGH \| HIGH \| MEDIUM \| LOW |  Answers will only be returned that or at or above the specified [confidence level](https://aws.amazon.com/about-aws/whats-new/2020/09/amazon-kendra-launches-confidence-scores/) when using Kendra Fallback. This setting does not affect the filtering of results for Kendra retrieval used when an LLM is enabled
| ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE: | VERY_HIGH \| HIGH \| MEDIUM \| LOW |  Minimum Kendra [confidence level](https://aws.amazon.com/about-aws/whats-new/2020/09/amazon-kendra-launches-confidence-scores/) threshold for Kendra FAQ
| ALT_SEARCH_KENDRA_S3_SIGNED_URLS | true or false | Enables [signed S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) Urls for Amazon Kendra results.  If enabled, allows support for Kendra documents which are not publicly accessible. Please ensure IAM FulfillmentLambdaRole has access to S3 objects in Kendra index (default role grants access to buckets starting with name QNA or qna)
| ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS | integer | Determines length of time in seconds for the validity of signed S3 Urls in Kendra fallback
| ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT | integer | Number of documents returned by Amazon Kendra fallback
| ALT_SEARCH_KENDRA_FAQ_MESSAGE | string | Heading when a [Frequently Asked Question](https://docs.aws.amazon.com/kendra/latest/dg/response-types.html) is found by Amazon Kendra
| ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE | string | Heading when the [top answer](https://docs.aws.amazon.com/kendra/latest/dg/response-types.html) is found by Amazon Kendra
| ALT_SEARCH_KENDRA_ANSWER_MESSAGE | string | Heading when a [Document](https://docs.aws.amazon.com/kendra/latest/dg/response-types.html) is returned by Amazon Kendra
| ALT_SEARCH_KENDRA_RESPONSE_TYPES | Comma separated list. One or more valid [Amazon Kendra response type](https://docs.aws.amazon.com/kendra/latest/dg/response-types.html) | Kendra fallback will only return responses of the listed types
| ALT_SEARCH_KENDRA_ABBREVIATE_MESSAGE_FOR_SSML | boolean | If a set to "true", an abbreviate Amazon Kendra response will be sent via voice.  If set to "false", the full text of the Kendra fallback response will be sent when using voice
| KENDRA_FAQ_CONFIG_MAX_RETRIES | integer | Number of times to retry syncing FAQ's when a throttling error occurs
| KENDRA_FAQ_CONFIG_RETRY_DELAY | integer | Amount of time to wait in seconds between attempts to retry syncing
| KENDRA_FAQ_ES_FALLBACK | true or false | When Kendra FAQ is enabled, but does not return an answer then query OpenSearch
| ENABLE_KENDRA_WEB_INDEXER | true or false | Enables the web indexer
| KENDRA_INDEXER_URLS | comma separated list | List of web addresses QnABot should crawl and [index with Kendra](./kendra_crawler_guide/README.md)
| KENDRA_INDEXER_SCHEDULE | [CloudWatch Rate Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html) | Interval Indexer should crawl
| KENDRA_INDEXER_CRAWL_DEPTH | number | Sets the depth to the number of levels in a website from the seed level that you want to crawl
| KENDRA_INDEXER_CRAWL_MODE | HOST_ONLY \| SUBDOMAINS \| EVERYTHING | Determines which addresses should be crawled
| KENDRA_INDEXED_DOCUMENTS_LANGUAGES | comma separate list | Should be one of supported Kendra languages mentioned in [documentation](https://docs.aws.amazon.com/kendra/latest/dg/in-adding-languages.html)
| ERRORMESSAGE | text | Response to the user when a processing error occurs
| EMPTYMESSAGE | text | Response to the user when an answer could not be found
| DEFAULT_ALEXA_LAUNCH_MESSAGE | text | Initial greeting when using Alexa
| DEFAULT_ALEXA_REPROMPT | text | Default text used for Alexa reprompt capability
| DEFAULT_ALEXA_STOP_MESSAGE | text |  User response to end session with Alexa
| SMS_HINT_REMINDER_ENABLE | true or false | Enables SMS_HINT_REMINDER
| SMS_HINT_REMINDER |  text | Reminds user how to use the bot on first use after SMS_HINT_REMINDER_INTERVAL_HRS
| SMS_HINT_REMINDER_INTERVAL_HRS | integer | The amount of time in hours when to send SMS_HINT_REMINDER
| IDENTITY_PROVIDER_JWKS_URLS | array of urls |  User can override this empty list to add trusted IdPs (eg from Lex-Web-UI CognitoUserPoolPubKey)
| ENFORCE_VERIFIED_IDENTITY | true or false |  Set to true to make QnABot require verified identity from client
| NO_VERIFIED_IDENTITY_QUESTION | text | If user identity cannot be verified, replace question string with this
| ELICIT_RESPONSE_MAX_RETRIES | integer | Number of times an elicitResponse LexBot can fail before QnaBot gives up and does not ask the user to start the elicitResponse LexBot workflow again
| ELICIT_RESPONSE_RETRY_MESSAGE | text |  Retry message displayed by QnABot when the elicitResponse LexBot workflow fails and the user has to start again
| ELICIT_RESPONSE_BOT_FAILURE_MESSAGE | text |  Failure message displayed by QnaBot when the maximum number of retries of the elicitResponse LexBot workflow is exceeded
| ELICIT_RESPONSE_DEFAULT_MSG| text | Default closing response message used by QnAbot when the elicitResponse LexBot does not return a closing response to QnABot
| CONNECT_IGNORE_WORDS | comma separated list | Throw an error if the transcript provided by connect __only__ contains the words in this list (case insensitive). This is useful if you find many missed utterances due to the use of filler words before a proper utterance (e.g. "a", "e", "umm", "like", etc.). This setting can not be used as a transcript filter (see `LAMBDA_PREPROCESS_HOOK` or `LAMBDA_POSTPROCESS_HOOK` if you wish to apply custom processing to questions/answers)
| CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT | true or false | Return bot response in session attribute to enable contact flow to use response as an interruptible prompt
| CONNECT_NEXT_PROMPT_VARNAME | text | Name of session var to use for next prompt
| ENABLE_REDACTING | true or false | Enable the system to redact log output
| ENABLE_REDACTING_WITH_COMPREHEND | true or false | Enables [Amazon Comprehend based PII Redacting](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/)
| COMPREHEND_REDACTING_ENTITY_TYPES | comma separated list | A list of [PII Entity Types](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/)
| COMPREHEND_REDACTING_CONFIDENCE_SCORE | number (0 to .99) | Only redact PII where Amazon Comprehend's confidence score is greater than this number
| REDACTING_REGEX | regex expression | Redacts expressions matching regex from logs
| PII_REJECTION_ENABLED | true or false | Enables PII Rejection
| PII_REJECTION_QUESTION | text  | If PII is found, the user's request (question) will change to this phrase
| PII_REJECTION_REGEX | regex expression | Used to find PII based on a regex
| PII_REJECTION_ENTITY_TYPES | comma separated list of [PII Entity Categories](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/) | Only recognize PII entity types in the list
| PII_REJECTION_CONFIDENCE_SCORE | number (0 to 0.99) | Only reject PII where Amazon Comprehend's confidence score is greater than this number
| DISABLE_CLOUDWATCH_LOGGING | true or false | Disable all logging in fulfillment es query handler lambda. does not disable logging from Lambda Hooks or Conditional Chaining Lambda functions
| MINIMAL_ES_LOGGING | true or false | do not log utterances or session attributes to OpenSearch for OpenSearchDashboards logging
| S3_PUT_REQUEST_ENCRYPTION | text | enable header x-amz-server-side-encryption header and set with this value
| BOT_ROUTER_WELCOME_BACK_MSG | text | The text used by QnABot when ending communication from a specialty bot
| BOT_ROUTER_EXIT_MSGS | comma separated list | The exit phrases in comma separated list available for the a user to end communication with a specialty bot
| RUN_LAMBDAHOOK_FROM_QUERY_STEP | true or false | Controls timing of execution for Lambda hooks
| LAMBDA_PREPROCESS_HOOK | string | name of AWS Lambda to run before each question is processed. The name of the Lambda must start with "qna-" or "QNA-" to comply with the permissions of the role attached to the Fulfillment Lambda
| LAMBDA_POSTPROCESS_HOOK | string | name of AWS Lambda to run after the question is processed. But before user profile information is saved. The name of the Lambda must start with "qna-" or "QNA-" to comply with the permissions of the role attached to the Fulfillment Lambda 
| SEARCH_REPLACE_QUESTION_SUBSTRINGS | string | replace words or phrases in user questions by defining search/replace pairs in a JSON object like: {"searchString":"replaceString"}. Add additional pairs separated by commas, like: {"searchString":"replaceString", "searchString2":"replaceString2"}
| PROTECTED_UTTERANCES | text | A comma-separated list of utterances that will not be translated or disambiguated by QnABot. Each phrase is not case sensitive and ignores common punctuation characters: .,!;-?
| EMBEDDINGS_ENABLE | true or false | Disable use of semantic search using embeddings. Set to TRUE only if QnABot stack was deployed with embeddings enabled
| EMBEDDINGS_SCORE_THRESHOLD | 0-1 | Unlike regular OpenSearch queries, embeddings queries always return scores between 0 and 1, so we can apply a threshold to separate good from bad results. If embedding similarity score is under the threshold then the match is rejected and QnABot reverts to try to find a match on the answer field (only if ES_SCORE_ANSWER_FIELD is set to true), Text item passage query, Kendra fallback or no_hits. Use the Content Designer TEST tab to see the hits ranked by score for your query results
| EMBEDDINGS_SCORE_ANSWER_THRESHOLD | 0-1 | Used only when ES_SCORE_ANSWER_FIELD is true. If embedding similarity score for the answer field query is under the threshold the match is rejected and QnABot reverts to the Text item passage query, Kendra fallback or no_hits. Use the Content Designer TEST tab to see the hits ranked by score for your answer field query results. For **Match on**, choose *qna item answer* to see answer field scores
| EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD | 0-1 | If embedding similarity score for text item passage field query is under threshold the match it's rejected and QnABot reverts to Kendra fallback or no_hits. Use the Content Designer TEST tab to see the hits ranked by score for your answer field query results. For **Match on**, choose *text item passage* to see passage field scores. |
| LLM_API                                  | BEDROCK or LAMBDA   | Specifies the LLM (Language Model) API used by the QnABot Stack based on the chosen value during deployment or update.                                                                                                              |
| LLM_GENERATE_QUERY_ENABLE                | true or false   | Enables or disables question disambiguation using the LLM model.                                                                                                       |
| LLM_GENERATE_QUERY_PROMPT_TEMPLATE       | Prompt template with placeholders: {history}, {input}       | The template used to construct a prompt for LLM to disambiguate follow-up questions. It can use placeholders to provide conversational context and the current user utterance/question.                                               |
| LLM_GENERATE_QUERY_MODEL_PARAMS          | JSON string, e.g. `{"temperature":0}`    | Parameters sent to the LLM model when disambiguating follow-up questions.                                                                                             |
| LLM_QA_ENABLE                           | true or false     | Enables or disables generative answers from passages retrieved via embeddings or Kendra fallback when no FAQ match is found. Applied only to passages and Kendra results - does not apply when an FAQ/QID matches the question.                                                |
| LLM_QA_USE_KENDRA_RETRIEVAL_API          | true or false                                               | Enables or disables use of Kenda's new retrieval API. When enabled, QnABot uses Kendra Retrieve api to retrieve semantically relevant passages of up to 200 token words from the documents (not FAQs) in your index. When disabled, QnAbot use Kendra Query to retrieve shorter passages or answers. Takes effect only when LLM_QA_ENABLE is true. The default is true (recommended) when LLM QA is enabled. See https://docs.aws.amazon.com/kendra/latest/APIReference/API_Retrieve.html |
| LLM_QA_PROMPT_TEMPLATE                   | Prompt template with placeholders: {context}, {history}, {input}, {query} | The template used to construct a prompt for LLM to generate an answer from the context of retrieved passages (from Kendra or Text Item passages).                                                                                  |
| LLM_QA_NO_HITS_REGEX                     | Regular expression pattern                                  | If the LLM response matches the specified pattern (e.g., "Sorry, I don't know"), the response is treated as no_hits, and the default EMPTYMESSAGE or a custom 'no_hits' item is returned instead. Disabled by default, since enabling it prevents easy debugging of LLM don't know responses.                                |
| LLM_QA_MODEL_PARAMS                     | JSON string, e.g. `{"temperature":0}`   | Parameters sent to the LLM model when generating answers to questions.                                                                                                |
| LLM_QA_PREFIX_MESSAGE                   | Message used to prefix LLM-generated answer                 | May be empty.|
| LLM_QA_SHOW_CONTEXT_TEXT                 | true or false                                               | Enables or disables inclusion of the passages used as context for LLM-generated answers.      |
| LLM_QA_SHOW_SOURCE_LINKS                 | true or false                                               | Enables or disables Kendra Source Links or passage refMarkdown links (document references) in markdown answers.  |
| LLM_CHAT_HISTORY_MAX_MESSAGES            | Positive integer  | Specifies the maximum number of previous messages maintained in the QnABot DynamoDB UserTable for conversational context and follow-up question disambiguation.         |
| LLM_PROMPT_MAX_TOKEN_LIMIT               | Positive integer  | Specifies the maximum number of tokens in the prompt message that can be sent to the LLM. QnABot will selectively truncate the prompt by history and context to shorten the total length. |
| KNOWLEDGE_BASE_PREFIX_MESSAGE            | string  | Message used to prefix a Knowledge Base generated answer  |
| KNOWLEDGE_BASE_SHOW_REFERENCES           | true or false  | Enables or disables inclusion of the passages used as context for Bedrock Knowledge Base generated answers.  |
| KNOWLEDGE_BASE_S3_SIGNED_URLS            | true or false  | Enables or disables S3 presigned URL signing for Bedrock Knowledge Base answers  |
| KNOWLEDGE_BASE_S3_SIGNED_URL_EXPIRE_SECS | positive integer  | Determines length of time in seconds for the validity of signed S3 Urls for Bedrock Knowledge Base answers |
| USER_HISTORY_TTL_DAYS | positive integer  | The number of days to keep user and chat history in DynamoDB before expiring. If you would like your user/chat history to never expire, leave this value as 0. |
