# Personally Identifiable Information Rejection and redaction

QnABot can now detect Personally Identifiable Information (PII) using [Amazon Comprehend](https://docs.aws.amazon.com/comprehend/latest/dg/how-pii.html) and regular expressions.

If ENABLE_REDACTION is set to "true", the Comprehend detected PII entities will also be redacted from CloudWatch logs and ElasticSearch logs.

![settings image](./settings.png)

Setting | Description |
---------|----------|
| ENABLE_REDACTING | true or false | Enable the system to redact log output
| REDACTING_REGEX | regex expression | Redacts expressions matching regex from logs
| PII_REJECTION_ENABLED | true or false | Enables PII Rejection
| PII_REJECTION_QUESTION | text  | If PII is found, the user's request (question) will change to this phrase
| PII_REJECTION_WITH_COMPREHEND: | true or false | Enable's [Personal Identifiable Information](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/) detection with Amazon Comprehend
| PII_REJECTION_REGEX | regex expression | Used to find PII based on a regex
| PII_REJECTION_ENTITY_TYPES | comma separated list of [PII Entity Categories](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/) | Only recognize PII entity types in the list
| DISABLE_CLOUDWATCH_LOGGING | true or false | Disable all logging in fulfillment es query handler lambda. does not disable logging from Lambda Hooks or Conditional Chaining Lambda functions
