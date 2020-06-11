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
