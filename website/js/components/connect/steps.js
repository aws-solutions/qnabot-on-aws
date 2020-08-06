module.exports=[{
    title:"Signin/Signup",
    text:`
- create an Amazon Connect Instance [Amazon Connect Tutorial](https://docs.aws.amazon.com/connect/latest/adminguide/tutorials.html)
    `,
    image:"../images/connect_create_instance.png"
},{
    title:"Make QnABot Accessible",
    text:`
- Now we must make the QnABot accessible to our new call center. 
- Open the Amazon Connect console in a new tab (https://console.aws.amazon.com/connect), select our new call center, choose "Contact Flows" and add the QnABot Lex bot.
    `,
    image:"../images/connect_01.png"
},{
    title:"Import Contact Flow part 1",
    text:`
-  Go back to the call center admin page. From the Dashboard view, select 'Contact flows':
    `,
    image:"../images/connect_02.png"
},
{
    title:"Import Contact Flow part 2",
    text:`
-  then 'Create contact flow':
    `,
    image:"../images/connect_03.png"
},
{
    title:"Import Contact Flow part 3",
    text:`
-  Enter contact flow name, eg: "QnaBot"':
    `,
    image:"../images/connect_04.png"
},
{
    title:"Import Contact Flow part 4",
    image:"../images/connect_05.png",
    text:`
- Download the JSON file below.
`
}
]
