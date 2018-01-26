var stringify=require('json-stringify-pretty-compact')
var example=stringify(require('./example.js'))
var codeJS=require('raw-loader!./code.js')
var codePY=require('raw-loader!./code.py')

module.exports=[{
    title:"Create Lambda Function",
    text:`
1. Create a lambda function with a name that starts with "qna-", for example:  

> qna-ExtraSpecial  
> qna-SecretSauce  
> ...

2. Choose a runtime, our examples will use either nodejs or python. 
3. For Role choose "create a customer role" and click allow
4. click "Create Function"
    `
},{
    title:"Write Code",
    text:`
A minimal function would look like this

##### node.js
~~~js
${codeJS}
~~~  

##### python
~~~python
${codePY}
~~~  

The event object has three properties
1. \`event.req\` the normalized request object
1. \`event.res\` the normalized response object (edit this to change the response)
1. \`event.response_type\` sets how handler lambda should respond. Set to \`"redirect"\` and edit \`event.req\`, specifically the \`event.req._query\` field to have the handler redirect to a new ElasticSearch query.  

The lambda handler must return the modified event object. 
~~~json 
${example}
~~~
`,
    buttons:[{
        text:"Copy node.js Code",
        id:"code-js",
        loading:false
    },{
        text:"Copy python Code",
        id:"code-py",
        loading:false
    },{
        text:"Copy Example Event",
        id:"request",
        loading:false
    }]
},{
    title:"Add/Edit Question",
    text:`
For a new or existing question edit the Lambda field to contain the arn of your created lambda function
`
},{
    title:"Test Question",
    text:`
Ask question in QnAClient to see your new response
`
}
]
