# Solar Association: Deploying and Customizing a ready made Question and Answer Bot

## Overview:

Welcome to the Solar Association team.

The Solar Association is an association that specializes in providing data about the Sun to universities and research 
institutions around the globe. Recent acquisitions from NASA and the European Space agency have added a wealth of
information to Solar's vast database of Sun facts. The marketing team at Solar Universal has launched a new 
campaign to raise awareness of their information. Recent extreme Sun activity has peaked public curiosity. The 
current call center is overwhelmed and needs an immediate solution to provide quick answers and information about
the Sun.

The team researched the best mechanism to handle this load and have decided on a chatbot embedded in their
existing website. They don't know anything about implementing a chatbot but need to get something running quickly in 
2 hours. 

Your job is to implement Sun facts on your website. 

### Requirements:

* AWS account - if you don't have one, it's easy and free to [create one](https://aws.amazon.com/).
* Amazon developer account - if you don't have one its easy and free to [create one](https://developer.amazon.com).
* AWS IAM account with elevated privileges allowing you to interact with CloudFormation, IAM, S3, Elasticsearch, CloudWatch, Cloud9. [Learn how](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html).
* Familiarity with [NodeJS](https://www.nodejs.org) and [AWS](httpts://aws.amazon.com) - *not required but a bonus*.
* If you want to test out the voice capabilities of the Bot, have a headset with mic available to test with.

### Running the workshop

These steps are designed to be completed in sequence, and the full set of instructions are documented below.  Read and follow along to complete the steps.  
During the workshop, AWS staff will give you a high-level overview of the labs and help answer any questions.  Don't worry if you get stuck, we provide hints along the way.

* **Step 1:** [Deploying your very own QnABot](#step-1---lets-begin-and-deploy-a-working-qnabot)
* **Step 2:** [Manage questions, answers, test the simple bot](#step-2---manage-questions-answers-and-test-using-the-client-ui)
* **Step 3:** [Integrate on your WebSite](#step-3---integrate-qnabot-into-your-website)
* **Step 4:** [Integrate QnABot into an Amazon Connect Call Center](#step-4---integrate-qnabot-into-an-amazon-connect-call-center)
* **Step 5:** [Integrate Alexa](#step-5---integrate-alexa)
* **Step 6:** [Monitor Usage in Kibana](#step-6---monitor-usage-with-kibana)
* **Step 7:** [Customize with Lambda](#step-7---customize-with-lambda)
* **Cleanup** [Put everything away nicely](#workshop-cleanup)

### Conventions:

Throughout this workshop, we will provide commands for you to run.  These commands will look like this:

<pre>
$ aws es list-domain-names
$ aws es describe-elasticsearch-domain --domain-name <b><i>DOMAIN-NAME</i></b>
$ aws lex-models get-bots</b>
</pre>

The command starts after the `$`.  Text that is ***UPPER_ITALIC_BOLD*** indicates a value that is unique to your environment.  
For example, ***DOMAIN-NAME*** refers to the name of an Elasticsearch domain created in your account.  You can find these unique 
values either in the CloudFormation outputs or by navigating to the specific service dashboard in the [AWS management console](https://console.aws.amazon.com).

Tasks or actions that you need to complete will always start with a number 
1) For example, this is an action you should take

### IMPORTANT: Workshop Cleanup

You will be deploying infrastructure on AWS which will have an associated cost. If you're attending an AWS event, credits will be provided.  When you're done with the workshop, [follow the steps at the very end of the instructions](#workshop-cleanup) to make sure everything is cleaned up and avoid unnecessary charges.

* * *

## Step 1 - Let's begin and deploy a working QnABot

### Workshop Setup:

You've found the AWS QnABot open source project and want to test this as a possible vehicle to implement your chatbot.

1) Log into the AWS Management Console using Chrome or Firefox and select **US East (N.Virginia)** for your [AWS region](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html).

    The region dropdown is in the upper right hand corner of the console to the left of the Support dropdown menu.  For this workshop, you will use **N.Virginia**.

2) Launch the [CloudFormation template](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=QnABot&templateURL=http://s3.amazonaws.com/aws-bigdata-blog/artifacts/aws-ai-qna-bot/templates/public.json). 

3) On the Specify Details step of the Create Stack process, enter values for the following fields:

    * **Stack Name** <pre> QnABotWorkshop </pre>
    * **Email** <pre> ***[valid email address]*** </pre>
        * Note: Provide a valid email address you have access to. This field is to used to send an email registering you for 
        access to the QnABot Content Designer. You must have access to this email. Without this it becomes difficult to access the Content Designer
    * **Username** <pre> Admin </pre>

4) Launch the stack. Make sure to select the checkbox next to *"I acknowledge that AWS CloudFormation might create IAM resources with custom names"*.  
    ![CloudFormation acknowledgement](images/00-cf-create.png)

The CloudFormation template will launch the following:

* Elasticsearch Service cluster
* API Gateway
* Amazon Cognito UserPool and related settings
* S3 Buckets to hold the Content Designer web app, Lex-Web-Ui web app, and QnAbot metrics
* An Amazon Lex Bot to handle questions and answers
* Lambda functions support the Content Designer and Lex Fulfillment
* Kibana Dashboard to display usage metrics  
* Kinesis Firehouse used as an alternate mechanism to store metrics in S3
* IAM Roles and Policies to support access to the resources

![CloudFormation Starting Stack](images/00-arch.png)

### Checkpoint:
The CloudFormation stack will take 25 minutes to launch.  Periodically check on the stack creation process in the 
CloudFormation Dashboard. If no stack shows up immediately, click the refresh button at the top right hand corner of 
your screen.  Your stack should show status **CREATE\_COMPLETE** in roughly 25 minutes. 

If there was an [error](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/troubleshooting.html#troubleshooting-errors) during the stack creation process, CloudFormation will rollback and terminate.  You can investigate and troubleshoot by looking in the Events tab.  Any errors encountered during stack creation will appear in the event stream as a failure.

Go ahead and start reading the next section while your stack is being created. Once the stack has been created you can 
explore resources using the AWS console for ElasticSearch, Lex, Lambda, Cognito. 

If you have cli access to your AWS account you can also use the following commands to explore the resources 
being created. Later in Step 3 you'll setup an AWS Cloud9 IDE which you can also use to run these commands.                                           

##### Elasticsearch Service
<pre>
$ aws es list-domain-names
$ aws es describe-elasticsearch-domain --domain-name <b><i>DOMAIN-NAME</i></b>
</pre>

* Note: Use the domain name output from the first command to use as the DOMAIN-NAME in the second command.

##### AWS Lex Bot
<pre>
$ aws lex-models get-bots</b>
</pre>

The prior command will show the Lex Bot that has been created for you.

##### AWS Cognito UserPool
<pre>
$ aws cognito-idp list-user-pools --max-results 5
</pre>

* Note: The --max-results argument could need to be increased based on the number of existing cognito user pools in your account

##### AWS CloudFormation stack outputs
<pre>
$ aws cloudformation list-stacks
$ aws cloudformation describe-stacks --stack-name <b><i>YOURSTACKNAME</i></b>
</pre>

You should also look to see the Outputs from your stack displayed in the Cloud Formation console. 
Notice a number of urls. There are two very important URLs:
* ContentDesignerURL
* ClientURL
* BotName
* DashboardURL

Fore more information on the stack this is launching refer to the AWS QnABot at [QnABot blog post](https://www.amazon.com/qnabot).  

[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)
* * *

## Step 2 - Manage questions, answers, and test using the client ui

### In this step you're going to set your Designer UI admin password, login to the Designer UI, and add some questions and answers

***NOTE: QnABot Stack complete in ~25 minutes after launch.*** Before proceeding make sure the stack is complete.

1) Open the email CloudFormation sent to you. 

2) Click on the link in the email that the CloudFormation stack sent to you. 

3) The user name is <pre>Admin</pre>

4) The password is the temporary password sent to you via email. Copy just the text of the temporary password. 
No spaces in front of or after the password. 

5) After the first login, you will be asked to update the password. The requirements are:
    * 8 characters minimum length
    * Numbers, special character, uppercase and lowercase letters

6) Once logged in, click on "Add" to input a new question. Use a Item Id of 
    <pre>
    sun.1
    </pre>

7) The first question we want the Bot to respond to is 
    <pre>
    Tell me about our Sun
    </pre>
    This represents our most frequently asked question. 

8) The bot needs to answer with <pre>Our sun is 4.6 billion years old. Its considered a yellow dwarf with a diameter of 1,392,684 
kilometers and a circumference of 4,370,005 kilometers. It has a mass that is equal to 333,060 earths and a surface 
temperature of 5,500 degrees celsius. Really Hot!</pre>

9) Once you've added the first question and its answer, naturally you want to test it out. Using the Content Designer UI, 
click on the menu item in the upper left hand corner and select the "QnABot client". 

    A sample web based client will appear. In the chat area type in: <pre>Tell me about the sun</pre> and press enter. You'll see your 
question answered. If you have headsets available, plug these in and click on the mic button. Then speak to the bot
saying:<pre>Tell me about the sun</pre> The Bot should respond with audio as well. 

10) Lets add one more question 

    * Item id: <pre>sun.2</pre>
    * Q: <pre>How old is the Sun?</pre>
    * A: <pre>Our sun is 4.6 billion years old</pre>

