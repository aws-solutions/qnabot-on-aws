# Utility Scripts that can be used post deploy to alter QnABot stack

## CMK based setup
Customer security/compliance policies sometimes require AWS KMS CMK to be used to encrypt content/configuration rather
than default AES-256 based keys. The configureCMK.py script allows a user to specify a KMS CMK ARN with which 
to encrypt QnABot Lambdas and Parameter Store settings.

Use 
python3 configureCMK.py <aws region> <CLOUDFORMATION STACK NAME> <KMS CMK ARN>

As an example

```
python3 configureCMK.py us-west-2 QnABotDevStack arn:aws:kms:us-west-2:nnnnnnnnnnnn:key/nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn
```