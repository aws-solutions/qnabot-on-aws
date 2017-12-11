# CFN Lambda
This Lambda is responsible for create the customer resources in the CloudFormation templates. /lib contains the code for individual resources types which are choosen by the "ResourceType" parameter of the request. 

## Tests
test are running using:
```shell
npm test
```
or
```shell
npm unit {{test-name}}
```

# Required Templates and running test
The Following templates are required to run the tests:

1. dev/domain
1. dev/cognito
1. dev/bucket

launch with:
```shell
cd ../.. ; npm stack dev/{name}; #must be run from the root of the project
```
