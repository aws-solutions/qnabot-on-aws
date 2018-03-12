# CFN Lambda
This Lambda is responsible for create the customer resources in the CloudFormation templates. /lib contains the code for individual resources types which are choosen by the "ResourceType" parameter of the request. 

## Tests
test are run using:
```shell
npm test
```
or
```shell
npm unit {{test-name}}
```
