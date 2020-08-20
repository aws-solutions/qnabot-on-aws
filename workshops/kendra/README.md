# Kendra Integration



## Section 1: Kendra FAQ

### Simple example

QnABot now offers a new machine-learning based query method based on Amazon Kendra to improve question-matching accuracies and reduce the tuning workload. Let's try a simple example to illustrate the concept:

#### Part 1: See the limitations of ElasticSearch

1. Add the following question to your designer console:

    QID: econ.1
  
    Question: "What are the main goals of an economy?" 
  
    Answer: "All economies in the world try to achieve 3 things: Growth, High employment"
    
2. Try this question out in the QnABot client. 
3. Then, try out a different phrasing: "What main objectives do economies try to achieve?" 

You'll find that the ElasticSearch based QnABot does not know that these two questions mean the same thing. We're going to see how Amazon Kendra can address this limitation.

#### Part 2: Create an Amazon Kendra index

1. Go to [Amazon Kendra](http://console.aws.amazon.com/kendra) and click on **Create Index** in the top right corner.
2. Provide an *Index name* and optional *Description*.
3. Choose the recommended *Create a new role* for the IAM role and provide a name like *explore-qnabot*.
4. Press **Next**. Decide if you want the Enterprise or Developer edition. 

    Kendra's Free Tier of usage provides the Developer edition for free usage of up to 750 hours for the first 30 days. Both editions have a query rate that is strictly enforced at 0.5 queries/second. The Enterprise edition provides the option to increase this limit for additional cost. The Developer edition cannot increase query capacity. For more information on pricing details, go to [https://aws.amazon.com/kendra/pricing/](https://aws.amazon.com/kendra/pricing/).
  
5. **Create** the index and wait for it to become active. **Note that this takes about ~30 minutes to complete**.


#### Part 3: Set up KendraFAQ in Designer Console

1. Log in to the Content Designer, and go to settings. Scroll down until you see the field *KENDRA_FAQ_INDEX*.
2. Enter your Kendra index ID copied from the Kendra console.

<img src="./kendra_console_readme.png?raw=true" width="250" height="300">

3. Save the settings and return to the home page of the web interface.
4. Choose the top right edit card menu (⋮) to open up a drop-down menu. Press **Sync Kendra FAQ**.

<img src="./sync_kendra_faq_menu.png?raw=true" width="200" height="200">

5. Wait until your designer console finishes syncing to the Kendra index. **This may take a couple minutes.**
6. When it shows the *Sync Complete* status, you can go to your QnABot index in the Kendra console and check the FAQs tab to see a newly created (or updated) `qna-facts` FAQ. You will need to sync your questions to a Kendra FAQ each time you update the content in your designer console.
7. Go back into the QnABot client and try out the new phrasing again: "What main objectives do economies try to achieve?"

You'll see that with Kendra-based question matching, the QnABot can understand variations in human language better! Amazon Kendra is an enterprise search service powered by machine learning and natural language processing. This means that it can apply different semantic meanings over the terms in a user’s question to better understand the meaning of complex human language, and identify better answers. With Amazon Kendra, QnABot is able to comprehend that these two question phrasings mean the same thing.


### Supported features
QnABot supports the following features with its Amazon Kendra alternative implementation. If a feature is only supported on ElasticSearch, then QnABot will default to using the ElasticSearch query method instead. If a question does not find any matches through the Kendra FAQ method, this integration provides an optional ElasticSearch fallback (ES Fallback).

|Feature                                                  | Supported                                                               |
|---------------------------------------------------------|-------------------------------------------------------------------------|
|Adding images to answer                                  | YES                                                                     |
|Using SSML to control speech synthesis                   | YES                                                                     |
|Adding Markdown to style rich text answers on web UI     | YES                                                                     |
|Using variables and conditional content, with Handlebars | YES                                                                     |
|Displaying buttons on the web UI                         | YES                                                                     |
|Using Topics to support follow-up questions              | NO. Supported only on ElasticSearch                                     |
|Adding style to QnABot                                   | YES                                                                     |
|Extending QnABot with lambda hook functions              | YES                                                                     |
|Keyword filters and custom "Don't know" answers          | Supported via optional ES Fallback                                      |
|Tuning, testing, and troubleshooting                     | YES                                                                     |
|Exporting and importing answers                          | YES                                                                     |
|Modifying configuration settings                         | YES                                                                     |
|Document serach with Amazon Kendra as a fallback engine  | YES                                                                     |
|Supporting multiple languages                            | YES                                                                     |
|Configuring QnABot to ask the questions                  | YES                                                                     |
|Automatically advancing along a tree of questions        | YES                                                                     |
|Using QnABot in a call center or with SMS text messaging | YES                                                                     |
|FuzzyMatching (spelling errors)                          | NO. Supported only on ElasticSearch                                     |
|QID querying                                             | NO. Supported only on ElasticSearch                                     |


### Details about the Kendra FAQ integration
The Kendra integration is currently a Beta feature for you to try. As the Kendra service develops frameworks to support similar use cases, its capabilities will continue changing. For this reason, here we document the limitations and current functions here.

**Query Throttling Rates**
- Kendra by default throttles queries to a rate of 1 query every 2 seconds on average. The Kendra Enterprise indexes allow you to purchase addition query units to increase the throughput. For additional information on adjusting query capacity, see [https://docs.aws.amazon.com/kendra/latest/dg/adjusting-capacity.html](https://docs.aws.amazon.com/kendra/latest/dg/adjusting-capacity.html).
- If there are many simultaneous users on QnABot at a time, expect there to be significant latency or even failure to execute Kendra queries. The current implementation is optimized to support 10 concurrent users where each user will wait a maximum of 4.5 seconds before receiving a response to their question. 
- To optimize your QnABot for different numbers of users or use cases, see the fields `KENDRA_FAQ_MAX_RETRIES` and `KENDRA_FAQ_CONFIG_RETRY_DELAY`. They deal with Kendra's in-built exponential delay and retry function in the case that a query times out or is blocked due to too many other simultaneous queries. The first setting sets the maximum number of retries, and the second sets the base number of milliseconds that Kendra delays before retrying a query.

**One-word Questions, Topics, QID Querying**
- Kendra FAQ currently performs poorly when trying to match a question with only 1 term in it, such as 'help' or 'hello'. For this reason, adding Style and other one-word Custom Don't Know Answers are supported via the optional ElasticSearch fallback engine.
- Similarly with Topics and QID querying, Kendra does not currently support them and QnABot defaults to ElasticSearch to identify an answer.

### Additional Question-Matching Examples  
These are addional example questions where the new phrasing fails to find a match using ElasticSearch, but succeeds with the Kendra integration.

QID: solar.1
- Question: How old is the sun?
- Answer: Our sun is 4.6 billion years old.
- New phrasing: What is the age of the sun?

QID: bus.1
- Question: What are the main functions of management?
- Answer: There are 4 main functions of management: planning, organizing, directing, and controlling.
- New phrasing: What main operations does management fulfill?



## Section 2: Kendra Fallback Search

### Simple example

QnABot now offers a new machine-learning based query method based on Amazon Kendra to improve question-matching accuracies and reduce the tuning workload. Let's try a simple example to illustrate the concept:

#### Part 1: See the limitations of FAQ question-matching
What if you want to ask the QnABot a question that is not present in the FAQs but may be in related documents? This feature enables Kendra to perform a search on any uploaded content (e.g., PDFs, PowerPoint presentations, etc.) and retrieve those results in QnABot.

#### Part 2: Add content to a Kendra index
1. **THIS ASSUMES YOU HAVE COMPLETED PART 2 OF SECTION 1 (Create an Amazon Kendra index). If not, go back and complete those steps.**
2. Create an S3 bucket and allow objects to be public read.

    a. In the S3 console, click on **Create bucket** and entire a *Bucket name* such as qnabot-docs. Press **Next** until you get to *Set permissions* (Step 3).

    b. **Uncheck** the box which states *Block all public access* and then mark the checkbox to acknowledge the statement.
    
    c. Press **Next** until you **Create** the bucket.
    
    d. **Upload** these PDFs into your new S3 bucket. Ensure that the objects are public read.
    
    - [solar_mysteries_book.pdf](./solar_mysteries_book.pdf)

    - [sun_lithograph.pdf](./sun_lithograph.pdf)

3. Go to the Kendra console and select your index. Click on the **Step 2. Add data sources** button and select the Amazon S3 Connector.

<img src="./kendra_add_datasource.png?raw=true" width="650" height="300">

4. Name your data source (e.g., *qnabot-content*) and press **Next**.
5. Browse for your S3 bucket to enter its location.
6. Choose the recommended *Create new role* for the IAM role and provide a name like *kendra-s3-qnabot-access*.

<img src="./kendra_role.png?raw=true" width="700" height="150">

7. You can choose how freqeuntly to sync this data source with the Kendra index. If you will be updating content frequently, perhaps select a periodic option. Else, go with our *Run on demand* default.

<img src="./kendra_sync_schedule.png?raw=true" width="500" height="150">

8. **Create** the data source. **This may take a couple minutes.**
9. Once the data source has been created, press on **Sync now** to sync the uploaded materials into the Kendra index. **This will take ~30 minutes**.

<img src="./kendra_sync_datasource.png?raw=true" width="600" height="300">


#### Part 3: Set up KendraFallback in Designer Console

1. Log in to the Content Designer, and go to settings. Scroll down until you see the field *ALT_SEARCH_KENDRA_INDEXES*.
2. Enter your Kendra index ID copied from the Kendra console. You can provide a list of Kendra indices if you have data sources in multiple Kendra locations. If you have multiple, make sure to list them in an array of strings like this: ```["a672e3a2-nnnn-nnnn-do-not-copy", "4a0266cb-7760-do-not-copy"]```

<img src="./kendra_console_readme.png?raw=true" width="250" height="300">

3. Save the settings and return to the home page of the web interface.
4. Go to the **Import** tool from the designer console and open the drop down Examples/Extensions menu.
5. Load the KendraFallback extension and wait for it to complete. Return to the home page of the designer console. This loads a new question with a QID of "KendraFallback".
6. Edit this question in the Designer and change its question text from "no_hits_alternative" to your current ES_NO_HITS_QUESTION (most likely it will be "no_hits") and save the changes. You can find this phrase in your settings parameters.
7. If you have previously loaded the QnAUtility.json from Examples/Extensions you need to either remove the question with the ID "CustomNoMatches" or change the question for this ID from your current ES_NO_HITS_QUESTION (e.g. "no_hits") to "no_hits_alt".

<img src="./no_hits_question.png?raw=true" width="1000" height="150">

  Once the new question, "KendraFallback" is configured as the response for "no_hits", the Kendra index will be searched for an answer whenever a curated answer can not be found. Once setup, Kendra provides a fallback mechanism prior to telling the user an answer could not be found.

8. Go back into the QnABot client and try out some questions about the sun!

### Example questions
There are a couple different types of responses from the KendraFallback engine. 

**Top answer**
For some queries, Kendra is able to find an answer in the uploaded documents with a very high confidence and yields a 'top answer' phrase. QnABot takes the Kendra results and shortens its response to only contain this phrase and the source link. 

For example, ask QnABot **"When did Galileo first see sunspots?"** or **"How many regions does the sun have?"** and take a look at the concise response returned. 

If you are interacting through a voice channel (such as an Echo or via the microphone on the bottom right of the web interface), QnABot will speak this shortened answer instead of the full text extract that it was retrieved from.

**Most relevant phrases with document search**
In other cases, QnABot is able to find a text excerpt that most closely answers the question and it highlights the most relevant phrases of this response. This is returned along with other top results and their source links, enabling QnABot to act like a search engine over the uploaded documents.

Try asking **"What is the composition of the sun?"** to see how QnABot selectively highlights the most important elements of a text extract.

If a highly relevant phrase is identified, then this selective emphasis also applies to the voice response, which will read out the first 2 sentences of the most important highlighted text to provide context to the answer.


For more question suggestions, try:
- What is a solar flare?
- How many Earth's could fit inside the sun?
- What are Earth's atmosphere layers?
- Who makes the first Earth-centered model of the solar system?
- Define solar wind

You'll notice that that your designer console list has no curated answers for these questions. Instead of saying sadly we could not answer the question, Amazon Kendra is searched and possible answers or discovered text are returned. The links are clickable as well, so if the document is available to be read, it can be downloaded from the S3 bucket.

