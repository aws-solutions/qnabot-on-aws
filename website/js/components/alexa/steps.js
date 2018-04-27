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
Congratulations! After you enable testing your skill is ready to be used. You will have to publish your skill in order for people to use it outside of your account. 

You can use this page to test your new Alexa skill or use the following: 

### EchoSim
You can use the convenient [echosim.io](https://echosim.io/) site to test your bot.

### Alexa Device 
To access your unpublished skill, register your Alexa device to the same account as your Amazon Developer account. If you have a device that is not registered to the right account, you can re-register it by following these directions: [Registering an Alexa-enabled Device for Testing](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#h2_register)

Ask questions in the form: *\"Alexa, ask Q and A, How do I use Q and A Bot?\"*  (Assuming your device wake word is 'Alexa')
`
}
]
