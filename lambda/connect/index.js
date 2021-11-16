const path = require('path');
const fs = require("fs");
const AWS=require('aws-sdk');


exports.handler =  async function(event, context) {
    try {
        var result;
        result = await createCallFlowLexV2();
        return result;
    } catch (e) {
        console.log(e);
        return{
            statusCode: 500,
            message: e
        };
    }
};

async function createCallFlowLexV2() {
    
    // Lex botAliasArn is of the format: arn:aws:lex:ca-central-1:123456789012:bot-alias/2S1UMN0YHX/RMG8IVED3J
    // NOTE: It's not yet clear if/how to associate GetCustomerInput block to specific localeId.. it seems to default to en_US. Requires further research.
    let botAliasArn = "arn:aws:lex:";
    botAliasArn += process.env.region + ":";
    botAliasArn += process.env.accountId + ":bot-alias/";
    botAliasArn += process.env.LexV2BotId + "/";
    botAliasArn += process.env.LexV2BotAliasId ;
    console.log("Building Connect contact flow for LexV2 bot. BotAliasArn: ", botAliasArn);

    let dir = `${__dirname}/flowsv2`;
    let flows = fs.readdirSync(dir);
    if(flows.length != 1)
    {
        throw {
            message: "Exactly one contact flow is currently supported"
        };
    }
    let flowfile = path.join(dir,flows[0]);
    console.log("Processing contact flow file: ", flowfile);
    let rawdata = fs.readFileSync(flowfile);
    let flow = JSON.parse(rawdata);
    let userInputModules = flow["modules"]
        .filter(module => module.type == "GetUserInput")
        .filter(module => module.parameters.filter(parameter => parameter.name == "BotAliasArn").length > 0);

    for(var element of userInputModules)
    {
        let botParm = element.parameters.find(parm => parm.name == "BotAliasArn");
        botParm.value = botAliasArn;

        let metadata = element.metadata;
        metadata.lexV2BotName = process.env.LexV2BotName;
        metadata.lexV2BotAliasName = process.env.LexV2BotAlias;
    }
    
    let configFile = path.join(`${__dirname}`,"questions.json");
    let config = fs.readFileSync(configFile);
    config = JSON.parse(config);
    
    return {
      CallFlow: flow,
      FileName: flows[0],
      QnaFile: config.FlowInfos.filter(c => c.ContactFlow == flows[0])[0].QnAExample
    };
}