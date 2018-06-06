module.exports=[{
    title:"Signin/Signup",
    text:`
- create an Amazon developer account at [Amazon Developer Console](https://developer.amazon.com/home.html)
    `,
    image:"../images/alexa_sign-in.png"
},{
    title:"Create Skill part 1",
    test:" ",
    image:"../images/alexa_create-skill.png"
},{
    title:"Create Skill part 2",
    test:" ",
    image:"../images/alexa_select.png"
},
{
    title:"Configure Skill Lambda",
    test:" ",
    image:"../images/alexa_lambda-config.png",
    buttons:[{
        text:"Copy Lambda Arn to clipboard",
        id:"LambdaArn",
        loading:false
    }]
},
{
    title:"Configure Skill Schema",
    test:" ",
    image:"../images/alexa_schema-config.png",
    buttons:[{
        text:"Copy Schema to clipBoard",
        id:"Schema",
        loading:false
    }]
},
{
    title:"Test",
    image:"../images/alexa_enable.png",
    text:`
Congratulations! Your QnABot skill is now ready to be used. 

Enable testing (as shown below) and use the test page to try and test your new skill. 

### Alexa Device 
To access your unpublished skill, register your Alexa device to the same account as your Amazon Developer account. If you have a device that is not registered to the right account, you can re-register it by following these directions: [Registering an Alexa-enabled Device for Testing](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#h2_register)

Ask questions in the form: *\"Alexa, ask Q and A, How do I use Q and A Bot?\"*  (Assuming your device wake word is 'Alexa')

Publish your skill if you want to make it available for others to use from their own Amazon accounts.
`
}
]
