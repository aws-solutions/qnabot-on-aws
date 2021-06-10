# A Question and Answer Bot Using Amazon Lex and Amazon Alexa

> Build a chat bot to answer questions.

## Overview

This repository contains code for the QnABot, described in the AWS AI blog post [“Creating a Question and Answer Bot with Amazon Lex and Amazon Alexa”](https://aws.amazon.com/blogs/ai/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/).

See the "Getting Started" to launch your own QnABot.

4.7.0 QnABot now supports LexV2 with voice interaction in multiple languages.
  - Two installation/update modes are now available:
    - (i) LexV1 + LexV2 (default, recommended for most AWS regions.
    - (ii) LexV2-only (currently recommended for AWS regions where LexV1 is not available).

**See all the new features in 4.7.0** [LexV2 support, Excel Import, New Canada Central region](#new-features)
      
4.6.0 provides a number of new features described below. Several to call attention to are the following:

- Kendra custom no_hits item required in earlier releases is no longer required to enable Kendra Fallback and should be removed, configurable confidence thresholds now available for filtering Kendra results.
- Kendra integration is now fully automated during install or update when the new default Kendra Index Id parameter is provided.
- Standard markdown is now automatically converted to Slack markdown when using Slack, Kibana dashboard logs and metrics retention period is now configurable during install or update, Lambda runtime upgraded to Node.js 12.x.

**New features in 4.6.0** [Improved Kendra integration and Kibana dashboards. Additional settings to filter Kendra responses based on confidence levels](#new-features)

**New features in 4.5.0** [Kendra Web Crawler, Comprehend PII Detection, Translate Custom Terminology, Increased deployment regions](#new-features)

## Upgrade Notes

During an upgrade, we recommend that existing QnABot content first be exported and downloaded from the Content Designer prior to
the upgrade. In this release we expect upgrade to be smooth but just in case you should always have your QnABot content preserved.

## Prerequisites

- Run Linux. (tested on Amazon Linux)
- Install npm >7.10.0 and node >12.15.1. ([instructions](https://nodejs.org/en/download/))
- Clone this repo.
- Set up an AWS account. ([instructions](https://AWS.amazon.com/free/?sc_channel=PS&sc_campaign=acquisition_US&sc_publisher=google&sc_medium=cloud_computing_b&sc_content=AWS_account_bmm_control_q32016&sc_detail=%2BAWS%20%2Baccount&sc_category=cloud_computing&sc_segment=102882724242&sc_matchtype=b&sc_country=US&s_kwcid=AL!4422!3!102882724242!b!!g!!%2BAWS%20%2Baccount&ef_id=WS3s1AAAAJur-Oj2:20170825145941:s))
- Configure AWS CLI and a local credentials file. ([instructions](http://docs.AWS.amazon.com/cli/latest/userguide/cli-chap-welcome.html))  

## Getting Started

Two approaches can be used to get started. Deploy from pre-created repositories or clone the repo and build a version yourself.

### Pre-created deployment

Click a button to launch QnABot CloudFormation stack in the desired region

| Region   |  Launch |
|----------|:-------------:|
| Northern Virginia | <a target="_blank" href="https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog.s3.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a>     |
| Oregon | <a target="_blank" href="https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-us-west-2.s3.us-west-2.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| Ireland | <a target="_blank" href="https://eu-west-1.console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-eu-west-1.s3-eu-west-1.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| Sydney | <a target="_blank" href="https://ap-southeast-2.console.aws.amazon.com/cloudformation/home?region=ap-southeast-2#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-ap-southeast-2.s3-ap-southeast-2.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| London | <a target="_blank" href="https://eu-west-2.console.aws.amazon.com/cloudformation/home?region=eu-west-2#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-eu-west-2.s3-eu-west-2.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a>     |
| Frankfurt | <a target="_blank" href="https://eu-central-1.console.aws.amazon.com/cloudformation/home?region=eu-central-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-eu-central-1.s3.eu-central-1.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| Singapore | <a target="_blank" href="https://ap-southeast-1.console.aws.amazon.com/cloudformation/home?region=ap-southeast-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-ap-southeast-1a.s3-ap-southeast-1.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| Tokyo | <a target="_blank" href="https://ap-northeast-1.console.aws.amazon.com/cloudformation/home?region=ap-northeast-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-ap-northeast-1.s3-ap-northeast-1.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |
| Canada Central | <a target="_blank" href="https://ca-central-1.console.aws.amazon.com/cloudformation/home?region=ca-central-1#/stacks/new?stackName=QnABot&templateURL=https://aws-bigdata-blog-replica-ca-central-1.s3-ca-central-1.amazonaws.com/artifacts/aws-ai-qna-bot/templates/public.json"><span><img height="24px" src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/></span></a> |

### Clone the git repo and build a version

First, install all prerequisites:

```shell
npm install 
```

Next, set up your configuration file:

```shell
npm run config
```

now edit config.json with you information.

| param | description |
|-------|-------------|
|region | the AWS region to launch stacks in |
|profile| the AWS credential profile to use |
|namespace| a logical name space to run your templates in such as dev, test and/or prod |
|devEmail(required) | the email to use when creating admin users in automated stack launches |

Next, use the following command to launch a CloudFormation template to create the S3 bucket to be used for lambda code and CloudFormation templates. Wait for this template to complete (you can watch progress from the command line or [AWS CloudFormation console](https://console.AWS.amazon.com/cloudformation/home))  

```shell
npm run bootstrap
```

Finally, use the following command to launch template to deploy the QnA bot in your AWS account. When the stack has completed you will be able to log into the Designer UI (The URL is an output of the template). A temporary password to the email in your config.json:

```shell
npm run up
```

If you have an existing stack you can run the following to update your stack:

```shell
npm run update
```

#### Designer UI Compatibility

Currently the only browsers supported are:  

- Chrome  
- FireFox  
We are currently working on adding Microsoft Edge support.  

## Built With

- [Vue](https://vuejs.org/)
- [Webpack](https://webpack.github.io/)

## License

See the [LICENSE.md](LICENSE.md) file for details

## New features

### Version 4.7.0

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

### Version 4.6.0

- Kendra integration is now fully automated during install or update when the new default Kendra Index Id parameter is provided.
- Kendra custom no_hits item required in earlier releases is no longer required to enable Kendra Fallback and should be removed, configurable confidence thresholds now available for filtering Kendra results.
- Kibana dashboard now shows additional detail on questions answered via Kendra FAQ and Kendra Fallback.
- Standard markdown is now automatically converted to Slack markdown when using Slack, Kibana dashboard logs and metrics retention period is now configurable during install or update, Lambda runtime upgraded to Node.js 12.x.
- Two new settings have been added

  - ALT_SEARCH_KENDRA_FALLBACK_CONFIDENCE_SCORE - Answers will only be returned that or at or above the specified [confidence level](https://aws.amazon.com/about-aws/whats-new/2020/09/amazon-kendra-launches-confidence-scores/) when using Kendra Fallback
  - ALT_SEARCH_KENDRA_FAQ_CONFIDENCE_SCORE - Synchronized FAQ questions will only be matched to an ElasticSearch question if the Kendra FAQ  confidence level is at or above the specified confidence level.

### Version 4.5.0

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
- Kendra Fallback message prefixes are now configurable in QnABot settings
- Fixed bugs and defects
- To improve performance, resiliency, and security, the Elasticsearch cluster will default to using ENCRYPTED nodes
  using the c5.large.elasticsearch instance type. If UNENCRYPTED is selected, the
  t3.small.elasticsearch instance types will be used. The default number of nodes in a new cluster is now 4 for improved
  resiliency. The number of cluster nodes can be reduced to 2 for development environments
  if desired.
- QnABot distribution regions now available for one click deployment have increased to 8 regions. These are Northern Virginia (us-east-1), Oregon (us-west-2),  Ireland (eu-west-1), London (eu-west-2), Frankfurt (eu-central-1), Sydney (ap-southeast-2), Singapore (ap-southeast-1), and Tokyo (ap-northeast-1).

A [workshop](https://github.com/aws-samples/aws-ai-qna-bot/tree/master/workshops/reinvent2019/readme.md) is available in GitHub
that will walk you through setting up this feature.
