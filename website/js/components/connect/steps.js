module.exports=[
{
    title:"Provision a Connect Instance",
    text:`
<br/>
- Start by completing all 3 steps below to setup your Amazon Connect instance:
<br/> 
&#8291;1. <b><a href="https://docs.aws.amazon.com/connect/latest/adminguide/tutorial1-login-aws.html" target="_blank">Launch Amazon Connect</a> <br />
&#8291;2. <b><a href="https://docs.aws.amazon.com/connect/latest/adminguide/tutorial1-create-instance.html" target="_blank">Create an instance</a> <br />
&#8291;3. <b><a href="https://docs.aws.amazon.com/connect/latest/adminguide/tutorial1-claim-phone-number.html" target="_blank">Claim a phone number</a> <br />
    `,
    image:"../images/wizard-1.png"
},{
    title:"Add QnABot to Contact Flows",
    text:`
<br />
- Now we must make the QnABot accessible to our new call center. 
<br/> 
- Open the  <b><a href="https://console.aws.amazon.com/connect">Amazon Connect console</a></b>, and follow the steps below:<br /><br />
&#8291;1. Choose the <b>instance alias</b> you created<br/>
&#8291;2. Select <b>Contact Flows</b> <br/>
&#8291;3. Select <i><span id='spnBotname'>your bot</span></i> in the <b>Bot</b> drop down <br/>
&#8291;4. Choose <b>+ Add Lex Bot</b><br/>
    `,
    image:"../images/wizard-2.png"
},{
    title:"Create Contact Flows",
    text:`
<br />
&#8291;1. On the same page, choose <b>Overview</b> on the Left menu <br/>
&#8291;2. Choose the <b>Login URL</b>, it will take you the Amazon Connect Administration App<br/>
&#8291;3. In the Routing menu on the left, choose <b>Contact Flows</b><br/>
&#8291;4. On Contact Flow screen choose <b>Create contact flow</b><br/>
    `,
    image:"../images/wizard-3.png"
},
{
    title:"Import Contact Flow",
    text:`
<br/> To begin this step first choose <b>DOWNLOAD</b> below. It will download a JSON contact flow file for QnABot<br/> <br/>
&#8291;1. Go back to Amazon Connect Administration App, choose the dropdown on the top right and choose <b>Import Flow</b> <br/>
&#8291;2. Choose the <b>contactflow.json</b> file, that you downloaded from step 1, and choose <b>Import</b> <br/>
&#8291;3. Enter a new name for your contact flow <br/>
&#8291;4. Choose <b>Save</b> <br/>
&#8291;5. Choose <b>Publish</b> <br/>
    `,
    image:"../images/wizard-4.png",
    buttons:[{
        text:"Download",
        id:"DownloadContactFlow",
        loading:false
    }]
},
{
    title:"Add a Phone Number",
    text:`
<br />
&#8291;1. In the Routing menu on the left, choose <b>Phone Numbers</b><br/>
&#8291;2. Choose the <b>Phone Number</b> created on the first step<br/>
&#8291;3. In the Contact Flow / IVR dropdown, select the <b>Contact Flow</b> you created, and choose <b>Save</b><br/>
`,
    image:"../images/wizard-5.png",
},
{
    title:"Adding questions and Testing",
    buttons: [{
        text:"Import Sample Questions and Answers",
        id:"ImportQuestions",
        loading:false
    }],
    image:"../images/wizard-6.png",
    text:`
<br /><br />
Choose <b>Import Sample Questions and Answers</b> below, it can take up to <b>2 minutes</b> to finish this process.<br />
After Rebuild is done, you are ready to <b>try your Bot!, Call the <b>Phone Number</b> and try some of the questions below.</b>
<br /><br /><span id="ImportQuestionsStatus"/><br /><br />
For more information see our blog post <a href="https://github.com/aws-samples/aws-ai-qna-bot/blob/ConnectWizard/workshops/Connect/README.md">
Build an AI powered agent for Amazon Connect using AWS QnABot
</a>
`
}
]
