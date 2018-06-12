var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()

module.exports=class ESCognitoClient extends require('./base') {
    constructor(){
        super()
    }
    async Create(params,reply){
        run(params,reply)
    }
    async Update(Id,params,oldparams,reply){
        run(params,reply)
    }
}

async function run(params,reply){
    try{
        var userpool=params.UserPool

        var clients=await cognito.listUserPoolClients({
            UserPoolId:userpool,
            MaxResults:10
        }).promise()
        console.log(clients)
        var client=clients.UserPoolClients
            .filter(x=>x.ClientName.match(/AWSElasticsearch/))
            [0].ClientId
       
        console.log(client)
        var info=await cognito.describeUserPoolClient({
            ClientId:client,
            UserPoolId:userpool
        }).promise()

        console.log(info)
        reply(null,client,info.UserPoolClient)
    }catch(e){
        console.log(e)
        reply(e)
    }
}