11) Test out the second question.  

12) Click on Test to bring up the Test dialog in the Designer UI.

13) Enter a question <pre> How old is the sun </pre>

14) Click on search

Look at the results. Notice the score column. The answer selected by the QnABot will be the answer with highest matching score.

![QnaBot Test Results ](images/02-score.png)


### Checkpoint:

You've now been able to add questions that your bot can respond to. 

Your bot's configuration can be exported using the Designer UI to a json file and downloaded to your system. You can also import a json file
containing QnABot configuration using the Designer.

1) Use 'Export' and once complete then click on the download arrow next to available file.

2) Use 'Import' to the import a configuration file from the following url:

    <pre>
    https://raw.githubusercontent.com/aws-samples/aws-ai-qna-bot/develop/workshops/reinvent2018/samples/sun-questions-qna-step-2.json
    </pre>
 
This file contains a set of preconfigured questions. 

* Note: An import will overwrite existing questions with the same Question ID. 

[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)

* * *

## Step 3 - Integrate QnABot into your website:

### Here's what you're going to work on in step 3: Deploy the Lex-Web-Ui and integrate a snippet of code into an html page.

Solar Association does not yet have a website and you've been tasked to create one. Lets deploy a simple 
website with just two files using Amazon S3 to host the website. The two files will be index.html and solar.png. 

