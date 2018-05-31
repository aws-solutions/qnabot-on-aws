var range=require('range').range

module.exports=[
  {
    "_id": "Default",
    "_type": "dashboard",
    "_index":".kibana",
    "_source": {
      "title": "Default",
      "hits": 0,
      "description": "",
      "panelsJSON":JSON.stringify([
          {
            "col": 9,
            "id": "Client-types",
            "panelIndex": 3,
            "row": 1,
            "size_x": 4,
            "size_y": 4,
            "type": "visualization"
          },
          {
            "col": 1,
            "id": "Requests",
            "panelIndex": 4,
            "row": 1,
            "size_x": 8,
            "size_y": 4,
            "type": "visualization"
          },
          {
            "col": 1,
            "id": "Incorrect-feedback-wordcloud",
            "panelIndex": 5,
            "row": 9,
            "size_x": 6,
            "size_y": 3,
            "type": "visualization"
          },
          {
            "col": 7,
            "id": "Correct-feedback-wordcloud",
            "panelIndex": 6,
            "row": 9,
            "size_x": 6,
            "size_y": 3,
            "type": "visualization"
          },
          {
            "col": 3,
            "id": "Logged-Utterances",
            "panelIndex": 7,
            "row": 5,
            "size_x": 12,
            "size_y": 4,
            "type": "visualization"
          }
        ]),
      "optionsJSON": "{\"darkTheme\":false}",
      "uiStateJSON": "{}",
      "version": 1,
      "timeRestore": false,
      "timeFrom":"now/w",
      "timeTo":"now/w",
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"filter\":[{\"query\":{\"query_string\":{\"query\":\"*\",\"analyze_wildcard\":true}}}]}"
      }
    }
  },
  {
    "_id": "Logged-Utterances",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Logged Utterances",
      "visState": "{\"title\":\"Logged Utterances\",\"type\":\"tagcloud\",\"params\":{\"scale\":\"linear\",\"orientation\":\"single\",\"minFontSize\":16,\"maxFontSize\":100,\"hideLabel\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"utterance.keyword\",\"size\":1000,\"order\":\"desc\",\"orderBy\":\"1\"}}],\"listeners\":{}}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.MetricsIndex}\",\"query\":{\"query_string\":{\"query\":\"*\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  },
  {
    "_id": "Feedback-by-QID-and-Utterance",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Feedback by QID and Utterance",
      "visState": "{\"title\":\"Feedback by QID and Utterance\",\"type\":\"histogram\",\"params\":{\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"scale\":\"linear\",\"mode\":\"stacked\",\"times\":[],\"addTimeMarker\":false,\"defaultYExtents\":false,\"setYExtents\":false,\"yAxis\":{}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"feedback.keyword\",\"size\":1000,\"order\":\"desc\",\"orderBy\":\"_term\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"split\",\"params\":{\"field\":\"utterance.keyword\",\"size\":1000,\"order\":\"desc\",\"orderBy\":\"1\",\"row\":true}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"qid.keyword\",\"size\":1000,\"order\":\"desc\",\"orderBy\":\"1\"}}],\"listeners\":{}}",
      "uiStateJSON": "{\"vis\":{\"legendOpen\":true}}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.FeedbackIndex}\",\"query\":{\"query_string\":{\"query\":\"*\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  },
  {
    "_id": "Client-types",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Client Types",
      "visState":JSON.stringify({
          "title": "client-types",
          "type": "pie",
          "params": {
            "shareYAxis": true,
            "addTooltip": true,
            "addLegend": true,
            "legendPosition": "right",
            "isDonut": false
          },
          "aggs": [
            {
              "id": "1",
              "enabled": true,
              "type": "count",
              "schema": "metric",
              "params": {}
            },
            {
              "id": "2",
              "enabled": true,
              "type": "terms",
              "schema": "segment",
              "params": {
                "field": "clientType.keyword",
                "size": 5,
                "order": "desc",
                "orderBy": "1"
              }
            }
          ],
          "listeners": {}
      }),
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.MetricsIndex}\",\"query\":{\"query_string\":{\"query\":\"*\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  },
  {
    "_id": "Requests",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Requests",
      "visState":JSON.stringify({
          "title": "requests",
          "type": "histogram",
          "params": {
            "shareYAxis": true,
            "addTooltip": true,
            "addLegend": true,
            "legendPosition": "right",
            "scale": "linear",
            "mode": "stacked",
            "times": [],
            "addTimeMarker": false,
            "defaultYExtents": false,
            "setYExtents": false,
            "yAxis": {}
          },
          "aggs": [
            {
              "id": "1",
              "enabled": true,
              "type": "count",
              "schema": "metric",
              "params": {}
            },
            {
              "id": "2",
              "enabled": true,
              "type": "date_histogram",
              "schema": "segment",
              "params": {
                "field": "datetime",
                "interval": "auto",
                "customInterval": "2h",
                "min_doc_count": 1,
                "extended_bounds": {},
                "customLabel": "requests"
              }
            }
          ],
          "listeners": {}
        }),
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.MetricsIndex}\",\"query\":{\"query_string\":{\"query\":\"*\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  },
  {
    "_id": "Correct-feedback-wordcloud",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Anwsers with positive feedback",
      "visState":JSON.stringify({
          "aggs": [
            {
              "enabled": true,
              "id": "1",
              "params": {},
              "schema": "metric",
              "type": "count"
            },
            {
              "enabled": true,
              "id": "2",
              "params": {
                "field": "utterance.keyword",
                "order": "desc",
                "orderBy": "1",
                "size": 5
              },
              "schema": "segment",
              "type": "terms"
            }
          ],
          "listeners": {},
          "params": {
            "maxFontSize": 72,
            "minFontSize": 18,
            "orientation": "single",
            "scale": "linear"
          },
          "title":"Anwsers with positive feedback",
          "type": "tagcloud"
      }),
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.FeedbackIndex}\",\"query\":{\"query_string\":{\"query\":\"feedback=The answer was a good response to your question.\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  },
  {
    "_id": "Incorrect-feedback-wordcloud",
    "_type": "visualization",
    "_index":".kibana",
    "_source": {
      "title": "Anwsers with negative feedback",
      "visState":JSON.stringify({
          "aggs": [
            {
              "enabled": true,
              "id": "1",
              "params": {},
              "schema": "metric",
              "type": "count"
            },
            {
              "enabled": true,
              "id": "2",
              "params": {
                "field": "utterance.keyword",
                "order": "desc",
                "orderBy": "1",
                "size": 5
              },
              "schema": "segment",
              "type": "terms"
            }
          ],
          "listeners": {},
          "params": {
            "maxFontSize": 72,
            "minFontSize": 18,
            "orientation": "single",
            "scale": "linear"
          },
          "title":"Anwsers with positive feedback",
          "type": "tagcloud"
      }),
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": {"Fn::Sub":"{\"index\":\"${ESVar.FeedbackIndex}\",\"query\":{\"query_string\":{\"query\":\"feedback=The answer was a bad response to your question.\",\"analyze_wildcard\":true}},\"filter\":[]}"}
      }
    }
  }
]
