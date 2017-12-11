# A Question and Answer Bot Using Amazon Lex and Amazon Alexa

> Build a chat bot to answer questions. 

## Overview
This repository contains code for the QnABot, described in the AWS AI blog post [“Creating a Question and Answer Bot with Amazon Lex and Amazon Alexa”](https://aws.amazon.com/blogs/ai/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/).

See the "Getting Started" to launch your own QnABot,

## Prerequisites

- Run Linux. (tested on Amazon Linux)
- Install npm >3 and node >6. ([instructions](https://nodejs.org/en/download/))
- Clone this repo.
- Set up an AWS account. ([instructions](https://AWS.amazon.com/free/?sc_channel=PS&sc_campaign=acquisition_US&sc_publisher=google&sc_medium=cloud_computing_b&sc_content=AWS_account_bmm_control_q32016&sc_detail=%2BAWS%20%2Baccount&sc_category=cloud_computing&sc_segment=102882724242&sc_matchtype=b&sc_country=US&s_kwcid=AL!4422!3!102882724242!b!!g!!%2BAWS%20%2Baccount&ef_id=WS3s1AAAAJur-Oj2:20170825145941:s))
- Configure AWS CLI and local credentials. ([instructions](http://docs.AWS.amazon.com/cli/latest/userguide/cli-chap-welcome.html))  

Note: Lex is currently only supported in the us-east-1 and eu-west-1 regions.

## Getting Started
First, install all prerequisites:
```shell
npm install 
```

Next, copy the /config.json.example file to /config.json:
```shell
cp config.js.example config.js
```
Configure the config with your information. 

Next, use the following command to launch a CloudFormation template to create the S3 bucket to be used for lambda code and CloudFormation templates. Wait for this template to complete (you can watch progress from the [AWS CloudFormation console](https://console.AWS.amazon.com/cloudformation/home))  
```shell
npm run stack dev/bootstrap up
```

After the template has launched, use the following command to build all assets and upload to the S3 bucket created in the previous step:
```shell
npm run upload
```

Finally, use the following command to launch template to deploy the QnA bot in your AWS account. When the stack has completed you will be able to log into the Designer UI (The URL is an output of the template) with the password set in "templates/test/master.json":
```shell
npm run stack test/master up
```

All script descriptions are found in /docs/scripts.md  

## Components
### CloudFormation Templates
The CloudFormation test templates are in the templates/test folder. The current templates are:

1. Master and Public: these are the top level templates
2. domain: creates and initializes the ElasticSearch cluster
3. lex: create the Lex bot
4. api: creates the ApiGateway and Cognito UserPool needed for the Designer/Client Ui
5. dashboard: Creates an AWS CloudWatch dashboard to monitor the resources in the templates. 
6. various templates in /templates/dev: needed for local testing of the lambda functions. 

Run a template test with:
```shell
npm run stack test/{template-name}
```

For example, if you want to test the domain template run:
```shell
npm run check test/domain
```

You also can check a template's syntax with:
```shell
npm run check {template-name}
```
ex. 
```shell
npm run check domain
```

### Lambda Functions
Lambda functions are found in the /lambda directory. Refer to the README.md file in each directory for instructions on setting up a dev environment and testing. 
[Handler](lambda/handler/README.md)
[CFN](lambda/handler/README.md)

### Web Interface
The Designer UI and client UI code is in the /website directory. 

To Test the web ui, Launch a development master stack:
```shell
npm run stack dev/master up
```
when that stack has finished run:
```shell
cd ./website ; make dev
```
this will launch a running webpack process that will watch for changes to files and upload the changes to your running dev/master stack. 

#### Designer UI Compatibility 
Currently the only browsers supported are:  
- Chrome  
- FireFox  
We are currently working on adding Microsoft Edge support.  

## Built With

* [Vue](https://vuejs.org/) 
* [Webpack](https://webpack.github.io/)

## License
See the [LICENSE.md](LICENSE.md) file for details
