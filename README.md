# A Question and Answer Bot Using Amazon Lex and Alexa

> Build a chat bot to answer questions. 

This repository contains code to launch an AWS Lex Bot to capture natural language questions typed or spoken, using the Lex Web-UI client, and return the most relevant answer obtained by searching all QnA documents using the AWS Elasticsearch service. You can use this repository to extend or customize the QnABot for your own purposes.

### Prerequisites

- Running Linux 
- Installed npm 3> and node 6> [instructions](https://nodejs.org/en/download/)
- Clone this repo.
- Set up an AWS account. [instructions](https://AWS.amazon.com/free/?sc_channel=PS&sc_campaign=acquisition_US&sc_publisher=google&sc_medium=cloud_computing_b&sc_content=AWS_account_bmm_control_q32016&sc_detail=%2BAWS%20%2Baccount&sc_category=cloud_computing&sc_segment=102882724242&sc_matchtype=b&sc_country=US&s_kwcid=AL!4422!3!102882724242!b!!g!!%2BAWS%20%2Baccount&ef_id=WS3s1AAAAJur-Oj2:20170825145941:s)
- Configure AWS CLI and local credentials. [instructions](http://docs.AWS.amazon.com/cli/latest/userguide/cli-chap-welcome.html)
- Lex is currently only supported in the us-east-1 region.

## Getting Started
All script descriptions are found in /docs/scripts.md  
Fist, install all prerequisites:
```shell
npm install 
```
Next, launch a Cloudformation template to create the S3 bucket to be used for lambda code and Cloudformation templates. Wait for this template to complete (you can watch progress from the [AWS Cloudformation console](https://console.AWS.amazon.com/cloudformation/home))  
After the template has complete run:
```shell
npm run stack dev/bootstrap up
```

Next, build all assets and upload to the S3 bucket created in the previous step:
```shell
npm run upload
```

Finally, launch template to deploy the QnA bot in your AWS account. When the stack has completed you will be able to log into the Designer ui (The URL is an output of the template) with the password set in "templates/test/master.json":
```shell
npm run stack test/master up
```

## Components
### Cloudformation Templates
The templates are found in the /templates directory. Master-base.json is the entry point and the other templates and nested in Master-base.json. 

### Lambda Functions
Lambda functions are found in the /lambda directory.

### Web interface
The Designer Ui and client Ui code is in the /website/admin directory. 

## Preparing QnA documents

QnA documents must be formatted as JSON objects, with one file containing a JSON list of QnA documents. Here's an example of a simple QnA document:

```json 
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
```
Each QnA object has current 3 fields:
- qid: A unique identifier
- q: A list of questions (one or more)
- a: The text to be returned as the answer when this document is the most relevant
  
You can associate multiple questions with the same answer, allowing this answer to be retrieved if the user asks the question using different terms and key words. NOTE: the questions don;t have to match exactly how the user will ask the question, but the closer the match the more likely that the right answer will be returned when elastic search tries to find the best match to the user's question..  

Keep the answer text short and succinct. Long answers might be fine for a FAQ website, but are not suitable for a chat bot.  

## Development 
The following will launch a Cloudformation template to create AWS resources in your account that are used in the Lambda, Cloudformation, and WebUi tests. 
```shell
npm run dev-up
```
Once the template has complete you can run start test locally.

#### Cloudformation tests
The Cloudformation test templates are in the templates/test folder. Run a template test with:
```shell
npm run stack test/{template-name-without-.json}
```

You also can check a template's syntax with:
```shell
npm run check {template's directory relative to /templates}/{template name with .json or .yaml}
```
Eg.
```shell
npm run check test/es.json
```

#### Running Lambda Function tests
Each lambda directory has its own test that can be run with the following command in the lambda function directory:
```shell
npm run test
```

#### Testing Designer UI
The Test for the website are in the /website/admin/test. A development server can be setup by calling:
```shell
npm run server
```
You can view this local Designer UI at [http://localhost:8000](http://localhost:8000)

## Built With

* [Vue](https://vuejs.org/) 
* [Webpack](https://webpack.github.io/)

## License
See the [LICENSE.md](LICENSE.md) file for details
