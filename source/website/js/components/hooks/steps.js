/* eslint-disable max-len */
/** *******************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 ******************************************************************************************************************** */

const stringify = require('json-stringify-pretty-compact');
const example = stringify(require('./example'));
const codeJS = require('./codejs.txt');
const codePY = require('./codepy.txt');

module.exports = [{
    title: 'Create Lambda Function',
    text: `
1. Create a lambda function with a name that starts with "qna-", for example:  

> qna-ExtraSpecial  
> qna-SecretSauce  
> ...

2. Choose a runtime, our examples will use either nodejs or python. 
3. Click "Copy Lambda Role" below and paste into Role
4. click "Create Function"
    `,
    buttons: [{
        text: 'Copy Lambda Role',
        id: 'Role',
        loading: false,
    }],
}, {
    title: 'Write Code',
    text: `
A minimal function would look like this

### Node.js Code
~~~js
${codeJS}
~~~

<br />

### Python Code
~~~python
${codePY}
~~~

<br />

The event object has two properties
1. \`event.req\` the normalized request object
1. \`event.res\` the normalized response object (edit this to change the response)

The lambda handler must return the modified event object. 

<br />

### Example Event
~~~json 
${example}
~~~
`,
    buttons: [{
        text: 'Copy node.js Code',
        id: 'code-js',
        loading: false,
    }, {
        text: 'Copy python Code',
        id: 'code-py',
        loading: false,
    }, {
        text: 'Copy Example Event',
        id: 'request',
        loading: false,
    }],
}, {
    title: 'Add/Edit Question',
    text: `
For a new or existing question edit the Lambda field to contain the name or ARN of your created lambda function
`,
}, {
    title: 'Test Question',
    text: `
Ask question in QnAClient to see your new response
`,
},
];
