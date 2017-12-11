#Handler Lambda
This the lambda that backs ApiGateway and fulfills Lex and Alexa requests. 

##Tests
test are running using:
```shell
npm test
```
or
```shell
npm unit {{test-name}}
```

#Required Templates and running test
The Following templates are required to run the tests:

1. dev/domain
1. dev/es
1. dev/lex

launch with:
```shell
cd ../.. ; npm stack dev/{name}; #must be run from the root of the project
```
