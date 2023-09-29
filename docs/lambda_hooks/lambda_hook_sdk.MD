# Methods

These are the available methods:

- [get_step](#get_step)
- [get_args](#get_args)
- [get_lex_event](#get_lex_event)
- [get_bot](#get_bot)
- [list_settings](#list_settings)
- [get_setting](#get_settings)
- [get_sentiment](#get_sentiment)
- [list_session_attributes](#list_session_attributes)
- [add_session_attribute](#add_session_attribute)
- [list_user_attributes](#list_user_attributes)
- [get_user_attribute](#get_user_attribute)
- [add_user_attribute](#add_user_attribute)
- [list_response_card_buttons](#list_response_card_buttons)
- [add_response_card_button](#add_response_card_button)
- [get_response_card_imageurl](#get_response_card_imageurl)
- [set_response_card_imageurl](#set_response_card_imageurl)
- [set_response_card_title](#set_response_card_title)
- [get_message](#get_message)
- [set_message](#set_message)
- [get_es_result](#get_es_result)
- [get_answer_source](#get_answer_source)
- [get_question](#get_question)
- [validate_response](#validate_response)

## get_step

A Lambda hook can be called as the first step in the fulfillment pipeline (PREPROCESS), as part of processing a specific question (HOOK) or after processing has completed (POSTPROCESS ) and before the ```userInfo``` is save to DynamoDB and the result has been sent back to the client.  

### Request Syntax

```get_step(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

string

### Returns

```PREPROCESS | POSTPROCESS | HOOK```

## get_args

Returns the arguments specified in the Content Designer when a Lambda is called as a ```HOOK```.

### Request Syntax

```get_args(event)```

### Parameters

- -event - the Lambda event passed to the handler

### Return Type

object or string - if the argument specified in Content Designer is valid JSON, it is deserialized and
returned as an object.  Otherwise, a string is returned.

## get_lex_event

Returns the event object received from the Amazon Lex service.

### Request Syntax

```get_lex_event(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

- Lex V1 - [https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html](https://docs.aws.amazon.com/lex/latest/dg/lambda-input-response-format.html)
- Lex V2 - [https://docs.aws.amazon.com/lexv2/latest/dg/lambda.html](https://docs.aws.amazon.com/lexv2/latest/dg/lambda.html)

## get_bot

Returns the arguments specified in the Content Designer when a Lambda is called as a ```HOOK```.

### Request Syntax

```get_args(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
"bot": {
    "aliasId": "xxxxx",
    "aliasName": "live",
    "name": "<Lex bot name>",
    "version": "<version number>",
    "localeId": "<language code>",
    "id": "<bot id>
},
```

## get_bot

Returns the arguments specified in the Content Designer when a Lambda is called as a ```HOOK```.

### Request Syntax

```get_args(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
"bot": {
    "aliasId": "xxxxx",
    "aliasName": "live",
    "name": "<Lex bot name>",
    "version": "<version number>",
    "localeId": "<language code>",
    "id": "<bot id>
},
```

## list_settings

Returns the user's current settings

### Request Syntax

```get_settings(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
{
"ENABLE_DEBUG_RESPONSES": false,
"ES_USE_KEYWORD_FILTERS": true,
"ES_KEYWORD_SYNTAX_TYPES": "NOUN,PROPN,VERB,INTJ",
"ES_SYNTAX_CONFIDENCE_LIMIT": ".20"
...
}
```

## get_settings

Returns the user's current settings

### Request Syntax

```get_settings(event,setting)```

### Parameters

- event - the Lambda event passed to the handler
- setting - the name of the setting

### Returns

string

## get_sentiment

Returns the sentiment of the user's question as measured by Amazon Comprehend

### Request Syntax

```get_sentiment(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
{
    "sentiment": "POSITIVE" | "NEUTRAL" | "MIXED" | "NEGATIVE"
    "sentimentScore": {
        "Positive": percent,
        "Negative": percent,
        "Neutral": percent,
        "Mixed": percent
},
```

See [here](https://docs.aws.amazon.com/comprehend/latest/dg/API_DetectSentiment.html)

## list_session_attributes

Returns the [Lex Session Attributes](https://docs.aws.amazon.com/connect/latest/adminguide/how-to-use-session-attributes.html). Depending on where the Lambda is called in the process,
the session attributes may be in the request or response.  This returns attributes in the request merged with the attributes in the response object.  The attributes in the response take precedence in the case of a conflict.

### Request Syntax

```list_session_attributes(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
{
    "qnabotcontext": "...",
    "appContext": "...",
    "qnabot_qid": "...",
    "qnabot_gotanswer": "..."
    ....
}
```

## add_session_attribute

Adds a session attribute to the response object that will be returned to the client.

### Request Syntax

```add_session_attribute(event,key,value)```

### Parameters

- event - the Lambda event passed to the handler
- key - the name of the attribute
- value - the value of the attribute

### Return Type

object

### Returns

An object containing the session attributes

```javascript
{
    "qnabot_qid": "client2.1",
    "qnabot_gotanswer": true,
    "qnabotcontext": {
        "previous": {
            "qid": "client2.1",
            "q": "What is the client answer"
        },
        "navigation": {
            "next": "",
            "previous": [],
            "hasParent": true
        }
    },
    "QNAClientFilter": "client2",
    "appContext": {
        "altMessages": {}
    }
    ...
}
```


See [here](https://docs.aws.amazon.com/comprehend/latest/dg/API_DetectSentiment.html) for more information.

## list_user_attributes

Returns the user attributes that are stored in DynamoDB per user. If the user is logged in, the session is permanently associated with the user across devices.  If the user is not logged in, the session is saved based on a temporary ID assigned by QnABot's [Identity Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html)

Depending on where the Lambda is called in the process, the session attributes may be in the request or response.  This returns attributes in the request merged with the attributes in the response object.  The attributes in the response take precedence in the case of a conflict.

### Request Syntax

```list_user_attributes(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
 {
    "UserId": "xxxx",
    "InteractionCount": integer,
    "isVerifiedIdentity": bool,
    "TimeSinceLastInteraction": <number>
    ....
}
```

If the user is logged in, more information is available such as the user name, email address, and first and last name.

## get_user_attribute

Returns a user attribute.


### Request Syntax

```get_user_attribute(event,property,default_value)```

### Parameters

- event - the Lambda event passed to the handler
- property - the property to retrieve
- default_value - if a setting is not found, return this value 

### Return Type

string

## add_user_attribute

Adds a user attribute to the response object that will be stored in DynamoDB. These properties will *not* be returned to the client. But they are available to both the processing pipeline and can be used as part of HandleBars processing.

### Request Syntax

```add_user_attribute(event,key,value)```

### Parameters

- event - the Lambda event passed to the handler
- key - the name of the attribute
- value - the value of the attribute

### Return Type

object

### Returns

```javascript
{
    "UserId": "test-userid",
    "InteractionCount": 6,
    "FirstSeen": "Sat Jul 24 2021 14:08:51 GMT+0000 (Coordinated Universal Time)",
    "LastSeen": "Sat Jul 24 2021 14:10:01 GMT+0000 (Coordinated Universal Time)",
    "TimeSinceLastInteraction": 10.182,
    "recentTopics": [],
    "isVerifiedIdentity": "false"
    ...
}
```

## list_response_card_buttons

QnABot uses [Response Cards](https://aws.amazon.com/blogs/machine-learning/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/#buttons) to add buttons to answers.

This function returns a list of buttons attached to the answer

### Request Syntax

```list_response_card_buttons(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

list of objects

### Returns

```json
[
    {
        text: "button1 text",
        value: "button1 value"
    },
    {
        text: "button2 text",
        value: "button2 value"
    }
]
```

## add_response_card_button

QnABot uses [Response Cards](https://aws.amazon.com/blogs/machine-learning/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/#buttons) to add buttons to answers.

This function adds a button to a response card.  If the response card doesn't exist, the function creates one.

### Request Syntax

```add_response_card_button(event, text, value, isQID = false, prepend = false)```

### Parameters

- event - the Lambda event passed to the handler
- text - (string) the text displayed on the button
- value - (string) the value of the button
- isQID - (boolean) - if true, QnABot will search for a question based on the QID specified by ```value```. If it is false, a button press will simulate the user asking the question specified by ```value```
- prepend - (boolean) - if true, the button will be added to the beginning of the list of buttons.  If false, the button will be added to the end.

### Return Type

n/a

## get_response_card_imageurl

QnABot can [display images with an answer](https://aws.amazon.com/blogs/machine-learning/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/#adding-images) using response cards.

This function returns the URL of the image

### Request Syntax

```get_response_card_imageurl(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

string - the url of the image

## set_response_card_imageurl

QnABot can [display images with an answer](https://aws.amazon.com/blogs/machine-learning/creating-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/#adding-images) using response cards.

This function sets the URL of the image.  A response card must either have an image url, buttons, or both.

### Request Syntax

```set_response_card_imageurl(event,imageurl)```

### Parameters

- event - the Lambda event passed to the handler
- imageUrl - text

### Return Type

na

## get_message

Returns all of the  message formats that can be sent back to user.

### Request Syntax

```get_message(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```json
{
    plainText: string
    markDown: string 
    ssml: string
}
```

- plaintext - the plaintext version of the message, if no other appropriate format is specified. This will be returned as the answer
- markDown - [Markdown](https://www.markdownguide.org/) formatted text.  It will be converted to HTML when sent to the user.
- ssml - [Speech Synthesis Markup Language](https://www.w3.org/TR/speech-synthesis11/) sent when QnABot is used with a voice capable channel like [Alexa devices](https://www.amazon.com/smart-home-devices/b?ie=UTF8&node=9818047011) or [Amazon Connect](https://aws.amazon.com/connect/)

## set_message

This function sets the message that will be returned to the user.

### Request Syntax

```set_message(event,message)```

### Parameters

- event - the Lambda event passed to the handler
- message:

```javascript
{
    plainText: string,
    markDown: string,
    ssml: string
}
```

- plaintext - the plaintext version of the message, if no other appropriate format is specified. This will be returned as the answer
- markDown - [Markdown](https://www.markdownguide.org/) formatted text.  It will be converted to HTML when sent to the user.
- ssml - [Speech Synthesis Markup Language](https://www.w3.org/TR/speech-synthesis11/) sent when QnABot is used with a voice capable channel like [Alexa devices](https://www.amazon.com/smart-home-devices/b?ie=UTF8&node=9818047011) or [Amazon Connect](https://aws.amazon.com/connect/)

### Return Type

na

## set_response_card_title

Sets the title of the response card.  The title is a required property on a response card.  But it usually is not displayed.  ```add_response_card_button()``` will automatically create a response card if one hasn't already been created. But will modify an existing card if one has been created.

### Request Syntax

```set_response_card_title(event, title, overwrrite = true)```

### Parameters

- event - the Lambda event passed to the handler
- title - (string) the title to use for the response card
- overwrite - (boolean) if set to ```true``` overwrite the existing title, otherwise do not overwrite the existing title.

### Return Type

NA

## get_es_result

Returns the response retrieved from the ElasticSearch query.

### Request Syntax

```get_es_result(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

object

### Returns

```javascript
{
            "qid": string,
            "a": string,
            "clientFilterValues": string,
            "type": string,
            "questions": object ,
            "quniqueterms": string,
            "answersource": string,
            "autotranslate": object,

}
```

Where:

- qid - the unique ID for the question
- a - the plain text answer
- clientFilterValues - comma separate list of client filters (TODO: Add link to the documentation)
- question - list of question objects
  - q - (string) the question entered in the content designer
- autoTranslate - Autotranslation enabled by default.. will be disabled when handlebars finds explicit language match block.

## get_answer_source

Returns the source where QnABot retrieved the answer to the user's question.

### Request Syntax

```get_answer_source(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

string - ElasticSearch | KENDRA_FAQ | KENDRA_FALLBACK

## get_question

Returns the question asked by the user.

### Request Syntax

```get_question(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return Type

string - the question asked by the user

## validate_response

Validates that the response being sent back to QnABot has all of the required fields.

If all of the fields are valid, it returns the event.  If not, it throws an exception

### Request Syntax

```validate_response(event)```

### Parameters

- event - the Lambda event passed to the handler

### Return type

object

### Returns

If valid, returns ```event```.  Otherwise throws an exception.
