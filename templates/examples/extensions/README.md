# Extensions

## CfN resources

index.js returns CfN resource definitions for extension documents and hook functions
outputs.js returns CfN outputs definitions for extension hook functions

These are used by templates/examples/index.js to build the overall Examples stack template (examples.json)

## Usage

### Add new Lambda Hooks

Create javascript (node.js) lambda hooks under ./js_lambda_hooks.  
Create python3 lambda hooks under ./py_lambda_hooks.  
Create a new subdirectory for your new lambda hook, e.g MyLambdaHook  
Create a code file with your lambda function source code in the new subdirectory:  

- the file name should be the same as your directory name, with .py or .js suffix as appropriate, eg MyLambdaHook.py
- the code must contain a lambda function named 'handler', and handle standard lambda parameters and returns.
- if your lambda code relies on any packages not provided by Lambda, you can bundle these with your functions by creating
a requirements.txt (python) or a package.json (javascript) file in the same directory. During the build process the listed
packages will be downloaded and packaged/installed with your function.

### Reference your Lambda hooks from Content Designer

In Content Designer, use the following syntax to reference your Lambda hook function:

- QNA:EXT\<LambdaHookName\> (e.g _QNA:EXTMyLambdaHook_)  
  
The ARN of your installed lambda hook will be referenced at runtime by the QnABot Fulfillment function using environment
variables. I.e. the fulfillment function is set up (during installation) with environment variable 'EXTMyLambdaHook' and the
value is the ARN of your installed function.
Using the environment variable indirection is preferable to using your function ARN, since you can maintain separate function
instances for different QnABot stacks / environments, and you can easily export/import content that does not contain ARN
references to specific function instances in specific accounts and regions.

### Add new content packages for Content Designer Import Examples/Extensions listing

Add importable content packages in the ./ui_imports/content folder using two files as follows:

- \<name\>.json  -- the JSON representation of the QnA documents to be imported (can be a file that was previous exported
from Content Designer.  
- \<name\>.txt  -- a short tagline description of the content that will be displayed in the Content Designer listing.  

### NOTES

- The extensions Makefile creates separate zip packages for each separate Lambda hook function
- Lambda hook functions use nodejs12.x or python3.6 only at this time
- Lambda hook functions will be allocated 2048MB memory (defined in index.js)
