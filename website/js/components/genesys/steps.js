module.exports=[
{
    title:"Configure LexV2 and Genesys Cloud with AppFoundry",
    text:`
<br/>
Do step 2 through 4 in the <a href="https://help.mypurecloud.com/articles/amazon-lex-v2-quick-start-guide/">Lex V2 quick start guide.</a> 
<br/>Note: Step 1 is already complete, as QnABot is a Lex bot.
<br/> 
&#8291;Step 1. <b>SKIP STEP 1</b>, QnABot deploys the LexV2 bot<br />
&#8291;Step 2. <b>Step 2: Grant Genesys the permissions to call the Amazon Lex V2 bot</b><br />
&#8291;Step 3. <b>Step 3: Obtain the Amazon Lex V2 integration from Genesys AppFoundry</b><br />
&#8291;Step 4. <b>Step 4: Configure and activate the Lex V2 integration in Genesys Cloud</b><br /> 
`,
    image:"../images/wizard-1.png"
},{
    title:"Install and Configure Archy",
    text:`
<br />
Download, install and configure the Genesys Archy tool. All the instructions are on the Genesys Archy developer website, 
found here:<a href="https://developer.genesys.cloud/devapps/archy/install">https://developer.genesys.cloud/devapps/archy/install</a></b>
<br /><br />High level steps:<br/>
&#8291;1. Download the version of Archy for your operating system<br/>
&#8291;2. Extract or install Archy<br/>
&#8291;3. Run <code>archy setup</code> and configure authentication credentials 
<br/>
    `,
    image:"../images/wizard-2.png"
},
{
    title:"Download Genesys Cloud Inbound Call Flow",
    text:`
<br/> To begin this step, choose <b>DOWNLOAD INBOUND CALL FLOW</b> below. It will download a YAML inbound call flow file for QnABot.<br/> <br/>
    `,
    image:"../images/wizard-4.png",
    buttons:[{
        text:"DOWNLOAD INBOUND CALL FLOW",
        id:"DownloadInboundCallFlow",
        loading:false
    }]
},
{
    title:"Import Call Flow with Archy",
    text:`
<br />In the terminal, run archy publish --file QnABotFlow.yaml. This will create and publish the call flow<br/>
    `,
    image:"../images/wizard-5.png",
},
{
    title:"Configure Call Routing",
    buttons: [{
        text:"IMPORT SAMPLE QUESTIONS AND ANSWERS",
        id:"ImportQuestions",
        loading:false
    }],
    image:"../images/wizard-6.png",
    text:`
<br />In Genesys Pure Cloud Admin, configure a call route to route to the newly published QnABot inbound call flow.
`
}
]
