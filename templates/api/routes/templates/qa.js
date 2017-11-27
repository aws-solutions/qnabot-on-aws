var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')

module.exports={
"Question": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "ParentId": {
      "Fn::GetAtt": [
        "API",
        "RootResourceId"
      ]
    },
    "PathPart": "{Id}",
    "RestApiId": {
      "Ref": "API"
    }
  }
},
"QuestionHead": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "AuthorizationType": "NONE",
    "HttpMethod": "HEAD",
    "Integration": {
      "Type": "AWS",
      "IntegrationHttpMethod": "POST",
      "Uri": {
        "Fn::Join": [
          "",
          [
            "arn:aws:apigateway:",
            {
              "Ref": "AWS::Region"
            },
            ":lambda:path/2015-03-31/functions/",
            {"Ref": "HandlerArn"},
            "/invocations"
          ]
        ]
      },
      "IntegrationResponses": [
        {
            "StatusCode": 200,
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Origin": "'*'"
            }
        },
        {
            "SelectionPattern":".*error.*",
            "StatusCode": 404,
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Origin": "'*'"
            }
        }
      ],
      "RequestTemplates": {
        "application/json": {
          "Fn::Join": [
            "",
            [
              "{",
              "\"Command\":\"CHECK\",",
              "\"Id\":\"$util.urlDecode($input.params('Id'))\"",
              "}"
            ]
          ]
        }
      }
    },
    "ResourceId": {"Ref": "Question"},
    "RequestParameters": {
      "method.request.path.Id": true
    },
    "MethodResponses": [
      {
        "StatusCode": 200,
        "ResponseParameters":{
            "method.response.header.Access-Control-Allow-Origin": true
        }
      },
      {
        "StatusCode": 404,
        "ResponseParameters":{
            "method.response.header.Access-Control-Allow-Origin": true
        }
      }
    ],
    "RestApiId": {
      "Ref": "API"
    }
  }
},
"QuestionPut": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "AuthorizationType": "AWS_IAM",
    "HttpMethod": "PUT",
    "Integration": {
      "Type": "AWS",
      "IntegrationHttpMethod": "POST",
      "Uri": {
        "Fn::Join": [
          "",
          [
            "arn:aws:apigateway:",
            {
              "Ref": "AWS::Region"
            },
            ":lambda:path/2015-03-31/functions/",
            {"Ref": "HandlerArn"},
            "/invocations"
          ]
        ]
      },
      "IntegrationResponses": [
        {
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Origin": "'*'"
            },
            "StatusCode": 200
        }
      ],
      "RequestTemplates": {
        "application/json": {
          "Fn::Join": [
            "",
            [
              "{",
              "\"Command\":\"ADD\",",
              "\"Body\":$input.body",
              "}"
            ]
          ]
        }
      }
    },
    "ResourceId": {"Ref": "Question"},
    "MethodResponses": [
      {
        "ResponseParameters":{
            "method.response.header.Access-Control-Allow-Origin": true
        },
        "StatusCode": 200
      },
      {
        "StatusCode": 400
      }
    ],
    "RestApiId": {
      "Ref": "API"
    }
  }
},
"QuestionDelete": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "AuthorizationType": "AWS_IAM",
    "HttpMethod": "DELETE",
    "Integration": {
      "Type": "AWS",
      "IntegrationHttpMethod": "POST",
      "Uri": {
        "Fn::Join": [
          "",
          [
            "arn:aws:apigateway:",
            {
              "Ref": "AWS::Region"
            },
            ":lambda:path/2015-03-31/functions/",
            {"Ref": "HandlerArn"},
            "/invocations"
          ]
        ]
      },
      "IntegrationResponses": [
        {
            "ResponseParameters":{
                "method.response.header.Access-Control-Allow-Origin": "'*'"
            },
            "StatusCode": 200
        }
      ],
      "RequestTemplates": {
        "application/json": {
          "Fn::Join": [
            "",
            [
              "{",
              "\"Command\":\"DELETE\",",
              "\"Id\":\"$util.urlDecode($input.params('Id'))\"",
              "}"
            ]
          ]
        }
      }
    },
    "RequestParameters": {
      "method.request.path.Id": true
    },
    "ResourceId": {
      "Ref": "Question"
    },
    "MethodResponses": [
      {
        "ResponseParameters":{
            "method.response.header.Access-Control-Allow-Origin": true
        },
        "StatusCode": 200
      },
      {
        "StatusCode": 400
      }
    ],
    "RestApiId": {
      "Ref": "API"
    }
  }
}
}
