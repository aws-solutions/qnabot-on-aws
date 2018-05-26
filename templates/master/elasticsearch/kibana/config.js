module.exports=[
{
"_index": ".kibana",
"_type": "config",
"_id": "5.1.1",
"_source": {
  "buildNum": 14566,
  "defaultIndex": {"Fn::Sub":"${Var.index}"},
  "discover:aggs:terms:size": 20
}
},
{
"_index": ".kibana",
"_type": "index-pattern",
"_id": {"Fn::Sub":"${Var.index}"},
"_source": {
  "title":{"Fn::Sub":"${Var.index}"},
  "fields":JSON.stringify(require('./qna-index-pattern'))
}
},
{
"_index": ".kibana",
"_type": "index-pattern",
"_id": {"Fn::Sub":"${Var.index}-metrics"},
"_source": {
  "title":{"Fn::Sub":"${Var.index}-metrics"},
  "timeFieldName":"datetime",
  "fields":JSON.stringify(require('./metrics-index-pattern'))
}
},
{
"_index": ".kibana",
"_type": "index-pattern",
"_id": {"Fn::Sub":"${Var.index}-feedback"},
"_source": {
  "title":{"Fn::Sub":"${Var.index}-feedback"},
  "timeFieldName":"datetime",
  "fields":JSON.stringify(require('./feedback-index-pattern'))
}
}
]
