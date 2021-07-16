## [4.7.2]
- Bug fix "TypeError: AWS.LexRuntimeV2 is not a constructor" when using Lex V2 based Elicit Response Bots.
- Bug fix "Cannot read property 'buttons' of undefined" when no buttons specified in response card.
- Bug fix Protect against TypeError exception while processing fallback intent case for an invalid response provided to a LexV2 Response Bot. 
## [4.7.1]
- Amazon Elasticsearch version 7.10 is now utilized.
- Encrypted Elasticsearch (production) instance types now use m6g.large.elasticsearch for improved price/performance/memory.
- The QnABot fulfillment Lambda function has been optimized to reduce query response times and variability,
  especially after periods of inactivity.
- LexV2 built-in Elicit Response bots have been added.
- Custom settings can now be exported and imported from the Content Designer Settings page.
- Bug fix when ES_SCORE_ANSWER_FIELD is set to true. Prior to this fix, answer fields were not
  utilized fully in Elasticsearch queries.
## [4.7.0]
- QnABot now supports LexV2 with voice interaction in multiple languages.
  - Two installation/update modes are now available:
    - (i) LexV1 + LexV2 (default, recommended for most AWS regions.
    - (ii) LexV2-only (currently recommended for AWS regions where LexV1 is not available).
  - LexV2 locales are specified via a new CloudFormation parameter
    - The default locales are US English, US Spanish and Canadian French.
- The QnABot web client now uses LexV2 and supports dynamic bot locale selection from a new title bar menu.
- Custom LexV2 Elicit Response bots are now supported. The built-in response bots still use LexV1 and are
  available only when QnABot is installed in LexV1+LexV2 mode.
- CloudFormation deployment is now available for Canada/Montreal region (LexV2-only mode).
- Amazon Connect integration in the Canada/Montreal region supports multiple voice languages using LexV2.
- The Content Designer 'Test All' feature now uses LexV2.
- Content Designer's "Rebuild Lex Bot" feature now rebuilds both LexV2 and LexV1 bots
- Non-English LexV2 bot locales are automatically generated with sample utterances translated from English questions using Amazon Translate.
- Content Designer's Import feature now supports Excel spreadsheets as well as the existing JSON format.
- QnABot's Elasticsearch cache is now automatically kept warm to improve query time consistency.
- Negative feedback (thumbs down) messages can now generate notifications (text, email, etc.) using Amazon SNS.
## [4.5.2]
- Fix for new Kendra resources deployed in VPC addressing issues in 4.5.0 and 4.5.1.
## [4.5.1]
- Fix for incorrect Thumbs Up / Thumbs Down processing in 4.5.0.
- Fix for multi-language support when manually switching languages in 4.5.0.
- Improve formatting of markdown responses from Kendra ANSWER responses.
## [4.5.0]
- Added single click deployment support for four additional regions
- Changed unencrypted Amazon Elasticsearch instance types to be t3.small.elasticsearch
- Changed default number of nodes for Amazon Elasticsearch cluster to 4 for better production level
  cluster performance and resiliency. This can be changed to 2 for development clusters if desired.
- Added Personal Identifiable Information detection support using Amazon Comprehend - [readme](./docs/PII_Detection/README.md)
- Added web indexing support using Amazon Kendra  - [readme](./docs/kendra_crawler_guide/README.md)
- Added Amazon Translate custom terminology support - [readme](./docs/custom_terminology_guide/README.md)
- Added multi-language translation with QnABot Kendra fallback processing
- Added support for signing S3 URLs for bot responses, using handlebar syntax - [readme](./lambda/proxy-es/lib/HANDLEBARS_README.md)
- Added support to defining user specified custom settings
- Lambdahook responses can now be used with document chaining and are translated when multi-language support is enabled
- Improved support when contractions are used in utterances
- Kendra Fallback message prefixes are now configurable in QnABot settings.
- Fixed bugs and defects
## [4.4.1]
- Fix for Designer UI from breaking change in highlight.js due to dependabot alert / change.
- Added support for setting 'profile' as an identity attribute from cognito federation. 
- Fix syntax error introduced in 4.4.0 QNAPin and QNAPinNoConfirm bots that prevents updates from succeeding.
## [4.4.0]
- Preview VPC support - [readme](./VPCSupportREADME.md)
- Preview BotRouter support - [read](./BotRoutingREADME.md)
- Upgrade to Elasticsearch service version 7.9
- Slack client support via Lex with Slack specific markdown support
- Added support for Alexa re-prompt functionality
- Bug fixes and defect enhancements
## [4.3.2]
- Bug fixes for Kendra FAQ integration 
- Support lengthy answer definition for Kendra FAQ
- Check of FAQ deletion in Kendra when FAQ content is being resynced
- Support multiple responses when using Test in content designer with Kendra FAQ enabled
- Fix for exception - "Cannot convert undefined or null to object" when Session Attributes are no provided during Lex input. https://github.com/aws-samples/aws-ai-qna-bot/issues/229
- Package version updates to address current github dependabot alerts
## [4.3.0]
- New Connect Wizard available in the Content Designer UI to assist integration with a Connect Contact Flow.
- New 4-node Elasticsearch domain support for improved fault tolerance in deployment template.
- Elicit Response bot support for confirmation responses using phone keypad 1 = yes 2 = no.
- Security improvements in API Gateway.
- ID token values removed from session event after validation and redacted from logging.
- Setting to limit the number of Kendra fallback search results.
- Setting to enable signed URLs for S3 documents in Kendra search results. 
## [4.2.4]
- Add CONNECT_IGNORE_WORDS to settings which allows single character words to be ignored during input to QnABot via Connect. Default is empty string but can be set to an array such as "a,e" such that single character inputTranscript uses the Connect Error branch in Get customer input.
- Display Kendra document names as the URL and add ability to generate Signed S3 URLs for Kendra document integration. Uses new setting named ALT_SEARCH_KENDRA_S3_SIGNED_URLS. Set this to true to convert Kendra based S3 document URLs to signed urls allowing access.
- Expose session attributes in the res object as an object such that they are usable in Kibana UI.
- Fix to ensure a "Test" invocation, when using a topic, always uses ElasticSearch to perform the query. 
## [4.2.2]
- Fix KendraFallback Lambda Function lodash dependency
## [4.2.1]
- Return Error if Lex inputTranscript is an empty string or not present. Processing an empty inputTranscript produces other downstream failure.
## [4.2.0]
- New Kendra FAQ support (Beta version) using the setting KENDRA_FAQ_INDEX. New menu item in Designer UI to export Questions as a Kendra FAQ. See revised Blog Post for details.
- New GetSessionAttribute Handlebars helper to obtain session attribute. Works similar to lodash get(). Will not through exception and will return a default value.
- Enhanced handlebars to support string concatenation including handlevar 'variables' like Session Attributes and UserInfo, etc. Use case, e.g. to build a url containing a users email, eg a google calendar URL. Example of syntax now supported - in this case to dynamically build a personalized URL based on user info. {{setSessionAttr 'link' 'https://calendar.google.com/calendar/embed?src=' UserInfo.Email '&ctz=America%2FNew_York'}}
- Moved 'previous' and 'navigation' session attributes under a new 'qnabotcontext' session attribute so that Connect (and other) clients have fewer session attributes to preserve.
- Allows Chaining rule Lambda function to return a modified session object in addition to the string for chaining.
- Allows Chaining of up to 10 documents. Each document's Lambda hooks will also be invoked in sequence if defined.
- Added a new Repeat QID in the QNAUtility example package. Allows QnABot to easily repeat the last answer.  
- Allow the chaining rule to specify a specific QID rather than an answer. A QID can be specified in the chaining rule by using string such as QID::<qid> e.g. QID::Admin.001. Note, the new QID::<qid> syntax can also be used from the webUI, say as button values if/when you prefer to target a specific QID (exact query) rather than rely on question matching.
- Fixed a defect to allow conditional chaining to be invoked after an elicit response bot failure.
- Upgrades to and installs ElasticSearch 7.7.

## [4.1.0]
- Install / Upgrade now supports the option to configure S3 Buckets and Elastic Search cluster using encryption at rest
- Install / Upgrade now supports the option to require Cognito based user authorization to access the built-in full screen web UI (Public/Private parameter in template) - Public is the default
- Added two settings parameters to enforce user identity verification check, so that bot can be secured for use by authenticated users only
    - ENFORCE_VERIFIED_IDENTITY. Default is false. Set to true to make QnABot require verified identity from client
    - NO_VERIFIED_IDENTITY_QUESTION. The default is "no_verified_identity". If user identity cannot be verified, replace question string with this. If not verified, the system will respond to user's question with the result of searching for NO_VERIFIED_IDENTITY_QUESTION. This allows a customizable message which informs the user that they must log in. A default question with qid "no_verified_identity" is included in QNAUtility example package.
- Enhanced Kendra fallback integration to use a specific answer if there is a best answer available and bold face highlighted words from Kendra response
- Added Comprehend sentiment analysis to all utterances and text captured by the QNAFreeText elicit response bot
- Enhanced Kibana dashboard to identify Lex client channels - Connect, Web, SMS
- Improved internal use of Booleans from settings configuration 
- Enhanced Connect integration 
    - Added session attribute named "qnabot_qid" that holds the matching question id found in elastic search
    - Added session attribute "qnabot_gotanswer" that holds boolean true/fale if an answer was fround
    - Encapsulating all Kendra and Elicit Response Bot session attributes into a single "qnabotcontext" attribute making it easier to store and reset in Connect contact flow
- Added new QNAYesNoExit elicit response bot which allows a user to exit the YesNoExit question using "exit", "bye", "quit", "admin", "rep","representative","stop", "help", "bye", "goodbye" which sets the Yes_No_Exit slot value / session attribute to "Exit".
- Update to 0.17.0 of embedded lex-web-ui
- Resolved additional dependabot identified security issues with dependent packages
- Fixed lambda/fulfillment unit tests
- Fixed defect where response bot was not triggered on next question when using lambda function for conditional chaining 
## [4.0.0]
- Update to Elasticsearch 7.4
- Update to 0.16.0 of embedded lex-web-ui
- Fix to redacting feature with respect to kibana metrics
- Fix to CustomNoHits to use configured setting
- npm audit package updates
- Improved question matching accuracy and tuning
- Tolerance for typos and minor spelling errors with fuzzy matching setting
- Easier troubleshooting when using voice or multi-language support with new debug setting
- SSML support when using Amazon Connect
- Fixes and improvements to Amazon Kendra integration, support FAQ answers
- Full upgrade support without data loss when upgrading from previous versions
- Disable response card titles in embedded lex-web-ui
- Added region launch links to README
- Fix to language responses in Language extension. Added mapping of 'Chinese' to use 'Simplified Chinese'
## [3.0.3]
- Enhanced CFN lex create/update to identify and use versions of the Bot externally created
- Added content tuning Readme
## [3.0.0 - 3.0.2]
- Improved scale using Lex versions and aliases
- Elicit Response Bots allowing QnABot to ask its own questions
- Conditional chaining to jump to other items based on user answers
- New Connect Callback example bot and questions
- New launch regions to install QnABot in eu-west-1, ap-southeast-2, us-west-2
- Editable settings
## [2.6.0]
- Fix for the Next/Previous sample functions when the next or previous questions reference a lambda hook
- Update handlebars in extensions / samples to use version ^4.3.0
- Addition of Kendra Fallback feature
## [2.5.0]
- IAM Policy updates
- Update of default utterances for Alexa
- Change to NodeJS 10.X for Lambdas
- Updated reInvent2019 workshop
## [2.4.0]
- added use of SSM Parameter store to hold default configuration settings
- added use of use of Comprehend for better selection of appropriate answer 
- added use of AMAZON.Fallback intent
- updated lex-web-ui to 0.14.8
- support for Test All functionality
- fix for alexa repeat intent
- fix for better handling of tab navigation between questions and test tab
- added QnABot version number to cloudformation stack description
- separated import and export functionality into nested stacks freeing up ability to add resources to master stack
- updates to npm module versions
- added newline to separate records injected to firehose
- improved accuracy by adding use of AWS Comprehend to identify nouns and verbs to confirm in identified question whose answer is being returned
## [2.3.0]
- upgraded to nodejs 8.10
## [2.1.0]
### fixed
- issue in stack name namespacing with different profiles

### added
- support for html, markdown, and SSML alternate answers 
- quiz document type and lambda hook
- feedback example lambda hook
- navigation example lambda hook
- kibana integration in designer ui
- examples are in a nested template
- support for IE11 and Edge for client page

## [2.0.1]
## fixed
- serviceCreateRole issue in  CNFLambda when creating lex bots

## [2.0.0]
### fixed
- QnABot is now a single template

### added
- new ui based on vuetify
- topic memory
- lambda hooks
- more integration tests
- Cognito Hosted Login for Admin Screen
- Improved Importing
- Backups to s3
- Better deployment scripts using namespaces and AWS CLI Profiles.

### removed
- link parsing
- cloudfront distributions

## [1.1]
### fixed
- spelling in documentation
- small bugs

## [1.0]
### Added 
- initial