We are going to use the [AWS Cloud9 IDE](https://aws.amazon.com/cloud9/ "Cloud9") to assist us. Perform the 
following to setup a new AWS Cloud9 Environment

#### Cloud9 Setup
   
1) Log into the AWS Console using your AWS Account

2) Set your region to N. Virginia (us-east-1)

2) Navigate to the Cloud9 Service

3) Click on create environment

4) Give this a name and description of <pre>QnABotWorkshop</pre>

5) Click Next step

6) Use the default of Create a new instance for environment (EC2)

7) Use the default of t2.micro

8) Use the default of Cost-saving setting - After 30 minutes (default)

9) Click Next step

10) Click Create environment
   
Your AWS Cloud9 environment will begin to be setup. Once its ready continue with the following.

#### Setup the Web Site

1) From the AWS Cloud9 console open the QnABotWorkshop environment
    * Under getting started select Clone Git Repository
    * In the terminal window that pops up complete the clone command to be
    <pre>
    git clone https://github.com/aws-samples/aws-ai-qna-bot.git
    </pre>

2) Run a script in your Cloud9 IDE that runs CloudFormation to setup an S3 bucket to host the website and uploads the two files

    <pre>
    cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/scripts
    ./setupwebsite.sh
    </pre>

    You'll see output similar to
    
    <pre>
    
    Waiting for changeset to be created..
    Waiting for stack create/update to complete
    Successfully created/updated stack - qnabotworkshop-website
    
    S3 Bucket: 
    qnabotworkshop-website-s3bucket-1aty4rnkfi6x0
    
    Website Url:
    https://qnabotworkshop-website-s3bucket-1aty4rnkfi6x0.s3.amazonaws.com/index.html
    
    upload: ../web/index.html to s3://qnabotworkshop-website-s3bucket-1aty4rnkfi6x0/index.html
    upload: ../web/solar.png to s3://qnabotworkshop-website-s3bucket-1aty4rnkfi6x0/solar.png
    </pre>

    * Note the Website Url. You can open this by clicking on the link from the IDE. Great. You should now see artwork 
representing the Sun. 

3) Record the URI to your website reported above. For example:
    
    ```
    https://qnabotworkshop-website-s3bucket-1aty4rnkfi6x0.s3.amazonaws.com
    ```

    This value will be used for ***WebAppParentOrigin*** when configuring the Lex-Web-Ui. 

4) Record the name of the Lex bot created in Workshop Step 1 to use as input to the next
    CloudFormation template. In your Cloud9 IDE run
    <pre>
    aws lex-models get-bots
    </pre>
    
    Look for a name similar to the stack name you used to create the QnABot. You can always find 
    the name of the Bot using CloudFormation in the outputs section for the stack you created in Step 1.

5) Deploy the lex-web-ui

    1) Launch the [lex-web-ui](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/new?stackName=lex-web-ui&templateURL=https://s3.amazonaws.com/aws-bigdata-blog/artifacts/aws-lex-web-ui/artifacts/templates/master.yaml "Lex Web Ui") stack 
    2) Leave parameters defaulted except for 
        * Stack name <pre>lex-web-ui-qnabot-workshop </pre>
        * CodeBuildName <pre>lex-web-ui-qnaabot-workshop </pre>
        * BotName <pre> **The botname obtained from AWS Console or from command line aws lexmodels get-bots**</pre>
        * WebAppParentOrigin <pre> **URI** of the website you created previously </pre>
            * Note: The **URI** ends with .com and does not include the path /index.html
            
        * WebAppConfBotInitialText <pre> You can ask me for information on the Sun. Just type questions for me or click on the mic and ask me.</pre>
        * WebAppConfBotInitialSpeech <pre> Ask me questions about the Sun </pre>
        * WebAppConfToolbarTitle <pre> Sun Info </pre>
    3) Create the stack

    A new stack will launch which you can see in the CloudFormation console. This will take four or five minutes to 
    finish. When its done, use the AWS Console to take a look at the stack Outputs
    
    * WebAppUrl
    * SnippetUrl
    
    These outputs provide links to web pages that provide access to the chat bot.
    
    ***WebAppUrl*** provides a sample fullpage view of the chat bot. Click on this link and try 
    out chatting as well. 
    
    ***SnippetUrl*** provides the crucial code that we'll put into our simple website. 
    
