# OpenSearch Dashboards

JSON exported from Opensearch Dashboards using

```bash
curl -X GET 'master-user:master-user-password' "https://<opensearch_domain_endpoint>/_dashboards/api/opensearch-dashboards/dashboards/export?dashboard=052b1350-a37d-11ea-8370-0f1df276cae1" > QnABotDashboard.json
```

After exporting, edit the 3 index-pattern sections to replace actual index 'title' fields with tokens: <INDEX_QNA>, <INDEX_METRICS>, <INDEX_FEEDBACK>  - 1 occurrence each, e.g.:

```json
      {
      "id": "QnaItems",
      "type": "index-pattern",
      "updated_at": "2020-06-02T10:44:21.050Z",
      "version": "WzEzLDFd",
      "attributes": {
        "title": "<INDEX_QNA>",
        "fields": ...
```
