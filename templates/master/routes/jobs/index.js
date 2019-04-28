var fs=require('fs')
var resource=require('../util/resource')
var lambda=require('../util/lambda')
var mock=require('../util/mock')
var _=require('lodash')

module.exports={
    "Jobs": resource('jobs'),
    "JobsGet":mock({
        auth:'AWS_IAM',
        method:"GET",
        subTemplate:"jobs/info",
        resource:{"Ref":"Jobs"}
    }),
    "exports": resource('exports',{"Ref":"Jobs"}),
    "exportsList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["S3ListLambda","Arn"]},
        subTemplate:fs.readFileSync(__dirname+'/list-export.vm','utf8'),
        resource:{"Ref":"exports"},
        parameterLocations:{
          "method.request.querystring.perpage":false,
          "method.request.querystring.token":false
        }
    }),
    "export": resource('{proxy+}',{"Ref":"exports"}),
    "imports": resource('imports',{"Ref":"Jobs"}),
    "exportPut":proxy({
        resource:{"Ref": "export"},
        method:"PUT",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        template:fs.readFileSync(`${__dirname}/export-start.vm`,'utf-8'),
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "exportGet":proxy({
        resource:{"Ref": "export"},
        method:"GET",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "exportDelete":proxy({
        resource:{"Ref": "export"},
        method:"delete",
        bucket:{"Ref":"ExportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "importsList":lambda({
        authorization:"AWS_IAM",
        method:"get",
        lambda:{"Fn::GetAtt":["S3ListLambda","Arn"]},
        subTemplate:fs.readFileSync(__dirname+'/list.vm','utf8'),
        resource:{"Ref":"imports"},
        parameterLocations:{
          "method.request.querystring.perpage":false,
          "method.request.querystring.token":false
        }
    }),
    "import": resource('{proxy+}',{"Ref":"imports"}),
    "importGet":proxy({
        resource:{"Ref": "import"},
        method:"get",
        bucket:{"Ref":"ImportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "importDelete":proxy({
        resource:{"Ref": "import"},
        method:"delete",
        bucket:{"Ref":"ImportBucket"},
        path:"/status/{proxy}",
        requestParams:{
            "integration.request.path.proxy":"method.request.path.proxy"
        }
    }),
    "S3ListLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["S3ListLambdaRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      }
    },
    "S3ListLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          {"Ref":"S3ListPolicy"}
        ]
      }
    },
    "S3ListPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": ["S3:List*"],
              "Resource":["*"]
            }
          ]
        }
        }
    }
}

function proxy(opts){
    return {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "NONE",
        "HttpMethod":opts.method.toUpperCase(),
        "Integration": _.pickBy({
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
          "RequestTemplates": opts.template ? {
                "application/json":{"Fn::Sub":opts.template }
          }:null,
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
        }),
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