6) Click on the SnippetUrl. You should see a snippet area that looks like the following.
    ```
        <script src="[YOUR-HOSTNAME]/lex-web-ui-loader.min.js"></script>
        <script>
          var loaderOpts = {
            baseUrl: 'https://lex-web-ui-qna-workshop-codebuilddep-webappbucket-6x7u4dwjv673.s3.amazonaws.com/'
          };
          var loader = new ChatBotUiLoader.IframeLoader(loaderOpts);
          loader.load()
            .catch(function (error) { console.error(error); });
        </script>
    ```    
7) Copy the contents returned by your snippet url into your clipboard

8) In the Cloud9 IDE open 
    ```
    QnaBotWorkshop/aws-ai-qna-bot/workshops/reinvent2018/web/index.html 
    ```

9) Paste your clipboard into index.html just below the '\<body\>' tag

10) Save the modified file
    * Note, ignore the Cloud9 IDE warning 'ChatBotUiLoader is not defined'. It is defined in the referenced javascript.

11) From a terminal window in Cloud9 IDE make sure you cd to the 
    ```
    cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/scripts
    ```

12) Then in the terminal run

    <pre>
    ./setupwebsite.sh
    </pre>

    This will push the changes made to index.html up to S3 hosting the website.
    
13) Open or Refresh the solar web page. You will now have embedded the open source lex-web-ui
on the Solar Association web site. Try chatting again and asking the bot questions.

![Web Integration](images/Lab3-web-001.png "Web Example")

### Improving the look and feel of your bot

The QnABot in conjunction with the lex web ui support some advanced features that will help 
to improve look and feel as well as provide assisted navigation.  

#### Markdown

1) Edit a question in your QnABot using the Designer. Select Advanced. Scroll down until you 
see Alternate Answers / Markdown. Add markdown to your answer
    <pre>
    
        # For H1
        
        ## For H2
        
        *Italic Characters*
    </pre>

2) You can also generate simple tables to display. Try adding markdown to one of your questions and go 
back to the solar associations web page to try it out. 
    <pre>
    ## Some facts 
    |Property             | Value              | 
    |:--------------------|-------------------:|
    | Age                 | 4.6 Billion Years  |
    | Type                | Yellow Dwarf (G2V) |
    | Diameter            | 1,392,684 km       |
    | Surface Temperature | 5,500 °C           |
    </pre>

3) Add a link using markdown into the Alternate Answers Markdown field
    <pre>
    [NASA](https://www.nasa.gov) 
    </pre>
    
#### Response Card and Buttons

Response cards are a great way to augment a response. You might want to display an
image to a user on an Echo Show or on the web site, or perhaps you'd like to display buttons 
to help the user navigate easily.

1) Edit a question in the Designer, click on Advanced, and scroll down to Response Card. 

2) Provide a title. It is a required field. 

    <pre>
    Suggestions
    </pre>
    * Note: the Lex Web UI can be configured to always hide the title. This is a parameter
    available in the Cloud Formation template. Sometimes hiding the title improves
    the appearance. If you do hide titles, use the Response Card subtitle to take 
    the place of the title. It will always be rendered. 

3) Add an image link
    <pre>
    https://3c1703fe8d.site.internapcdn.net/newman/gfx/news/hires/2018/imagethesunt.jpg
    </pre>

4) Add a button for the response card

    * Buttons are a great way to help the user navigate the chatbot. You can provide the user 
    with the next response they might want to give. For directional flows you can also 
    provide a number of different items they want to select next. 

    * Each button can be configured with the text to display in the button and the value that
    will be sent back to Lex if the button is clicked. 
    
5) Click on update once the changes have been made and then close once the update is successful.

6) Go back to the solar web page and type in the question you have been editing to see the 
photo response.

### Load in pre-configured questions for the end of Step 3
Use 'Import' to the import a configuration file from the following url:

```
https://raw.githubusercontent.com/aws-samples/aws-ai-qna-bot/develop/workshops/reinvent2018/samples/sun-questions-qna-step-3.json
```
 
This file contains the questions preconfigured for the step. 

