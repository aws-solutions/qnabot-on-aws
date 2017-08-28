## Create Alexa Skill
1. Sign into the [Amazon Developer Console](https://developer.amazon.com/home.html).  
2. Choose 'ALEXA' from the toolbar, and choose the 'Get Started' button for 'Alexa Skills Kit'  
3. Choose 'Add a New Skill'  
4. Create a new skill using the following information:  
> **Skill Information**
> Skill Name: `QnA Bot`   
> Invocation name: `q and a`   
  
> **Interaction Model**
> Intent Schema:  
> ```
> {
>   "intents": [
>     {
>       "slots": [
>         {
>           "name": "QnA_slot",
>           "type": "EXAMPLE_QUESTIONS"
>         }
>       ],
>       "intent": "Qna_intent"
>     }
>   ]
> }
> ```  
> Custom Slot Type: `EXAMPLE_QUESTIONS`  
> Values: <button class="clip"  
    data-clipboard-text="{{#each bot.slotutterances }}{{this}}  
    {{/each}}">Copy to Clip Board</button>

> Sample Utterances: `Qna_intent {QnA_slot}`
  
> **Configuration**
> Endpoint:  Choose "AWS Lambda ARN"  
> Choose "North America", and paste:   
>> __{{bot.lambdaArn}}__  

> Accept all other defaults.  

> **Test** 
> Enter a test question and validate that you get the expected answer in the JSON response field. Try playing the audio for the response.
  
> **Publishing**
> If you want to publish your QnA skill, see [Submitting an Alexa Skill for Certification](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/publishing-an-alexa-skill)
> Otherwise skip this step. You will be able to access the QnA skill from Alexa devices registered to your own Amazon account. 

> **Privacy and Compliance**
> Complete this page, indicating 'no' for the privacy questions, and check the export compliance agreement.
  
> Save your skill.  

  
### Test with an Alexa device
  
> To access your unpublished skill, register your Alexa device to the same account as your Amazon Developer account. If you have a device that is not registered to the right account, you can re-register it by following these directions: [Registering an Alexa-enabled Device for Testing](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/testing-an-alexa-skill#h2_register)
  
> You can also use the convenient 'Echo Sim' site to test your bot: https://echosim.io/  
    
> Ask questions in the form: *"Alexa, ask Q and A, How do I use Q and A Bot?"*  (Assuming your device wake word is 'Alexa')


