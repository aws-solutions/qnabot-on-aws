# Personally Identifiable Information (PII) Redaction and Rejection in QnABot

QnABot now offers PII handling capabilities such as redaction, and rejection of sensitive information using Amazon Comprehend and regular expressions. The system can be configured to redact PII from CloudWatch logs, S3 and OpenSearch Dashboard, as well as reject an input containing PII. QnABot administrators can fine-tune the behavior through various settings, including confidence thresholds, specific PII entity types, and custom regex patterns. An optional feature allows for redaction of information in CloudWatch logs and feedback/metrics sent to S3 [MetricsBucket](../Technical%20Information.md) and OpenSearch Dashboard. These features provide a comprehensive solution for managing PII, improving privacy protection and regulatory compliance. 
> **_NOTE:_** 
These settings are disabled by default. QnABot administrators can customize these feature through the Content Designer UI Settings. 

|Setting | Type of Value | Description |
--------|---------------|-------------|
| ENABLE_REDACTING | true or false | Enables or disables the system's ability to redact log output using REDACTING_REGEX.
| REDACTING_REGEX | regex expression | Defines patterns to be redacted from logs when ENABLE_REDACTING is true.
| ENABLE_REDACTING_WITH_COMPREHEND | true or false | Enables PII Redaction using [Amazon Comprehend](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/)
| COMPREHEND_REDACTING_CONFIDENCE_SCORE | number (0 to 0.99) | Sets a threshold for PII redaction. Only PII detected with Amazon Comprehend's confidence score higher than this value will be redacted.
| COMPREHEND_REDACTING_ENTITY_TYPES | comma separated list of [PII Entity Categories](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/) | Only recognize PII entity types in the list for redaction
| PII_REJECTION_ENABLED | true or false |  Enables or disables the system's ability to reject input containing PII. It is recommended to also enable PII redaction by setting the ENABLE_REDACTING and/or the ENABLE_REDACTING_WITH_COMPREHEND if you are enabling PII rejection.
| PII_REJECTION_QUESTION | text  |  If PII rejection is enabled and PII is detected, the user's original question will be replaced with this text.
| PII_REJECTION_REGEX | Defines patterns to identify PII for rejection purposes.
| PII_REJECTION_CONFIDENCE_SCORE | number (0 to 0.99) | Sets a threshold for PII rejection. Only PII detected with Amazon Comprehend's confidence score higher than this value will trigger rejection.
| PII_REJECTION_ENTITY_TYPES | comma separated list of [PII Entity Categories](https://aws.amazon.com/blogs/machine-learning/detecting-and-redacting-pii-using-amazon-comprehend/) | Only recognize PII entity types in the list
| DISABLE_CLOUDWATCH_LOGGING | true or false | Disable all logging in fulfillment es query handler lambda. does not disable logging from Lambda Hooks or Conditional Chaining Lambda functions

## Additional information on regex in settings REDACTING_REGEX and PII_REJECTION_REGEX
 
QnABot offers a configurable, cost-effective PII detection feature using regular expressions. When enabled via the Designer UI Settings, this feature detects PII patterns defined by the regex and takes action based on the settings listed in previous sections. Administrators can customize the RegEx patterns to suit their specific PII detection needs.

The default RegEx:

```regex
\b\d{4}\b(?![-])|\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b
```

This replaces 4 digit numbers not followed by a hyphen, a 9 digit number (SSN without hyphens), and a typical
SSN using nnn-nn-nnnn syntax with hyphens.

An alternative RegEx to evaluate:

```regex
\b\d{4}\b(?![-])|\b\d{9}\b|\b\d{3}-\d{2}-\d{4}\b|\b\d{4}(-\d{4}){3}\b
```

The initial regex is more focused on catching SSNs and other potentially sensitive 4-digit or 9-digit numbers. The second regex tries to do that, but also tries to catch debit/credit card numbers in a common format.