* Note: An import will overwrite existing questions with the same Question ID. 

### Quiz

Outside of the workshop you can implement simple multiple choice quiz using the quiz functionality. See the 
[Questionnaire Blog Post.](https://aws.amazon.com/blogs/machine-learning/create-a-questionnaire-bot-with-amazon-lex-and-amazon-alexa/ "Quiz")

### Guided navigation

Outside of the workshopu you can implement a tour / guided navigation. See the 
[Guided navigation Blog Post.](https://aws.amazon.com/blogs/machine-learning/creating-virtual-guided-navigation-using-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/ "Guided")

### Checkpoint:

At this point you should be comfortable with embedding the qnabot on your website using
the lex-web-ui. You should also be comfortable improving the experience of the bot
using the advanced configuration features such as markdown, response cards with images,
and buttons. 

[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)
* * *

## Step 4 - Integrate QnABot into an Amazon Connect call center

### Here's what you're going to work on in step 4: Create an Amazon Connect call center and wire in the QnABot bot.  
  
1) Open Connect [console:](https://console.aws.amazon.com/connect)  

    ![Lab4-connect-001](images/Lab4-connect-001.png)

2) Add an instance - I used 'qnabot' as the name, but you will have to use a globally unique name, e.g.: qnabot-<yourname>:  

    ![Lab4-connect-002](images/Lab4-connect-002.png)

3) Skip the 'create new administrator' step - we can always get to administrative functions from AWS console.  
  
    ![Lab4-connect-003](images/Lab4-connect-003.png)
  
4) Choose to handle incoming calls with Amazon Connect  
  
    ![Lab4-connect-004](images/Lab4-connect-004.png)  
  
5) Accept defaults for Data Storage, and choose 'Create Instance' on the Review and Create page:  
  
    ![Lab4-connect-005](images/Lab4-connect-005.png)
  
6) When the Success screen comes up, choose "Get Started"  
  
    ![Lab4-connect-006](images/Lab4-connect-006.png)  
  
7) And "Let's Go!"  
  
    ![Lab4-connect-007](images/Lab4-connect-007.png)
  
8) Claim a phone number.. Choose 'United States', 'Direct Dial' or 'Toll Free', and select a number from the list offered. Then 'Next':  
  
    ![Lab4-connect-008](images/Lab4-connect-008.png)
  
9) Play with the default call center as suggested. Or just choose 'Continue' to get on with integrating QnABot.  
  
    ![Lab4-connect-009](images/Lab4-connect-009.png)
  

10) Now we must make the QnABot accessible to our new call center. Open the Amazon Connect console in a new tab (https://console.aws.amazon.com/connect), select our new call center, choose "Contact Flows" and add the QnABot Lex bot.

    ![Lab4-connect-010](images/Lab4-connect-020.png)
  
11) Go back to the call center admin page. From the Dashboard view, select 'Contact flows':  
  
    ![Lab4-connect-010](images/Lab4-connect-010.png)
  
12) then 'Create contact flow'  
  
    ![Lab4-connect-011](images/Lab4-connect-011.png)
  
13) Enter contact flow name, eg: "QnaBot"  
  
    ![Lab4-connect-012](images/Lab4-connect-012.png)
  
14) Open the 'Interact' folder, and drag 'Get customer input' widget to the canvas:  
  
    ![Lab4-connect-014a](images/Lab4-connect-014a.png)
  
15) Click on the 'Get customer input' widget to open its property pane. Enter a 'text to speech' prompt, eg "Hi, I'm Q and A bot. Ask me a question."  
  
    ![Lab4-connect-013](images/Lab4-connect-013.png)
  
16) Scroll down a bit, and enter the name of the QnABot Lex bot (Hint - go to the AWS CloudFormation Outputs tab to find the `BotName` value, and copy/paste to here.  Enter `$LATEST` as the Alias.  
  
    ![Lab4-connect-014](images/Lab4-connect-014.png)
  
17) Add a "Disconnect / hang up" widget and connect the widgets as shown. Select 'Save and Publish"  
  
    ![Lab4-connect-016](images/Lab4-connect-016.png)
  
18) Go to "Routing"→"Phone numbers":  
  
    ![Lab4-connect-017](images/Lab4-connect-017.png)
  
19) Choose the phone number to open the Edit Phone number form. Select the "QnABot" contact flow that we just created, and choose 'Save".  
  
    ![Lab4-connect-018](images/Lab4-connect-018.png)
  
  
20) Try it now... Call the phone number for your new call center, and ask QnABot a question (ideally a question that you already entered into the Designer!)  
    * Note - It takes a little bit of time before the new contact flow is ready. If you
    get the default contact flow, wait 30 seconds or so and try again.  
  
### Checkpoint:

Solar Association now has a phone number that can be used to answer questions configured
into the bot. Yay. Cross that off the list. 
  
