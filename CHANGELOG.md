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
