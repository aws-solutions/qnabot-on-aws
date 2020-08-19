# Kendra FAQ Integration

## Simple example

QnABot now offers a new machine-learning based query method based on Amazon Kendra to improve question-matching accuracies and reduce the tuning workload. Let's try a simple example to illustrate the concept:


**Part 1: See the limitations of ElasticSearch**
1. Add the following question to your designer console:

    QID: econ.1
  
    Question: "What are the main goals of an economy?" 
  
    Answer: "All economies in the world try to achieve 3 things: Growth, High employment"
    
2. Try this question out in the QnABot client. 
3. Then, try out a different phrasing: "What main objectives do economies try to achieve?" 

You'll find that the ElasticSearch based QnABot does not know that these two questions mean the same thing. We're going to see how Amazon Kendra can address this limitation.

**Part 2: Create an Amazon Kendra index**
1. Go to [Amazon Kendra](http://console.aws.amazon.com/kendra) and click on **Create Index** in the top right corner.
2. Provide an *Index name* and optional *Description*.
3. Choose the recommended *Create a new role* for the IAM role and provide a name like *explore-qnabot*.
4. Press **Next**. Decide if you want the Enterprise or Developer edition. 

    Kendra's Free Tier of usage provides the Developer edition for free usage of up to 750 hours for the first 30 days. Both editions have a query rate that is strictly enforced at 0.5 queries/second. The Enterprise edition provides the option to increase this limit for additional cost. The Developer edition cannot increase query capacity. For more information on pricing details, go to https://aws.amazon.com/kendra/pricing/.
  
5. **Create** the index. It will take ~30 minutes.

**Part 3: Set up KendraFAQ in Designer Console**
2. Log in to the Content Designer, and go to settings. Scroll down until you see the field *KENDRA_FAQ_INDEX*.
3. Enter your Kendra index ID copied from the Kendra console.

<img src="./kendra_console_readme.png?raw=true" width="250" height="300">

4. Save the settings and return to the home page of the web interface.
5. Click on the button on the top right of the QnABot home screen to open up a drop-down menu. Press **Sync Kendra FAQ**.

<img src="./sync_kendra_faq_menu.png?raw=true" width="200" height="200">

6. Wait until your designer console finish syncing to the Kendra index.
7. Go back into the QnABot client and try out the new phrasing again: "What main objectives do economies try to achieve?"

You'll see that with Kendra-based question matching, the QnABot can understand variations in human language better! Amazon Kendra is an enterprise search service powered by machine learning and natural language processing. This means that it can apply different semantic meanings over the terms in a user’s question to better understand the meaning of complex human language, and identify better answers. With Amazon Kendra, QnABot is able to comprehend that these two question phrasings mean the same thing.


## Supported features
QnABot supports the following features with its Amazon Kendra alternative implementation. If a feature is only supported on ElasticSearch, then QnABot will default to using the ES query method instead. If a question does not result in any matches through the Kendra FAQ method, this integration provides an optional ElasticSearch fallback (ES Fallback) to support those features that are not yet functional with Kendra. 

|Feature                                                  | Supported                                                               |
|---------------------------------------------------------|-------------------------------------------------------------------------|
|Adding images to answer                                  | YES                                                                     |
|Using SSML to control speech synthesis                   | YES                                                                     |
|Adding Markdown to style rich text answers on web UI     | YES                                                                     |
|Using variables and conditional content, with Handlebars | YES                                                                     |
|Displaying buttons on the web UI                         | YES                                                                     |
|Using Topics to support follow-up questions              | NO. Supported only on ElasticSearch, future Kendra support              |
|Adding style to QnABot                                   | Supported via optional ES Fallback                                      |
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
|QID querying                                             | NO. Supported only on ElasticSearch, future Kendra support              |


## Details about the Kendra FAQ integration
The Kendra integration is still on its way to being fully realized. As the Kendra service develops frameworks to support similar use cases, its capabilities will continue changing. For this reason, here we document the limitations and current functions here.

- Kendra does not yet scale well in terms of concurrent users. If there are many simultaneous users on QnABot at a time, expect there to be significant latency or even failure to execute Kendra queries. The current implementation is optimized to support 10 concurrent users where each user will wait a maximum of 4.5 seconds before receiving a response to their question. To optimize your QnABot for different numbers of users or use cases, see the fields `KENDRA_FAQ_MAX_RETRIES` and `KENDRA_FAQ_CONFIG_RETRY_DELAY`. They deal with Kendra's in-built exponential delay and retry function in the case that a query times out or is blocked due to too many other simultaneous queries. The first setting sets the maximum number of retries, and the second sets the base number of milliseconds that Kendra delays before retrying a query.
- Kendra FAQ currently performs poorly when trying to match a question with only 1 term in it, such as 'help' or 'hello'. For this reason, adding Style and other one-word Custom Don't Know Answers are supported via the optional ElasticSearch fallback engine. There are plans for Kendra to support this in the future. Similarly with Topics and QID querying, Kendra does not currently support them and QnABot defaults to ElasticSearch to identify an answer, but these features are coming soon.

## Additional Question-Matching Examples  
These are addional example questions where the new phrasing fails to find a match using ElasticSearch, but succeeds with the Kendra integration.

QID: solar.1
Question: How old is the sun?
Answer: Our sun is 4.6 billion years old.
New phrasing: What is the age of the sun?

QID: bus.1
Question: What are the main functions of management?
Answer: There are 4 main functions of management: planning, organizing, directing, and controlling.
New phrasing: What main operations does management fulfill?
