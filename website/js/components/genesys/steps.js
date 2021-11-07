module.exports=[
{
    title:"Configure LexV2 and Genesys Cloud with AppFoundry",
    text:`
<br/>
Do step 2 through 5 in the <a href="https://help.mypurecloud.com/articles/amazon-lex-v2-quick-start-guide/">Lex V2 quick start guide.</a>
<br/> 
`,
    image:"../images/wizard-1.png"
},{
    title:"Install and Configure Archy",
    text:`
<br />
Download and install the Genesys Archy tool, found <b><a href="https://console.aws.amazon.com/connect">here.</a></b>
<br /><br />
&#8291;1. Download the version of Archy for your operating system<br/>
&#8291;2. Run archy setup and configure credentials 
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
