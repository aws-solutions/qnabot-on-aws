# Import Lambda
this lambda imports QnAs from S3 into elasticsearch,

## Tests
test are run using:
```shell
npm test
```
or
```shell
npm unit {{test-name}}
```

# Required Templates and running test
The Following templates are required to run the tests:

1. dev/bucket
1. dev/lambda

launch with:
```shell
cd ../.. ; npm stack dev/{name}; #must be run from the root of the project
```
