# Kendra Fallback Function

Provides a preview Lambda Hook for the no_hits question to search a set of Kendra indexes
as a fallback mechanism to provide answers. 

Kendra provides a number of innovative features. This Kendra Fallback function performs a query against a
set of Kendra indexes and will return the first answer that Kendra identifies. Kendra can return multiple 
answers however to keep responses limited in scope the first answer is provided through QnABot. Links to 
documents stored in S3 buckets that Kendra indexes are also provided. The security of the S3 bucket governs
whether this link is usable. In addition Kendra can return discovered text with links to these documents as well.
This function returns a default of four discovered texts/links. The maximum number of returned links is
configurable. 

## Custom Properties
QnABot utilizes custom properties stored within Systems Manager Parameter Store. 

The following custom properties can be set within Systems Manager Parameter Store that affect
output for web and text. 

Please look at your CloudFormation stack outputs for the key 'CustomSettingsSSMParameterName' 
to identify the name of the parameter to update in SSM Parameter Store.

The value for this key will look similar to 
```
CFN-CustomQnABotSettings-VZNvdO2sJ3r7
```

### Customer properties that can be set are the following

#### ALT_SEARCH_KENDRA_INDEXES
**Required** - A String value that specifies an array of 
Kendra indexes to search. At least one index must be specified. Until this custom property is set 
in QnABot, use of Kendra as a fallback mechanism will return an error. 

Edit this custom property mentioned earlier to add a key/value similar to 

```
{"ALT_SEARCH_KENDRA_INDEXES":"[\"857710ab-9637-4a46-910f-9a1456d02596\"]"}
```
**Note the Escaped Quote marks around the array of Kendra index ids are required**

#### ALT_SEARCH_MESSAGE 
String - Overrides the default text to prepend to the response
indicating alternate search results are being used. 

#### ALT_SEARCH_MESSAGE_MD 
String - Overrides the default Markdown to prepend to the response
indicating alternate search results are being used. 

#### ALT_SEARCH_HELPFUL_LINKS_MSG
String - Overrides the default message to insert in markdown 
output prior to display of Kendra Answer document uris. Default is 'Possible Links'.

#### ALT_SEARCH_EXTRACTED_TEXT_MSG
String - Overrides the default message to insert in markdown 
output prior to display the Answer's document uris. Default is 'Discovered Text'.

#### ALT_SEARCH_MAX_DOCUMENT_COUNT 
Number - Overrides the maximum number of discovered text links
to display in markdown result. Default is 4.
          
## Installation

### Step 1
Set the ALT_SEARCH_KENDRA_INDEXES custom property in SSM Parameter Store

### Step 2
Using QnABot Designer UI, use the import menu and expand the Examples/Extensions block. Then look
for the extension named KendraFallback. Load this extension. 

### Step 3 
Once loaded you will update the question with the qid  "KendraFallback" changing its question from 
"no_hits_alternative" to "no_hits".

### Step 4 
If you have previously loaded the QnAUtility.json from Examples/Extensions you need to either remove 
the question with the ID "CustomNoMatches" or change the question for this ID from "no_hits" to "no_hits_original"

Once the new question, "KendraFallback" is configured as the response for "no_hits", the Kendra index will be
searched for an answer whenever a curated answer can not be found. Once setup, Kendra provides a fallback 
mechanism prior to telling the user an answer could not be found. 


 
