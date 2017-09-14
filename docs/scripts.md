# npm scripts
The following are helper scripts run via: 
```shell
npm run script-name scripts-args
```

## Check Cloudformation Syntax
Runs a validation check against a cloudformation template. For example,to check a template called example.json in the templates folder run:  
```shell
npm run check example.json  
```

or for a script in the test directory:
```shell
npm run check test/example.json  
```

## Launch Cloudformation stacks
Manage cloudformation stacks for templates in the template directory. 
Eg. For a template with path templates/example.json:
```shell
npm run stack example up #launch a stack
npm run stack exampe update #update a stack
npm run stack example down #delete a stack 
```

## Build and Upload
To build all artifacts and upload to dev-bootstrap bucket:
```shell
npm run upload  
```

## Update Lambda Functions
To build all lambdas and update the handler & fulfillment functions in templates/test/master.json template:
```shell
npm run lambda-update  
```

## admin-update
To build designer UI website and upload to the template/test/master.json:
```shell
npm run admin-update
```

# Bootstrap Commands
To Bring up a full development environment from a fresh clone:
```shell
npm install  
npm run stack dev/bootstrap up     
```
When the dev/bootstrap stack has completed run:
```shell
npm run up   
```