[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)
* * *
  
## Step 5 - Integrate Alexa

### Here's what you're going to work on in step 5: Implement your new QnA bot as an Alexa skill.  
  
QnABot also works with Alexa, allowing your users to get answers from your content via any Alexa enabled device, including Amazon FireTV, Amazon Dash Wand, and any of the Amazon Echo family of devices.
  
1) To enable Alexa, first create an Alexa skill for QnABot using the Amazon Developer Console. QnABot can’t automatically create the Alexa skill at this time, so we’ve provided instructions. Log in to the QnABot Content Designer (as explained earlier), and choose Alexa from the tools menu ( ☰ ):  

    ![Lab5-alexa-001](images/Lab5-alexa-001.png)
  

### Checkpoint:

Cool. Now you can ask Sun questions using your Alexa Skill and keep these easily updated.

[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)

* * *
  
## Step 6 - Monitor Usage with Kibana:

### Here's what you're going to work on in step 6: 
* Enable Feedback in QnaBot - By default feedback is not enabled in QnABot. This step will
  walk you through enabling the standard Feedback mechanism.
* Use a preconfigured Kibana deployment to find out what your users have been up to with respect to your 
  chat bot.
  
### Enable Feedback
1) Log into the Designer UI
2) Pull down the upper left menu and select Import from the upper left
3) Expand the Examples/Demos at the bottom
4) Click on the load button across from 'feedback'
5) Wait for the load of feedback.json to complete (should be very quick).
   You'll see a new question id of Feedback with questions like 'that is wrong' and 'that is right'
6) Rebuild the Lex bot so that it understands responses such as 'that is right'
    1) Use the menu on the right hand side of the Designer UI
    2) Select the "three vertical dots"
    3) From the pull down, select Lex Rebuild. This will take all the known questions and add these to the Lex Bot and then
       rebuild the bot.

7) Once this process is complete, after asking a question and getting an answer,
 users can give feedback to the system by saying or typing 'leave feedback', or 'that is right', or 
'that is wrong'. This feedback will be seen in the Kibana dashboard. 

8) Try the following from your chat bot web client
```
How hot is the sun
```
Then chat with
```
leave feedback
```
Finally pick option A
```
A
```

Ask another question and leave feedback once more.
```
How hot is mars
```
```
leave feedback
```
```
B
```

The above steps will will prime the system with some feedback to
display in Kibana.

### Launch Kibana
1) Log into the Designer UI
2) Pull down the upper left menu and select select Kibana Dashboard
3) Once Kibana appears for the first time select Dashboard on the left
4) Next click on Open
5) Select the 'Default'

    ![Lab6-Monitor-001](images/Lab6-Monitor-001.png "Kibana")

### Standard Dashboard
* Requests
* Client types
* Frequent utterances (tag cloud)
* Answers with positive or negative feedback (needs to be enabled in the Designer UI)

### Build a query that finds all utterances that did not resolve to a question

1) See if you can build a query in Kibana that finds utterances a user made that did not
match any question?

    * In Kibana, click on Discover
    ![Lab6-Monitor-002](images/Lab6-Monitor-002.png "Discover")
    * Switch to the qnametrics index
    ![Lab6-Monitor-003](images/Lab6-Monitor-003.png "qnametrics")
    * In the query area enter 
    <pre>
    !(_exists_:"qid")
    </pre>
    Add utterance as a selected field
    ![Lab6-Monitor-004](images/Lab6-Monitor-004.png "qnametrics")
    * Note: Any document in the metrics index that does not have a qid did not match a question in
elastic search. 

    * Note: Sometimes Lex does not always pass utterances to the bot. 

        The message __Sorry, I did not understand that__ is due to Lex not matching an 
        intent to send this to. In qnabot there is one intent. Hence this message means that Lex
        did not understand enough about the request to the qnabot. 

        The message __You stumped me! Sadly I don't know how to answer your question.__ comes from qnabot. 
        You should find the utterances of this sort captured in the Kibana query above. 


### Experiment with other queries

Try implementing other Kibana queries using the fields available in the metrics index. 


### Checkpoint:

You learned how to enable feedback, you learned how to use Kibana to see how users are exercising 
your bot and how to look for questions that the system is not matching against. 

[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)

* * *

## Step 7 - Customize with Lambda:

### Here's what you're going to work on in step 7:

Solar Association wants to provide quick access to Solar Flare information. In particular
the Association wants to let users know when the last solar flare events were detected. For this workshop,
implement two adjustments to your questions. 

* Add to any answer if a Solar flare has been detected in the last 30 days. 

* Add a new question, 'When were the last solar flares detected?' 

