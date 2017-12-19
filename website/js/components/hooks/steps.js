var stringify=require('json-stringify-pretty-compact')
var example=stringify(require('./example'))
var code=require('./code.txt')
module.exports=[{
    title:"Create Lambda Function",
    text:`
Create a lambda function with a name that starts with "qna"  

for example:  
- qnaExtraSpecial  
- qnaSecretSauce  
...
    `
},{
    title:"Write Code",
    text:`
code must return its event object

A minimal function would look like this

~~~js
${code}
~~~

The Event context has three properties
1. \`req\` the normalized request object
1. \`res\` the normalized response object (edit this to change the response)

~~~json 
${example}
~~~
`,
    buttons:[{
        text:"Copy Code",
        id:"code",
        loading:false
    },{
        text:"Copy Example request",
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
