# Integrate the open source AWS QnABot solution with Canvas LMS

Students use their schools' learning management solution (LMS) to keep track of their assignments, grades, and working through their course work. To make it easier for students to stay on track and also have easy access to a knowledge base, and help with their learning progress, you can now integrate the open source AWS QnABot solution with Canvas LMS, and enable students with in-the-moment support. With this integration, students will be able to ask the chatbot about their grades, syllabus, enrollments, assignments, and announcements. 


## Setup prerequisites
There are few prerequisites to get started with the setup: 
1.	Setup up Canvas LMS – the setup requires a running Canvas LMS environment (on-premise or AWS environment). If you do not have Canvas LMS, you can install by following the instructions on GitHub at https://github.com/instructure/canvas-lms/wiki

2.	Setup the open source AWS QnABot solution deployed in your AWS environment. If you do not have this setup or are running an older version of QnABot, you can easily install or upgrade by following the steps outlined in our blog post -- https://www.amazon.com/qnabot.

3.	Setup a companion Web UI for the chatbot. You can deploy this using the open source Lex-Web-UI solution in your AWS account by following the steps outlined in this blog post -- https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/ 
  - During this setup, set the {EnableLogin} setting to {True}
  - This will allow us to enable authentication in the chatbot and connect that to the Identity provider of Canvas LMS. 
  - For {BotName} and {BotAlias}, use the BotName and Bot Alias as made available from the AWS QnABot solution deployment outputs. 

## Configuring the AWS QnABot solution
If the above prerequisites are all setup, we can proceed with configuring the AWS QnABot solution to interact with Canvas LMS. The AWS QnABot solution uses the Canvas API to integrate with Canvas LMS. To configure the AWS QnABot solution, we will setup the following: 

  - Create a new Canvas API Access Token
  - More details: https://community.canvaslms.com/t5/Admin-Guide/How-do-I-manage-API-access-tokens-as-an-admin/ta-p/89
 
  - Store the Canvas API Access Token in AWS Secrets Manager
AWS Secrets Manager enables you to replace hardcoded credentials in your code, including passwords, with an API call to Secrets Manager to retrieve the secret programmatically. This helps ensure the secret can't be compromised by someone examining your code, because the secret no longer exists in the code.
  - Login to your AWS console and navigate to Secrets Manager service. 
  - Note: use the same AWS region where you deployed the AWS QnABot solution. 
  - Click the “Store a new secret” button
  - For {Key}, name the key as "API_Token"
  - For {Value}: Copy and paste the Canvas API Access Token value that you created earlier
 
  - Give your secret a Name and Description
  - Start the name with the letters “qna-“. Such as: qna-CanvasAPIKey

##	Configure AWS QnABot Settings
Once you have deployed the AWS QnABot solution, you will have access to the QnABot Designer console, which allows you to create and manage your knowledge, and add extensions.
  - Click on the link that you received in your email and login to your QnABot Designer console.
  - Click on the menu located in the {top left corner} of the designer console. This will provide the “Tools” option list.
  - Scroll to the bottom of the page and click on “ADD NEW SETTING” button
  - We will use this to store the Secrets Manager key that you created in the above steps, so QnABot can know how to connect to Canvas LMS.
  - Enter the New Setting values:
  - Name: enter "CanvasAPI_Key" as the name
  - Value: use the name of the Secrets Manager key that you created in the above steps for storing the Canvas API key value. 
  - For example: “qna-CanvasAPIKey“

  - Click ADD button to save the new QnABot setting
  - Create another Setting
  - Name: enter "CanvasDomainName" as the name
  - Value: use the value of your Canvas endpoint. Such as: https://canvas.myschool.edu
  - Click ADD button to save the new QnABot setting
  - Click SAVE to save the settings

  - Scroll to the top of the page and update the “ES_USE_KEYWORD_FILTERS” settings to “false”

```
Additional Information: The keyword filter feature helps QnABot to be more accurate when answering questions, and to admit more readily when it doesn’t know the answer. The keyword filter feature works by using Amazon Comprehend to determine the ‘part of speech’ that applies to each word you say to QnABot. By default, nouns (including proper nouns), verbs, and interjections are used as ‘keywords’. Any answer returned by QnABot must have questions that match these keywords, using the following (default) rule: 

a. Rule 1: if there are 1 or 2 keywords, then all keywords must match.
b. Rule 2: if there are 3 or more keywords, then 75% of the keywords must match.
c. Rule 3: if QnABot can’t find any answers that match these keyword filter rules, then it will admit that it doesn’t know the answer rather than guessing an answer that doesn’t match the keywords.

We will set this setting to “false” (to enable support for Rule 3), as we need to accept free form input for questions that do not exist in the knowledgebase and have our Canvas LMS integration figure out the best match.
  - Scroll to the bottom of the Settings page and click “Save” button to update the setting.
```


## Enabling Authentication
As part of the prerequisite setups, we setup the Lex-Web-UI (a companion UI solution for the chatbot) and configured the solution with the QnABot solution. The deployment setup an Amazon Cognito User Pool to support authentication. We will now extend this User Pool to add a test student user and test out the chatbot flow. 

  - Go to your AWS console and navigate to the Amazon Cognito service. 
  - Select “Manage User Pools” and you will find two User Pools have already been setup (via the prerequisite setups earlier). The User Pool we will use is the Lex-Web-UI user pool. 
   - Select the Lew-Web-UI user pool and create a test student user. Also use an {email address} as created in the Canvas LMS for the test student user.
```
Note: We are creating the user manually in Amazon Cognito to show this example setup. This manual user creation step should not be needed, if you want to SSO to Canvas LMS. 
  - Additional information on setting up Canvas LMS with SSO: 
https://community.canvaslms.com/t5/Admin-Guide/How-do-I-configure-SSO-settings-for-my-authentication-provider/ta-p/217

  - Additional information on extending Amazon Cognito to Federate to your Identity provider
https://qnabot.workshop.aws/deployment/sso.html
```


## Import Canvas Questions
In the QnABot Designer, click on the menu link on the top left and select "Import". From the "Examples/Extensions" section, click "Load" for "CanvasLMSInetgration" to load sample Canvas questions. 

## Testing the experience
Launch the WebAppUrl URL as available in the Lex-Web-UI AWS CloudFormation Output and Login to the chatbot from the menu option. Use a test student Canvas LMS credential to login and test the setup. 

Try the below example questions:
  - Type or speak the below question(s) and see how the chatbot responds back with an answer. 
  - If you are testing with voice input, you will see a browser message appear, asking permission to access the Microphone. Click on “Allow”. This will allow you to interact with the chat client via voice input.  


  - *canvas menu*
  - *do i have any announcements*
  - *tell me about my syllabus*
  - *do I have any announcements due*


 
## Additional reference
The following Canvas APIs are being used for this integration, below is a list for reference. 
  - User Profile — to support authentication, and greeting the user
  - Grades --- student can ask questions such as “how did i do in my Math course”. This supports the overall grade information (out of 100) which is aggregated by course (not by assignments)
  - Course — students can ask questions such as: “what are my assignments for Biology 101”
  - Syllabus — access syllabus information. The output of this is a URL to the syllabus. Student can ask about their syllabus by asking “tell me about my syllabus”
  - Enrollment — students can ask questions such as: “what courses am i enrolled in”, “what courses have i signed up for”
  - Announcements — anything sent by the teacher to student(s) such as: “you have a test coming up”. Student can ask by saying “do I have any announcements”

This integration uses the canvasapi python library to access information from Canvas. https://canvasapi.readthedocs.io/en/stable/getting-started.html