To do this we are going to use a public api from [NASA API](https://api.nasa.gov/index.html "NASA API") named [DONKI](https://api.nasa.gov/api.html#DONKI "NASA API")
to obtain information on Solar Flares.


[NASA API Example](https://api.nasa.gov/DONKI/FLR?startDate=2017-01-01&endDate=2018-12-30&api_key=DEMO_KEY "Example call")

The API takes two parameters, startDate and endDate. endDate defaults to current UTC Time 
so we can leave this empty unless we want to provide a question and answer for a specific
time range.  

* Note: This API uses a DEMO_KEY and limits the caller to 30 requests per hour for a given IP Address.

The challenge is to write a NodeJS based (or python or your favorite Lambda supported language)
that calls this api and augments an answer with whether a solar flare has occurred in the past
30 days. We've provided a default implementation in NodeJS.

The Lambda hook should also generate a response that lists the time the last several
solar flares were detected using a markdown table format.  

### Lambda Hook Setup

1) Using the Cloud9 IDE, setup the lambda function by deploying a preconfigured CloudFormation template using sam

    ```$xslt
    cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/code/solarflare
    npm install
    cd ../../scripts
    ./solarflare-setup.sh
    ./solarflare-pkg.sh
    ./solarflare-deploy.sh
    ```
    * Note: This function is defined in templates/solarflare-master.yaml. The solarflare-pkg.sh and solarflare-deploy.sh
    builds and uploads code for a Lambda function that will start with the name 'qna-'.
    
### Lambda Hook Inputs and Return structure

The event object passed to the Lambda has two properties:

* event.req the normalized request object
* event.res the normalized response object (edit this to change the response)

The Lambda handler must return the modified event object. The general sections to modify are shown below.

### Looking at the provided source code

1) In your Cloud9 IDE open the file <pre>QnaBotWorkshop/aws-ai-qna-bot/workshops/reinvent2018/code/solarflare/app.js</pre>

2) You'll see four TODO areas that you'll need to replace. You can write your own code or use the
code provided below.
  

#### TODO 1 Calling the NASA API after setting up the parameters used in the url. Log the output if debug is enabled.
<pre>
    debug("Calling via axios");
    const finalUrl = baseurl + '?startDate=2017-01-01' + '&api_key=' + process.env.api_key;
    let res = await axios(finalUrl, axiosConfig);
    debug("RESPONSE RECEIVED: ", JSON.stringify(res.data, null, 2));
</pre>

#### TODO 2 Check for the existence of an argument that indicates how many recent solar flares should be returned
<pre>
    // if lambdahook argument requests last solar flares, walk the returned flares up to
    // count provided adding to output using markdown
    let recentCount = 0;
    if (event.res.result.args &&
      event.res.result.args.length > 0 &&
      event.res.result.args[0] &&
      event.res.result.args[0].length > 0) {
      recentCount = parseInt(event.res.result.args[0]);
    }
</pre>    

#### TODO 3 Return markdown based on the API results if an argument was passed indicating how many recent solar flares to return

<pre>
    if (recentCount > 0) {
      //walk the return data and provide dates for the requested number of solar flares
      let cnt = 0;
      if (res.data.length > 0) {
        let messageMarkDown = '';
        let plainMessage = '';
        let ssmlMessage = '';
        for (let i = res.data.length - 1; i >= 0 && cnt < recentCount; i--) {
          const t = moment(res.data[i].beginTime);
          messageMarkDown += "\n* " + t.format('MM-DD-YYYY');
          plainMessage += "\n" + t.format('MM-DD-YYYY');
          if (cnt+1 === recentCount || i === 1) {
            ssmlMessage +=', and '+ t.format('MM-DD-YYYY');
          } else {
            ssmlMessage +=', '+ t.format('MM-DD-YYYY');
          }
          cnt++;
        }

        // for markdown using lex-web-ui specific attribute
        event.res.session.appContext.altMessages.markdown= messageMarkDown;
        
        // for Alex and lex-web-ui set message and tyhpe to SSML
        ssmlMessage = '<speak>' + ssmlMessage + '</speak>';
        event.res.message = ssmlMessage;
        event.res.type = 'SSML';
        
        // always include a plainMessage for fallback / Alexa Show
        event.res.plainMessage = plainMessage;
      }
    } else {
</pre>

#### TODO 4 - Else no augment was passed. Just update the message with an alert if a solar flare has been detected in the last 30 days

<pre>
      // check dates for recent solar flares.
      let recentFlares = false;
      let recentFlaresEventTime = '';

      let oneMonthAgo = moment().subtract(30, 'days');
      debug('computed month ago: ' + oneMonthAgo);
      res.data.forEach((o) => {
        debug(`reported event time: ${o.beginime}`);
        let beginTime = moment(o.beginTime);
        debug('parsed beginTime: ' + beginTime);
        if (beginTime > oneMonthAgo) {
          recentFlares = true;
          recentFlaresEventTime = o.beginTime;
        }
      });
      if (recentFlares) {
        debug('recent flares detected');
        event.res.message += ' Alert. Recent Solar Flare has been reported on ' + recentFlaresEventTime;
      } else {
        debug('recent flares not reported in the last 30 days');
      }
    }
