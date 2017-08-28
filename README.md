# A Question and Answer Bot Using Amazon Lex and Alexa

> Build A Bot to answer questions. 

This repos contains code to launch an AWS Lex Bot to capture natural language questions typed or spoken, using the Lex Web-UI client, and return the most relevant answer obtained by searching all QnA documents using the AWS Elasticsearch service.  

This repo contains the source code and development enviroment. You can use this to extend or customize the QnABot for your own purposes.

### Prerequisites

- runing linux 
- installed node and npm 6> 
- clone this repo
- set up an aws account. [instructions](https://aws.amazon.com/free/?sc_channel=PS&sc_campaign=acquisition_US&sc_publisher=google&sc_medium=cloud_computing_b&sc_content=aws_account_bmm_control_q32016&sc_detail=%2Baws%20%2Baccount&sc_category=cloud_computing&sc_segment=102882724242&sc_matchtype=b&sc_country=US&s_kwcid=AL!4422!3!102882724242!b!!g!!%2Baws%20%2Baccount&ef_id=WS3s1AAAAJur-Oj2:20170825145941:s)
- configure aws cli and local credentials. [instructions](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- Lex is currently only supported in us-east-1

## Getting Started
all script descriptions are found in /docs/scripts.md
```shell
npm install 
```
```shell
npm run stack dev/bootstrap up
```
Will launch a cloudformation template to create an S3 bucket to be used for lambda code and cloudformation templates.
```shell
npm run upload
```
Will build all assets and upload to the S3 bootstrap bucket
```shell
npm run stack test/master up
```
Will launch the Master templating creating all resources

### Dev environment 

```shell
npm run dev-up
```
Launches a cloudformation template that creates an number of AWS resources used for testing and development. Templates in the templates/test folder and lambda function tests use exported variables from this template.
```shell
npm run server 
```
Runs a local development server of the Designer UI.

## Components
### Cloudformation Templates
The templates are found in the /templates directory. Master-base.json is the entry point and the other templates and nested under Master-base.json. 

#### Running the tests
To test the templates first launch the dev templates.
```shell
npm run dev-up
```
and run a test template with
```shell
npm run stack test/{template-name-without-.json}
```
You can check a tempate's syntax with 
```shell
npm run check {template's directory relative to /templates}/{template name with .json or .yaml}
```
eg.
```shell
npm run check test/es.json
```

### Lambda Functions
Lambda functions are found in the /lambda directory.
#### Running the tests
each lambda directory has its own test that depend on the dev enroment being set up. 

### Web interface
the Designer Ui and client Ui code is in the /website/admin directory. 
#### Running the tests
test for the website are in the /website/admin/test. A dev server can be setup by calling 
```shell
npm run server
```

## Deployment
### API Endpoints
/website/mock contains a server that mocks the ApiGateway behavior for the dev server.

### Preparing QnA documents

QnA documents must be formatted as JSON objects, with one file containing a JSON list of QnA documents. Here's an example of a simple QnA document:

'''json 
{
   "qna": [
      {
         "qid": "QnABot.002",
         "q": [
            "How do I use Q and A bot"
         ],
         "a": "Create and administer your questions and answers using the Q and A Bot Content Designer UI. End users ask questions using the Lex web UI which supports voice or chat, or using Alexa devices for hands free voice interaction. ",
         "r": {
            "title": "",
            "imageUrl": ""
         }
      }
  ]
}
'''
Each QnA object has current 3 fields:
- qid: a unique identifier
- q: a list of questions (one or more)
- a: the text to be returned as the answer when this document is the most relevant
  
You can associate multiple questions with the same answer, allowing this answer to be retrieved if the user asks the question using different terms and key words. NOTE: the questions don;t have to match exactly how the user will ask the question, but the closer the match the more likely that the right answer will be returned when elastic search tries to find the best match to the user's question..

Keep the answer text short and succinct. Long answers might be fine for a FAQ website, but are not suitable for a chat bot.

## Built With

* [Vue](https://vuejs.org/) 
* [Webpack](https://webpack.github.io/)

## License
See the [LICENSE.md](LICENSE.md) file for details
