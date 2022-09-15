# QnABot on AWS

## Overview
QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer’s questions, answers, and feedback. It allows you to deploy a fully functional chatbot across multiple channels including chat, voice, SMS, and Amazon Alexa. The solution’s content management environment, and contact center integration wizard allow you to set up and customize an environment that provides the following benefits:

- Enhance your customer’s experience by providing personalized tutorials and question and answer support with intelligent multi-part interaction

- Reduce call center wait times by automating customer support workflows

- Implement the latest machine learning technology to create engaging, human-like interactions for chatbots


## Architecture Overview

Deploying this solution with the default parameters builds the following environment in the AWS Cloud. 

![Architecture](docs/architecture.png)

Figure 1: QnABot on AWS architecture on AWS

The AWS CloudFormation template deploys the following workflows and services:

1. The admin deploys the solution into their AWS account, opens the Content Designer UI, and uses [Amazon Cognito](http://aws.amazon.com/cognito/) to authenticate.

2. After authentication, [Amazon CloudFront](http://aws.amazon.com/cloudfront/) and [Amazon S3](http://aws.amazon.com/s3/) deliver the contents of the Content Designer UI.

3. The admin configures questions and answers in the Content Designer and the UI sends requests to [Amazon API Gateway](http://aws.amazon.com/api-gateway/) to save the questions and answers.

4. The `Content Designer` [AWS Lambda](http://aws.amazon.com/lambda/) function saves the input in [Amazon OpenSearch Service](http://aws.amazon.com/opensearch-service/) (successor to Amazon ElasticSearch Service) in a questions bank index.

5. Users of the chatbot interact with [Amazon Lex](http://aws.amazon.com/lex/) via the web client UI or Amazon Connect.

6. Amazon Lex forwards requests to the `Bot Fulfillment` AWS Lambda function. (Users can also send requests to this Lambda function via [Amazon Alexa](https://developer.amazon.com/en-US/alexa) devices).

7. The `Bot Fulfillment` AWS Lambda function takes the users input and uses [Amazon Comprehend](http://aws.amazon.com/comprehend/) and [Amazon Translate](http://aws.amazon.com/translate/) (if necessary) to translate non-English requests to English and then looks up the answer in in Amazon OpenSearch Service. If Amazon Kendra index is configured and provided at the time of deployment, the Bot Fulfillment function also sends a request to the [Amazon Kendra](http://aws.amazon.com/kendra/) index.

8. User interactions with the `Bot Fulfillment` function generate logs and metrics data, which is sent to [Amazon Kinesis Data Firehose](http://aws.amazon.com/kinesis/data-firehose/) then to Amazon S3 for later data analysis.



Refer to the [implementation guide](https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws) for detailed instructions on deploying QnABot in your AWS account. 


Alternatively, if you want to custom deploy QnABot on AWS, refer to the details below. 

## Custom deployment of QnABot on AWS

### Environment Prerequisites

-   Run Linux. (tested on Amazon Linux)
-   Install npm >7.10.0 and node >12.15.1. ([instructions](https://nodejs.org/en/download/))
-   Clone this repo.
-   Set up an AWS account. ([instructions](https://AWS.amazon.com/free/))
-   Configure AWS CLI and a local credentials file. ([instructions](https://docs.AWS.amazon.com/cli/latest/userguide/cli-chap-welcome.html))


### Build a version
Navigate to the root directory of QnABot (directory will be created once you have cloned this repo). 

Install node.js moodules of QnABot:

```shell
npm install
```

Next, set up your configuration file:

```shell
npm run config
```

now edit `config.json` for the following parameters: 

| param              | description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| region             | the AWS region to launch stacks in                                          |
| profile            | the AWS credential profile to use                                           |
| namespace          | a logical name space to run your templates in such as dev, test and/or prod |
| devEmail(required) | the email to use when creating admin users in automated stack launches      |

Next, use the following command to launch a CloudFormation template to create the S3 bucket to be used for Lambda code and CloudFormation templates. Wait for this template to complete (you can watch progress from the command line or [AWS CloudFormation console](https://console.AWS.amazon.com/cloudformation/home))

```shell
npm run bootstrap
```

Finally, use the following command to launch template to deploy the QnABot in your AWS account. When the stack has completed you will be able to log into the Designer UI (The URL is an output of the template). A temporary password to the email in your config.json:

```shell
npm run up
```

If you have an existing stack you can run the following to update your stack:

```shell
npm run update
```

## Designer UI Compatibility

Currently the only browsers supported are:

-   Chrome
-   Firefox
    We are currently working on adding Microsoft Edge support.

## Built With

-   [Vue](https://vuejs.org/)
-   [Webpack](https://webpack.github.io/)

## License

Refer to [LICENSE.txt](LICENSE.txt) file for details.

## New features

Refer to [CHANGELOG.md](CHANGELOG.md) file for details of new features in each version.

A [workshop](https://qnabot.workshop.aws) is also available
that walks you through QnABot features.

---

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