</pre>
    
###  Test your code for valid syntax

1) Make sure your nodejs version is version 8.12.0 and sam are available
<pre>
cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/scripts
source ./update-nodejs-version.sh
</pre>

2) Run tests to validate syntax

<pre>
cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/code/solarflare
npm test
</pre>

If the tests are successful, continue with the next section to redeploy your function. 

* Note: the full solution is available in app-solution.js. You can copy this over app.js if needed

### Redeploy the code changes you just made

1) Execute the following commands to redeploy the updated function.

<pre>
cd ~/environment/aws-ai-qna-bot/workshops/reinvent2018/scripts
./solarflare-pkg.sh
./solarflare-deploy.sh
</pre>

* Note: Copy the Function ARN reported by solarflare-deploy.sh. You'll use this value to configure the Lambda hooks.

Once your package is redeployed the next step will be to add the Lambda hook to existing questions and add a new
question.

### Adding the Lambda Hook to existing questions

1) Edit any question

2) Click on advanced and find the Lambda section

3) Paste the ARN of the function as the ARN of the Lambda hook

4) Save and update the question

4) Use the Lex-Web-Ui to ask the question you just modified.
    * Note - The last solar flare to occur was back in May 2018. The function alerts only if one occurred 
    during the last 30 days. No difference in output will be detected. 

5) Verify the function executed in CloudWatch logs
    * Note - You can check in CloudWatch logs to see that the NASA API was called and responded correctly. 

### Adding the Lambda Hook to the new question

1) Add a new question with multiple ways of asking the question
    Item Id: <pre>sun.8</pre>
    Questions:
    <pre>
    When did the last solar flare occur?
    Tell me when the last solar flares occured?
    How recent were the last solar flares?
    Have solar flares occurred recently?
    </pre>
    Answer:
    <pre> We had problems looking this up - in normal process this text will be replaced </pre>

2) Click on Advanced and scroll down to the Lambda section

3) Paste the ARN of the function you copied earlier as the ARN of the Lambda hook.

4) Fill the Argument with a value of 3

4) Use the Lex-Web-Ui to ask the question you just added

5) Verify the function executed in CloudWatch logs

6) Verify the output contains a table withe 3 rows in the markdown

### Checkpoint:

If you have succeeded with this step you now have a functioning lambda hook that can be added to existing questions.
Once added to a question, the function will execute each time the question is selected as the response to the 
user.

If no arguments are supplied, the function will check for flares that might have occurred in the last 30 days and 
report an incident.

If an argument (N) is supplied as an integer, the function will return N most recent solar flare dates. 


### If desired, load in pre-configured questions with Lambda support for the end of Step 7

Use 'Import' to the import a configuration file from the following url:

    <pre>
    https://raw.githubusercontent.com/aws-samples/aws-ai-qna-bot/develop/workshops/reinvent2018/samples/sun-questions-qna-step-7.json
    </pre>
 
This file contains the questions preconfigured for the step. 

* Note 1: An import will overwrite existing questions with the same Question ID. 

* Note 2: Two questions reference lambda functions. You need to update the ARN of these functions
after importing the sample file with the ARN of the function you have created in step 7. The question
ids to update are sun.8 and sun.2.

* * *


[*^ back to top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)

* * *
## Finished! Please fill out evaluation cards!

Congratulations on completing the labs, or at least giving it a good go.  Thanks for helping Solar Universal publish a chatbot and reduce the load on its call center! 

* * *

## Workshop Cleanup

This is really important because if you leave stuff running in your account, it will continue to generate charges.  Certain things were created by CloudFormation and certain things were created manually throughout the workshop.  Follow the steps below to make sure you clean up properly.

Delete manually created resources throughout the laUbs:

* Use your AWS Cloud9 IDE's terminal to remove the sample web site
```
cd aws-ai-qna-bot/workshops/reinvent2018/bin
./removewebsite.sh
```
* Use the AWS Cloud9 Dashboard to Delete your development environment

* Use the Amazon Connect console to delete your call center instance

Finally, [delete the CloudFormation stacks](http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html) launched at the beginning of the workshop to clean up the rest.  If the stack deletion process encountered errors, look at the Events tab in the CloudFormation dashboard, and you'll see what steps failed.  It might just be a case where you need to clean up a manually created asset that is tied to a resource goverened by CloudFormation.
* Use the AWS CloudFormation console to delete the QnABot stacks you launched
  * lex-web-ui
  * qnabotworkshop
  
[*^ back to the top*](#solar-association-deploying-and-customizing-a-ready-made-question-and-answer-bot)
