module.exports=[
  {
    "_index": ".kibana",
    "_type": "_doc",
    "_id": "config:7.4.0",
    "_source": {
      "config":{
        "buildNum": 14566,
        "defaultIndex": {"Fn::Sub":"${Var.index}"},
        "discover:aggs:terms:size": 20
      },
      "type": "config"
    }
  },
  {
    "_index": ".kibana",
    "_type": "_doc",
    "_id": {"Fn::Sub":"index-pattern:${Var.index}"},
    "_source": {
      "index-pattern":{
        "title":{"Fn::Sub":"${Var.index}"},
        "fields":JSON.stringify(require('./qna-index-pattern'))
      },
      "type": "index-pattern"
    }
  },
  {
    "_index": ".kibana",
    "_type": "_doc",
    "_id": {"Fn::Sub":"index-pattern:${Var.index}-metrics"},
    "_source": {
      "index-pattern":{
        "title":{"Fn::Sub":"${Var.index}-metrics"},
        "timeFieldName":"datetime",
        "fields":JSON.stringify(require('./metrics-index-pattern'))
      },
      "type": "index-pattern"
    }
  },
  {
    "_index": ".kibana",
    "_type": "_doc",
    "_id": {"Fn::Sub":"index-pattern:${Var.index}-feedback"},
    "_source": {
      "index-pattern": {
        "title":{"Fn::Sub":"${Var.index}-feedback"},
        "timeFieldName":"datetime",
        "fields":JSON.stringify(require('./feedback-index-pattern'))
      },
      "type": "index-pattern"
    }
  }
]
