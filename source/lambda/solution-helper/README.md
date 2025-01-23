# Solution Helper Lambda
This lambda handles sending anonymized operational metrics to AWS.  The sample data collection:
```
{'InstallLexResponseBots': 'true', 'EmbeddingsBedrockModelId': 'amazon.titan-embed-text-v1', 'PublicOrPrivate': 'PRIVATE', 'LLMApi': 'BEDROCK', 'OpenSearchEBSVolumeSize': '10', 'LexBotVersion': 'LexV2 Only', 'EmbeddingsApi': 'BEDROCK', 'Language': 'English', 'Version': 'v6.1.0', 'OpenSearchNodeCount': '1', OpenSearchFineGrainAccessControl: 'TRUE', EnableStreaming': 'FALSE', 'LLMBedrockModelId': 'anthropic.claude-instant-v1', 'Region': 'us-east-1', 'OpenSearchInstanceType': 'm6g.large.search', 'FulfillmentConcurrency': '1', 'RequestType': 'Delete', 'BEDROCK_GUARDRAIL_ENABLE': 'false','PREPROCESS_GUARDRAIL_ENABLE': 'false', 'POSTPROCESS_GUARDRAIL_ENABLE': 'false',  'ENABLE_MULTI_LANGUAGE_SUPPORT': 'false', 'LLM_GENERATE_QUERY_ENABLE': 'true', 'KNOWLEDGE_BASE_SEARCH_TYPE': 'DEFAULT', 'PII_REJECTION_ENABLED': 'false', 'EMBEDDINGS_ENABLE': 'true', 'LLM_QA_ENABLE': 'true', 'ENABLE_REDACTING': 'false', 'ENABLE_REDACTING_WITH_COMPREHEND': 'false', 'KNOWLEDGE_BASE_METADATA_FILTERS_ENABLE': 'false' } 
```

## Tests
Unit test are run using:
```shell
python -m pytest
```
