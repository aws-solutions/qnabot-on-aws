module.exports=[{
    title:"Provision a Connect Instance",
    text:`
- Create an Amazon Connect Instance by walking through the first Tutorial [Amazon Connect Tutorial](https://docs.aws.amazon.com/connect/latest/adminguide/tutorials.html)
    `,
    image:"../images/connect_create_instance.png"
},{
    title:"Add QnABot to Contact Flows",
    text:`
- Now we must make the QnABot accessible to our new call center. 
- Open the Amazon Connect console in a new tab (https://console.aws.amazon.com/connect) 
- Select Contact Flows
- Type in the name of your bot
- Click add Lex Bot
    `,
    image:"../images/connect_01.png"
},{
    title:"Import Contact Flow part 1",
    text:`
- Go back to the call center admin page
- Select Contact Flows
    `,
    image:"../images/connect_02.png"
},
{
    title:"Import Contact Flow part 2",
    text:`

- Then 'Create contact flow':
    `,
    image:"../images/connect_03.png"
},
{
    title:"Import Contact Flow part 3",
    text:`
    - Download the JSON file below
    - Name your Contact Flow
    - Import the Contact Flow`,
    image:"../images/connect_04.png"
},
{
    title:"Save Contact Flow",
    image:"../images/connect_06.png",
    text:`
- After loading the contact flow it will look similar to the image below.
- Save and Publish your flow when you are done.
`
},
{
    title:"Assign Contact Flow part 1",
    image:"../images/connect_07.png",
    text:`
- Go back to the Dashboard and choose 'Phone numbers'
`
},
{
    title:"Assign Contact Flow part 2",
    image:"../images/connect_08.png",
    text:`
- Choose the contact flow you just created and click save.
`
}
]
