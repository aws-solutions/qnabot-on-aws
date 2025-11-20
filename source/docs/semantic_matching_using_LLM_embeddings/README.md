# Semantic question matching, using Large Language Model Text Embeddings

QnABot can now use text embeddings to provide semantic search capability, with the goal of improved accuracy with much less tuning compared to standard Opensearch keyword based matching. Some of the benefits include:
- Improved FAQ accuracy from semantic matching vs. keyword matching (comparing the meaning vs. comparing individual words)
- Less training utterances required to match a diverse set of queries.
- Better multi-language support, since translated utterances only need to match the meaning of the stored text, not the wording.

Example: With semantic matching enabled, *"What's the address of the White House?"* matches *"Where does the President live?"*, and *"How old are you?"* matches *"What is your age"*. These examples do not match using keywords as they do not share any of the same words.
  
As a best practice, you should try LLM models on non-production instances initially, to validate expected accuracy improvements, and to test for any regression issues.

You can select from three different options:
1. BEDROCK: Select from several embeddings models provided by Amazon Bedrock using the EmbeddingsBedrockModelId Cloudformation parameter. These models provide the best performance and operate on a pay-per-request model.
2. LAMBDA: Embeddings from a user provided Lambda function - explore alternate pre-trained and/or fine tuned embeddings models. This option provides a custom option for advanced users who wish to deploy their own embeddings model.

## 1. Amazon Bedrock (PREFERRED)
Utilizes one of the Amazon Bedrock foundation models or inference profiles to generate text embeddings. Currently, the following embeddings models are supported by QnA Bot:

### Foundation Models
- [Amazon Titan Embeddings G1](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=amazon.titan-embed-text-v1)
- [Titan Text Embeddings V2](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=amazon.titan-embed-text-v2:0)
- [Amazon Nova Multimodal Embeddings](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/amazon.nova-2-multimodal-embeddings-v1:0)
- [Cohere English](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=cohere.embed-english-v3)
- [Cohere Multilingual](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/providers?model=cohere.embed-multilingual-v3)

### Inference Profiles
- [Global Cohere Embed V4](https://us-east-1.console.aws.amazon.com/bedrock/home?region=us-east-1#/model-catalog/serverless/cohere.embed-v4:0)

> **_NOTE:_** 
Cross-region inference profiles are not supported when deploying QnABot via VPC template 

### Configuring Amazon Bedrock Embeddings

From the Cloudformation console, set the following parameters:
- set `EmbeddingsAPI` to BEDROCK
- set `EmbeddingsBedrockModelId` to one of the options provided. 

![CFN Params](./images/CF_Params_Bedrock.jpeg)

## 2. Lambda function

Use a custom Lambda function to use any Embedding API or embedding model to generate embeddings.

### Deploy Stack for Embedding models invoked by a custom Lambda Function

- set `EmbeddingsAPI` to LAMBDA
- set `EmbeddingsLambdaArn` to the ARN of your Lambda function 
- Set `EmbeddingsLambdaDimensions` to match the number of dimensions returned by your Lambda function

![CFN Params](./images/CF_Params_Lambda.png)

Your Lambda function is passed an event of the form:
```
{
  "inputType": "string", // value 'q' for question, 'a' for answer
  "inputText":"string"   // string of question of answer to use to generate embeddings 
}
```
and must return a JSON structure of the form:
```
{"embedding":[...]}
```
where the length of the embedding array matches the value you specify for the stack parameter `EmbeddingsLambdaDimensions`.

## Settings

When QnABot stack is installed, open Content Designer **Settings** page:

**ES_USE_KEYWORD_FILTERS:** The setting `ES_USE_KEYWORD_FILTERS` should now default to `false`. While you can use keyword filters with embeddings based semantic queries, they significantly limit the power of semantic search by forcing keyword matches (preventing matches based on different words with similar meanings).

**ES_SCORE_ANSWER_FIELD:** If set to true, QnABot executes embedding vector searches on embeddings generated on answer field if no match is found (above EMBEDDINGS_SCORE_THRESHOLD) on question fields. This allows QnABot to find matches based on the contents on the answer field as well as the questions. Only the plain text answer field is used (not the Markdown or SSML alternatives). Matches on the answer field must score above EMBEDDINGS_SCORE_ANSWER_THRESHOLD.
  - EMBEDDINGS_SCORE_THRESHOLD - see below
  - EMBEDDINGS_SCORE_ANSWER_THRESHOLD - see below


*Scroll to the bottom of the settings page and observe the new EMBEDDINGS settings:*

**EMBEDDINGS_ENABLE:** to enable / disable use of semantic search using embeddings, set `EMBEDDINGS_ENABLE` to false.
  - Set to false to disable the use of embeddings based queries. 
  - Set to true to re-enable the use of embeddings based queries after previously setting it to false. NOTE - Setting true when the stack has `EmbeddingsAPI` set to DISABLED will cause failures, since the QnABot stack isn't provisioned to support generation of embeddings. 
  - If you disable embeddings, you will likely also want to re-enable keyword filters by setting `ES_USE_KEYWORD_FILTERS` to true. 
  - If you add, modify, or import any items in Content Designer when set `EMBEDDINGS_ENABLE` is false, then embeddings won't get created and you'll have to reimport or re-save those items after reenabling embeddings again  
    
**EMBEDDINGS_SCORE_THRESHOLD:** to customize the score threshold, change the value of `EMBEDDINGS_SCORE_THRESHOLD`. Unlike regular OpenSearch queries, embeddings queries always return scores between 0 and 1, so we can apply a threshold to separate good from bad results. 
  - If embedding similarity score is under threshold the match it's rejected and QnABot reverts to
     - Trying to find a match on the answer field, only if ES_SCORE_ANSWER_FIELD is set to true (see above).
     - Text item passage query 
     - Kendra fallback 
     - or no_hits
  - Use the Content Designer TEST tab to see the hits ranked by score for your query results.
  - The default is 0.7 for `BEDROCK` for now but you will likely need to modify this based on your embedding model and your experiments.

**EMBEDDINGS_SCORE_ANSWER_THRESHOLD:** to customize the answer score threshold, used only when ES_SCORE_ANSWER_FIELD is true (see above), change the value of `EMBEDDINGS_SCORE_ANSWER_THRESHOLD`. 
  - If embedding similarity score for answer field query is under threshold the match it's rejected and QnABot reverts to Text item passage query, Kendra fallback or no_hits
  - Use the Content Designer TEST tab to see the hits ranked by score for your answer field query results. For **Match on**, choose *qna item answer* to see answer field scores.
  - The default is 0.80 for now but you will likely need to modify this based on your embedding model and your experiments.

**EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD:** to customize the passage score threshold, change the value of `EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD`. 
  - If embedding similarity score for text item passage field query is under threshold the match it's rejected and QnABot reverts to Kendra fallback or no_hits
  - Use the Content Designer TEST tab to see the hits ranked by score for your answer field query results. For **Match on**, choose *text item passage* to see passage field scores.
  - The default is 0.65 for `BEDROCK` for now but you will need likely to modify this based on your embedding model and your experiments.