# Integration with Canvas LMS -- an early example implementation

Students use their schools' learning management system (LMS) to keep track of their assignments, grades, and working through their course work. To make it easier for students to stay on track and also have easy access to a knowledge base, and help with their learning progress, you can now integrate the open source AWS QnABot solution with Canvas LMS, and enable students with in-the-moment support. With this integration, students will be able to ask the chatbot about their grades, syllabus, enrollments, assignments, and announcements. 


## Setup prerequisites
There are few prerequisites to get started with the setup: 
1.	Setup up Canvas LMS – the setup requires a running Canvas LMS environment (on-premise or AWS environment). If you do not have Canvas LMS, you can install by following the instructions on GitHub at https://github.com/instructure/canvas-lms/wiki

2.	Setup the open source AWS QnABot solution deployed in your AWS environment. If you do not have this setup or are running an older version of AWS QnABot, you can easily install or upgrade by following the [AWS QnABot implementation guide](https://aws.amazon.com/solutions/implementations/aws-qnabot).

3.	Setup a companion Web UI for the chatbot. You can deploy this using the open source Lex-Web-UI project in your AWS account by following the steps outlined in this blog post -- https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/ .

    a. During this setup, set the `{EnableLogin}` setting to `{True}`. This will allow us to enable authentication in the chatbot and connect to a Identity provider. 

    b. For `{BotName}` and `{BotAlias}`, use the BotName and Bot Alias as made available from the AWS QnABot solution deployment outputs. 

## Creating and Storing the Canvas API Access Token
The AWS QnABot solution uses the Canvas API to integrate with Canvas LMS. To configure the AWS QnABot solution, we will setup the following: 

1. Create a new Canvas API Access Token. For more details on how to create a Canvas API Access Token, follow the link: https://community.canvaslms.com/t5/Admin-Guide/How-do-I-manage-API-access-tokens-as-an-admin/ta-p/89
 
2. Store the Canvas API Access Token in AWS Secrets Manager. AWS Secrets Manager enables you to replace hardcoded credentials in your code, including passwords, with an API call to Secrets Manager to retrieve the secret programmatically. This helps ensure the secret can't be compromised by someone examining your code, because the secret no longer exists in the code.

    a. Login to your AWS console and navigate to AWS Secrets Manager. Use the same AWS region where you deployed the AWS QnABot solution.

    b. Click the `Store a new secret` button

    c. For `{Key}`, name the key as `"API_Token"`

    d. For `{Value}`, copy and paste the Canvas API Access Token value that you created earlier

    e. Give your secret a Name and Description. Start the `name` with the letters `qna-`. Such as: `qna-CanvasAPIKey`

##	Configure AWS QnABot Settings
Once you have deployed the AWS QnABot solution, you will have access to the QnABot Designer console, which allows you to create and manage your knowledge bank of questions and answers.
1. Click on the link that you received in your email and login to your QnABot Designer console.
2. Click on the menu located in the {top left corner} of the designer console. This will provide the “Tools” option list.
3. Scroll to the bottom of the page and click on `ADD NEW SETTING` button. We will use this to store the Secrets Manager key name that you created in the above steps, so QnABot can know how to connect to Canvas LMS. Enter the New Setting values:

    b. Name: enter `CanvasAPIKey` as the name

    c. Value: use the name of the Secrets Manager key that you created in the above steps for storing the Canvas API key value. For example: `qna-CanvasAPIKey`

    d. Click `ADD` button to add the new QnABot setting
4. Create another Setting
    a. Name: enter `CanvasDomainName` as the name

    b. Value: use the value of your Canvas endpoint. Such as: `https://canvas.myschool.edu`

    c. Click `ADD` button to add the new QnABot setting
5. Scroll to the top of the page and update the `ES_USE_KEYWORD_FILTERS` settings to `false`

```
Additional Information: The keyword filter feature helps QnABot to be more accurate when answering questions, and to admit more readily when it doesn’t know the answer. 
The keyword filter feature works by using Amazon Comprehend to determine the ‘part of speech’ that applies to each word you say to QnABot. 
By default, nouns (including proper nouns), verbs, and interjections are used as ‘keywords’. 
Any answer returned by QnABot must have questions that match these keywords, using the following (default) rule: 

a. Rule 1: if there are 1 or 2 keywords, then all keywords must match.
b. Rule 2: if there are 3 or more keywords, then 75% of the keywords must match.
c. Rule 3: if QnABot can’t find any answers that match these keyword filter rules, then it will admit that it doesn’t know the answer rather than guessing an answer that doesn’t match the keywords.

We will set this setting to “false” (to enable support for Rule 3), as we need to accept free form input of  questions that do not exist in the knowledge bank, and have our Canvas LMS integration figure out the best match.
To support the matching algorithm, we are using a fuzzy string matching python library FuzzyWuzzy --  https://pypi.org/project/fuzzywuzzy/,  and configuring with a matching tolerance score of 70%. 
```
6. Scroll to the bottom of the Settings page and click `Save` button to update the setting.



## Enabling Authentication
As part of the prerequisite setups, we setup the Lex-Web-UI (a companion UI solution for the chatbot) and configured the solution with the QnABot solution. The deployment setup an Amazon Cognito User Pool to support authentication. We will now extend this User Pool to add a test student user and test out the chatbot flow. 

  - Go to your AWS console and navigate to the Amazon Cognito service. 
  - Select `Manage User Pools` and you will find two User Pools have already been setup (via the prerequisite setups earlier). The User Pool we will use is the Lex-Web-UI user pool. 
   - Select the Lex-Web-UI user pool and create a test student user. Also use an `{email address}` as created in the Canvas LMS for the test student user.
```
Note: We are creating the user manually in Amazon Cognito to show this example setup. This manual user creation step should not be needed, if you want to SSO to Canvas LMS. 
  - Additional information on setting up Canvas LMS with SSO: 
https://community.canvaslms.com/t5/Admin-Guide/How-do-I-configure-SSO-settings-for-my-authentication-provider/ta-p/217

In this example, we are using {username} as the matching attribute with {sis_login_id} in Canvas LMS. 
  - Additional information on extending Amazon Cognito to Federate to your Identity provider
https://qnabot.workshop.aws/deployment/sso.html

```


## Import Canvas Questions
In the QnABot Designer, click on the menu link on the top left and select `Import`. 
From the `Examples/Extensions` section, click `Load` for `CanvasLMSIntegration` to load sample Canvas questions. 

## Testing the Experience
Launch the `WebAppUrl` URL as available in the Lex-Web-UI AWS CloudFormation Output and Login to the chatbot from the menu option. Use the test student Canvas LMS credential that you created in the earlier steps to login and test the setup. 

Try the below example questions:
  - Type or speak the below question(s) and see how the chatbot responds back with an answer. 

  - *canvas menu*
  - *do i have any announcements*
  - *tell me about my syllabus*
  - *do I have any assignments due*
  - *what courses have i enrolled in* 


## Notes
- This early example implementation supports English (en_US) language.
- The `MATCHING_TOLERANCE_SCORE` variable in the implementation is currently set to a 70% matching tolerance score. This is used to set the `token_set_ratio` when using the fuzzywuzzy python library (https://pypi.org/project/fuzzywuzzy/). Any matching above this score is used to support the matching logic. This can be changed to a lower or higher value based on your experience on what best meets the matching criteria.

 
## Additional Reference
The following Canvas APIs are being used for this integration: 
  - User Profile — to support authentication, and greeting the user
  - Grades --- student can ask questions such as “how did i do in my Math course”. This supports the overall grade information (out of 100) which is aggregated by course (not by assignments)
  - Course — students can ask questions such as: “what are my assignments for Biology 101”
  - Syllabus — access syllabus information. The output of this is a URL to the syllabus. Student can ask about their syllabus by asking “tell me about my syllabus”
  - Enrollment — students can ask questions such as: “what courses am i enrolled in”, “what courses have i signed up for”
  - Announcements — anything sent by the teacher to student(s) such as: “you have a test coming up”. Student can ask by saying “do I have any announcements”

This integration uses the canvasapi python library to access information from Canvas LMS. https://canvasapi.readthedocs.io/en/stable/getting-started.html


