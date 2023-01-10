# Semantic question matching, using Large Language Model Text Embeddings

QnABot can now use text embeddings to provide semantic search capability, providing improved accuracy with much less tuning.
  
QnaBot can now use 
1. Embeddings from OpenAI text-embedding-ada-002 model - see https://beta.openai.com/docs/guides/embeddings
2. Embeddings from a Text Embedding model hosted on a SageMaker endpoint - see https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_embedding/Amazon_JumpStart_Text_Embedding.ipynb


## Open AI Embeddings

### Deploy stack for OpenAI Embeddings
To enable OpenAI embeddings when you install QnABot:
- set `EmbeddingsAPI` to OPENAI
- set `OpenAIApiKey` to the value of your OpenAI API Key - see https://beta.openai.com/account/api-keys
- leave `EmbeddingsDimensions` at the default value of 1536 (compatible with OpenAI model)
![CFN Params](./images/cfn_params.jpg)

Deploy QnABot stack.

## Sagemaker based embeddings

You can also experiment with embeddings models deployed on SageMaker endpoints. 

### Deploy Stack for SageMaker Embeddings

- set `EmbeddingsAPI` to SAGEMAKER
- set `EmbeddingsSageMakerEndpoint` to the name of your SageMaker inference endpoint where your embeddings model is running 
- Set `EmbeddingsDimensions` to match the number of dimensions returned by your model

*Note: SageMaker embeddings have been tested only with TensorFlow models from the SageMaker Text Embeddings JumpStart. Other models may possibly require code changes to invoke the model and process results.. OR use the LAMBDA option (below) instead to abstract your model. The SageMaker interface code is in the file [embeddings.js](../../lambda/es-proxy-layer/lib/embeddings.js).*

### Deploy Stack for Other Embedding models using a Lambda Function

Use a custom Lambda function to use any API or Embedding model on Sagemaker to generate embeddings.  

- set `EmbeddingsAPI` to LAMBDA
- set `EmbeddingsLambdaArn` to the ARN of your Lambda function 
- Set `EmbeddingsDimensions` to match the number of dimensions returned by your Lambda function

Your Lambda function is passed an event of the form:
```
{"inputtext":"string"}
```
and must return a JSON structure of the form:
```
{"embedding":[...]}
```
where the length of the embedding array matches the value you specify for the stack parameter `EmbeddingsDimensions`.



### Settings

When QnABot stack is installed, open Content Designer **Settings** page:

- The setting `ES_USE_KEYWORD_FILTERS` should now default to `FALSE`. While you can use keyword filters with embeddings based semantic queries, they significantly limit the power of semantic search by forcing keyword matches (preventing matches based on different words with similar meanings).

Scroll to the bottom of the settings page and observe the new EMBEDDINGS settings:

- to enable / disable use of semantic search using embeddings, toggle `EMBEDDINGS_ENABLE` to TRUE or FALSE  (Note: If you disable embeddings, you will likely also want to re-enable keyword filters by setting `ES_USE_KEYWORD_FILTERS` to TRUE)
- to customize the score threshold, change the value of `EMBEDDINGS_SCORE_THRESHOLD` - the default is 0.85 for now but you may well need to modify this based on your embedding model and your experiments.  Unlike regular elasticsearch queries, embeddings queries always return scores between 0 and 1, so we can apply a threshold to separate good from bad results. Results that score less than the threshold are not returned to the user. Use Content Designer TEST tab to see the scores for query results.








