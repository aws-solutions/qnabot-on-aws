var fs=require('fs')
var resource=require('../util/resource')
var lambda=require('../util/lambda')
var mock=require('../util/mock')
var _=require('lodash')

module.exports={
    "Examples": resource('examples'),
    "ExamplesList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["ExampleS3ListLambda","Arn"]},
        template:fs.readFileSync(__dirname+'/list.vm','utf8'),
        resource:{"Ref":"Examples"},
        parameterLocations:{
          "method.request.querystring.perpage":false,
          "method.request.querystring.token":false
        }
    }),
    "photos":resource('photos',{"Ref":"Examples"}),
    "photo":resource('{proxy+}',{"Ref":"photos"}),
    "photoGet":proxy({
        resource:{"Ref": "Example"},
        method:"get",
        bucket:{"Ref":"AssetBucket"},
        path:"/examples/photo/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "Documents":resource('documents',{"Ref":"Examples"}),
    "Example": resource('{proxy+}',{"Ref":"Documents"}),
    "ExampleGet":proxy({
        resource:{"Ref": "Example"},
        method:"get",
        bucket:{"Ref":"AssetBucket"},
        path:"/examples/documents/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "ExampleHead":proxy({
        resource:{"Ref": "Example"},
        method:"head",
        bucket:{"Ref":"AssetBucket"},
        path:"/examples/documents/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "ExampleS3ListLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["S3ListLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    }
}

function proxy(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod":opts.method.toUpperCase(),
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod":opts.method.toUpperCase(),
          "Credentials":{"Fn::GetAtt":["S3AccessRole","Arn"]},
          "Uri": {"Fn::Join": ["",[
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":s3:path/",opts.bucket,
                opts.path
          ]]},
          "RequestParameters":opts.requestParams || {},
          "IntegrationResponses": [
            {
                "StatusCode":200,
                "ResponseParameters":Object.assign({
                    "method.response.header.content-type":"integration.response.header.Content-Type"
                },
                opts.responseParameters)
            },{
                "StatusCode":404,
                "ResponseTemplates":{
                    "application/xml":JSON.stringify({
                        error:"Job not found"
                    })
                },
                "SelectionPattern":"403"
            }
          ]
        },
        "RequestParameters":{
            "method.request.path.proxy":false
        },
        "ResourceId":opts.resource,
        "MethodResponses": [
          {
            "StatusCode": 200,
            "ResponseParameters":Object.assign({
                "method.response.header.content-type":false
            },
            _.mapValues(opts.responseParameters || {},x=>false))
          },
          {"StatusCode": 400},
          {"StatusCode": 404}
        ],
        "RestApiId": {"Ref": "API"}
      }
    }
}
