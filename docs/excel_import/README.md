# Excel Workbook Import

QnABot supports importing questions and answers from Microsoft Excel (xlsx) workbooks.

A [sample](./sample.xlsx) Excel workbook is included. Each column in the Excel sheet maps to a field in the Content Designer.

## Basic Fields

![Designer Part 1](./images/DesignerMapping1.png)

Excel Column | Content Designer Field| Description
---------|----------|---------
 qid | Item ID | Assign a unique identifier for this item
 question1...question(n) | Question | One or more questions for the item. Each question should be in a separate column numbered question1, question2, ...
 answer | Answer | The answer you want to be returned when the user asks one of the questions you specified.
 markdown | Markdown Answer | Alternate [Markdown](https://guides.github.com/features/mastering-markdown/) answer.
 ssml | SSML Answer | Alternate [SSML](https://developer.amazon.com/en-US/docs/alexa/custom-skills/speech-synthesis-markup-language-ssml-reference.html) answer.

## Topics and Response Cards

![Designer Part 2](./images/DesignerMapping2.png)

Excel Column | Content Designer Field| Description
---------|----------|---------
 topic | Topic| Assign a topic to this item, to support follow up questions on the same topic
 cardtitle | Card Title | Required - max length of 80
 cardimageurl | Card Image Url | The web address of an image that will appear on the response card
 displaytext1...displaytext(n) | Display Text | The text of the button. Each button text should be in a separate column numbered button1, button2, ...
 buttonvalue...buttonvalue(n) | Button Value| The value of the button. Each button value should be in a separate column numbered button1, button2, ...
 attributename1...attributename(n) | Session Attribute Name | The name of the session attribute. Each attribute name should be in a separate column numbered attributename1, attributename2, ...
 attributevalue1...attributevalue(n) | Session Attribute Value | The value of the session attribute. Each attribute value should be in a separate column numbered attributevalue1, attributevalue2, ...
 enabletranslation1...enabletranslation(n) | Translate Value if multi-language is enabled | Determines whether Amazon Translate is run on the session value. Each attribute value should be in a separate column numbered enabletranslation1, enabletranslation2.  This column is optional and must be either TRUE or FALSE.  The default value is TRUE.

## Support for other Content Designer fields

While special affordances have been made to allow importing the fields above, any "string" field in the [Content Designer schema](../../lambda/schema/qna.js)
can be imported by specifying the JSON path as the column.  

### Example of a field on the root level

![Schema snippet](./images/schema2.png)

Excel Column | Content Designer Field
-------------|-----------------------
clientFilterValues | Client Filter: Values


### Examples of nested fields

![Schema snippet](./images/schema.png)

Excel Column | Content Designer Field (title in the schema.json) 
-------------|------------------------
elicitResponse.response_hook | Elicit Response: Responsebot Hook
elicitResponse.response_sessionattr_namespace |  Response Session Attribute Namespace

## Importing the Microsoft Excel file

Choose *Import* from the Menu and then choose *From File*

![Import](./images/import.png)

After your import is complete, a dialog showing any import errors will be displayed.

![Import](./images/afterimport.png)
