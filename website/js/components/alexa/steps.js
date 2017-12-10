module.exports=[{
    title:"setup",
    text:`
Sign in or create an Amazon developer account at [Amazon Developer Console](https://developer.amazon.com/home.html) 
    `
},{
    title:"developer Console",
    text:`
1. Choose <kbd>ALEXA</kbd> from the toolbar  
1. choose the <kbd>Get Started</kbd> button for <kbd>Alexa Skills Kit</kbd>
1. Choose <kbd>Add a New Skill</kbd>
`},{
    title:"create Skill",
    text:`
Create a new skill using the following information:  

| Name | Value |
|------|-------|
| Skill Type | Customer Interaction Model |
| Skill Name | <kbd>QnA Bot</kbd> |
| Invocation Name | <kbd>q and a</kbd> |
| Intent Schema |  copy and paste from button below |
| Custom Slot Type | <kbd>EXAMPLE_QUESTIONS</kbd> |
| Sample Utterances | <kbd>Qna_intent {QnA_slot}</kbd> |
| Utterances |  copy and paste from button below |
| Endpoint | Choose <kbd>AWS Lambda ARN</kbd> |
| Lambda Arn |  copy and pase from button below | 

choose all other defaults
`,
    buttons:[{
        text:"Copy Intent Schema to clipBoard",
        id:"IntentSchema",
        loading:false
    },{
        text:"Copy utterances to clipBoad",
        id:"Utterances",
        loading:false
    },{
        text:"Copy LambdaArn to clipBoard",
        id:"LambdaArn",
        loading:false
    }]
},
{
    title:"Publishing",
    optional:true,
    text:`
If you want to publish your QnA skill, see [Submitting an Alexa Skill for Certification](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/publishing-an-alexa-skill)

Otherwise skip this step. You will be able to access the QnA skill from Alexa devices registered to your own Amazon account."
`},
{
    title:"Privacy and Compliance",
    text:`
Complete this page, indicating 'no' for the privacy questions, and check the export compliance agreement.
`},
{
    title:"test",
    text:`
Save your skill and now you can test. 

##### EchoSim
You can use the convenient [echosim.io](https://echosim.io/) site to test your bot.

##### Alexa Device 
To access your unpublished skill, register your Alexa device to the same account as your Amazon Developer account. If you have a device that is not registered to the right account, you can re-register it by following these directions: [Registering an Alexa-enabled Device for Testing](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#h2_register)

Ask questions in the form: *\"Alexa, ask Q and A, How do I use Q and A Bot?\"*  (Assuming your device wake word is 'Alexa')

`
}
]
