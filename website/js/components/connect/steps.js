module.exports=[{
    title:"Provision a Connect Instance",
    text:`
Create an Amazon Connect Instance by walking through the first Tutorial [Amazon Connect Tutorial](https://docs.aws.amazon.com/connect/latest/adminguide/tutorials.html)
    `,
    image:"../images/connect_create_instance.png"
},{
    title:"Add QnABot to Contact Flows",
    text:`
- Now we must make the QnABot accessible to our new call center. 
<br/> 
&#8291;1. Open the Amazon Connect console in a new tab (https://console.aws.amazon.com/connect) <br/>
&#8291;2. Select Contact Flows <br/>
&#8291;3. Type in the name of your bot <br/>
&#8291;4. Click add Lex Bot
    `,
    image:"../images/connect_01.png"
},{
    title:"Open Contact Flows",
    text:`
&#8291;1. Go back to the call center admin page<br>
&#8291;2.  Select Contact Flows
    `,
    image:"../images/connect_02.png"
},
{
    title:"Create New Contact Flow",
    text:`

- Then 'Create contact flow':
    `,
    image:"../images/connect_03.png"
},
{
    title:"Import Contact Flow",
    text:`
&nbsp;1. Download the JSON file below <br/>
&nbsp;2. Name your Contact Flow <br/>
&nbsp;3. Import the Contact Flow`,
    image:"../images/connect_04.png",
    buttons:[{
        text:"Download",
        id:"DownloadContactFlow",
        loading:false
    }]
},
{
    title:"Save and Publish",
    image:"../images/connect_06.png",
    text:`
- Save and Publish your flow when you are done.
`
},
{
    title:"Assign Contact Flow to Phone Number",
    image:"../images/connect_07.png",
    text:`
&nbsp;1.  Go back to the Dashboard <br/>
&nbsp;2.  Choose 'Phone numbers' <br/>
`
},
{
    title:"Select the Contact Flow",
    image:"../images/connect_08.png",
    text:`
&nbsp; Choose the contact flow you just created and click save.
`
}
]
