const path = require('path');
const fs = require("fs");
const AWS=require('aws-sdk')

const { Readable } = require("stream");



exports.handler =  async function(event, context) {
    try {
            var url = await createCallFlow();
            return createResponse(302,
            {
                Location: url,
                'Cache-Control': "max-age=0"
            }, "")
    } catch (e) {
        console.log(e)
        return{
            statusCode: 500,
            message: e
        }
    }


    
  }
  
    function createResponse(statusCode, headers, responseBody)
  {
      response = {
        "statusCode": statusCode,
        "headers": headers,
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    };
      console.log(JSON.stringify(response));
      return  response
  }
  

  function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async function createCallFlow() {
    console.log(process.cwd())
    let flows = fs.readdirSync("flows");
    if(flows.length != 1)
    {
        throw {
            message: "Exactly one contact flow is currently supported"
        }
    }
    let flowfile = path.join("./flows",flows[0])
    let rawdata = fs.readFileSync(flowfile);
    let flow = JSON.parse(rawdata);
    let userInputModules = flow["modules"]
        .filter(module => module.type == "GetUserInput")
        .filter(module => module.parameters.filter(parameter => parameter.name == "BotName").length > 0)
        .filter(module => module.branches.filter(branch => branch.condition == "Evaluate" 
                                                        && branch.conditionValue 
                                                        && branch.conditionValue.includes("fulfilment_Intent")).length > 0)
    for(element of userInputModules)
    {

            botParm = element.parameters.find(parm => parm.name == "BotName" )
            botParm.Value = process.env.lexBot;
            botBranchesIntent = element.branches.find(parm => parm.conditionValue.startsWith("fulfilment_Intent"));
            botBranchesIntent.conditionValue = process.env.intent;
            botBranchesFallbackIntent = element.branches.find(parm => parm.conditionValue.includes("fallbackfulfilment_Intent"));
            botBranchesFallbackIntent.conditionValue = process.env.fallBackIntent;
        
    };
    

    const s3 = new AWS.S3();
    const key = uuidv4() ;
    
    let outfile = path.join("/tmp/",key + ".json");

    
    fs.writeFileSync(outfile,JSON.stringify(outfile));

    await s3.putObject({
          Bucket: process.env.outputBucket,
          Key: process.env.s3Prefix + key + ".json",
          Body: JSON.stringify(flow),
          ContentDisposition: `attachment; filename="${key}"`
      }).promise()


    let params =
    {
        Bucket: process.env.outputBucket,
        Key: process.env.s3Prefix + key + ".json" 
    }

    var signed_url =  await new Promise(r => s3.getSignedUrl('getObject',
    params,
    async (e, url) => {
        if (e) {
            // Execute callback with caught error
            console.log(e)
            await fn(e);
            this.error(e); // Throw error if not done in callback
        }
        r(url); // return the url
    }));
    return signed_url;
  }
