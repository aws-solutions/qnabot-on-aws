# Lambda Hook Examples
This lambda contains a collection of lambda hooks for QnABot and a custom resource to create the example documents.

QnA documents are in the examples directory. On stack creation the files are run through a template with example lambda function arns so you can use examples lambdas in your examples.
See examples. 

QnA documents will show in the examples list in the Designer UI on the Import Page.

example lambda code is in the js directory (py coming soon). file must export a function name handler. See examples for a starting place. 

## Tests
test are run using:
```shell
npm test
```
or
```shell
npm unit {{test-name}}
```

