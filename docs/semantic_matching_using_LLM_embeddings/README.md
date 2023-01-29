# Semantic question matching, using Large Language Model Text Embeddings

QnABot can now use text embeddings to provide semantic search capability, with the goal of improved accuracy with much less tuning compared to standard Opensearch keyword based matching.

For now this is an Experimental feature. We encourage you to try it on non-production instances initially, to validate expected accuracy improvements, and to test for any regression issues. 

With this release, QnaBot can now use 
1. PREFERRED: Embeddings from a Text Embedding model hosted on an Amazon SageMaker endpoint - see https://huggingface.co/intfloat/e5-large
2. CUSTOMIZABLE: Embeddings from a user provided Lambda function - explore alternate pretrained and/or fine tuned embeddings models. 

## 1. Amazon Sagemaker (PREFERRED)

QnABot provisions a Sagemaker endpoint running the Hugging Face el5-large model - see https://huggingface.co/intfloat/e5-large. 
  
By default a 1-node ml.m5.xlarge endpoint is automatically provisioned. For large volume deployments, add additional nodes by setting the parameter `SagemakerInitialInstanceCount`. Please check [SageMaker pricing documentation](https://aws.amazon.com/sagemaker/pricing/) for relevant costs and information on Free Tier eligibility. 
  
By setting the parameter `SagemakerInitialInstanceCount` to `0`, a [Serverless Sagemaker endpoint](https://docs.aws.amazon.com/sagemaker/latest/dg/serverless-endpoints.html) is enabled. A serverless endpoint can save you money by scaling down to zero when not in use, however, there is a 'cold start' time of approximately 2 minutes during which QnABot requests, imports, or add/modify items operations will time out or be delayed. QnABot creates the endpoint with default 4GB model memory, and max concurrency of 50 requests.  


### Deploy Stack for SageMaker Embeddings

- set `EmbeddingsAPI` to SAGEMAKER
- set `SagemakerInitialInstanceCount` - default is '1'. Set to a larger number for high volume deployments, or set to 0 to enable a Serverless endpoint (only for cold-start delay tolerant deployments!). 

![CFN Params](./images/CF_Params_Sagemaker.png)


## 3. Lambda function

Use a custom Lambda function to use any Embedding API or embedding model on Sagemaker to generate embeddings.  

### Deploy Stack for Embedding models invoked by a custom Lambda Function

- set `EmbeddingsAPI` to LAMBDA
- set `EmbeddingsLambdaArn` to the ARN of your Lambda function 
- Set `EmbeddingsLambdaDimensions` to match the number of dimensions returned by your Lambda function

![CFN Params](./images/CF_Params_Lambda.png)

Your Lambda function is passed an event of the form:
```
{
  "inputtype": "string", // value 'q' for question, 'a' for answer
  "inputtext":"string"   // string of question of answer to use to generate embeddings 
}
```
and must return a JSON structure of the form:
```
{"embedding":[...]}
```
where the length of the embedding array matches the value you specify for the stack parameter `EmbeddingsLambdaDimensions`.



## Settings

When QnABot stack is installed, open Content Designer **Settings** page:

**ES_USE_KEYWORD_FILTERS:** The setting `ES_USE_KEYWORD_FILTERS` should now default to `FALSE`. While you can use keyword filters with embeddings based semantic queries, they significantly limit the power of semantic search by forcing keyword matches (preventing matches based on different words with similar meanings).

**ES_SCORE_ANSWER_FIELD:** If set to true, QnABot executes embedding vector searches on embeddings generated on answer field as well as question fields. This allows QnABot to find matches based on the contents on the answer field as well as the questions. Only the plain text answer field is used (not the Markdown or SSML alternatives). Scores for question match and answer match are added together to get the final score. Tune the relative weights of scores from question and answer respectively using additional settings:
  - EMBEDDINGS_WEIGHT_QUESTION_FIELD - see below
  - EMBEDDINGS_WEIGHT_ANSWER_FIELD - see below


*Scroll to the bottom of the settings page and observe the new EMBEDDINGS settings:*

**EMBEDDINGS_ENABLE:** to enable / disable use of semantic search using embeddings, set `EMBEDDINGS_ENABLE` to FALSE.
  - Set to FALSE to disable the use of embeddings based queries. 
  - Set to TRUE to re-enble the use of embeddings based queries after previously setting it to FALSE. NOTE - Setting TRUE when the stack has `EmbeddingsAPI` set to DISABLED will cause failures, since the QnABot stack isn't provisioned to support generation of embeddings. 
  - If you disable embeddings, you will likely also want to re-enable keyword filters by setting `ES_USE_KEYWORD_FILTERS` to TRUE. 
  - If you add, modify, or import any items in Content Designer when set `EMBEDDINGS_ENABLE` is false, then embeddings won't get created and you'll have to reimport or re-save those items after reenabling embeddings again  
    
**EMBEDDINGS_SCORE_THRESHOLD:** to customize the score threshold, change the value of `EMBEDDINGS_SCORE_THRESHOLD`. Unlike regular elasticsearch queries, embeddings queries always return scores between 0 and 1, so we can apply a threshold to separate good from bad results. 
  - If embedding similarity score is under threshold the match it's rejected and QnABot reverts to Kendra fallback or no_hits
  - Use the Content Designer TEST tab to see the hits ranked by score for your query results.
  - The default is 0.85 for now but you may well need to modify this based on your embedding model and your experiments.

**EMBEDDINGS_WEIGHT_QUESTION_FIELD:** to tune weight for knn scores from question field matches. Modify the weight to scale question match scores up or down.

**EMBEDDINGS_WEIGHT_ANSWER_FIELD:**  to tune weight for knn scores from answer field matches. Only applies when ES_SCORE_ANSWER_FIELD is true. Modify the weight to scale answer field match scores up or down.

**EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS:** if 'true', strings are prefixed by 'query: ' for questions, and 'passage: ' for answers - see examples at https://huggingface.co/intfloat/e5-large. Applies only when using SAGEMAKER EmbeddingsApi. The default is currently 'false' since we seen better distance in scores between correct and incorrect answers. Please Experiment! If you use ES_SCORE_ANSWER_FIELD 'true' you'll get better scoring consistency from answer matches if this setting is 'true'.  When changing this setting value, you must regenerate stored embeddings by exporting/importing all items.

