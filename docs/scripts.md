# npm scripts
helper scripts run via npm run script-name scripts-args

## check
Runs a validation check against a cloudformation template. to check a template called example.json in the templates folder run:  
    npm run check example.json  
or for a script in the test directory  
    npm run check test/example.json  

## stack
manages cloudformation stacks for a template name example.json in the template directory  
    launch stack - npm run stack example up  
    update stack - npm run stack exampe update  
    delete stack - npm run stack example down  

## Create dev bootstrap bucket
npm run stack dev/bootstrap up  

## upload
Builds  all artifacts and uploads to dev-bootstrap bucket  
npm run upload  

## up
builds artifacts, uploads artifacts, and launches master template  
npm run up  

## lambda-update
Builds all lambdas and updates the handler&fullfilment functions in the launched master template   
npm run lambda-update  

## admin-update
Builds website and uploads to the master-website bucket  

# set up commands  
npm install  
npm install --global jq-cli-wrapper  
npm run stack dev/bootstrap up   #might fail on first run, just rerun  
-when stack is complete  
npm run up   

