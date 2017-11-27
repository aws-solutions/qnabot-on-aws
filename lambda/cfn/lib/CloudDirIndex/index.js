var Promise=require('../util/promise')
var aws=require('../util/aws')
var cd=new aws.CloudDirectory({
    params:{DirectoryArn:process.env.DIRECTORYARN}
})
module.exports=class CognitoUser extends require('../base') {
    constructor(){
        super()
    }
    
    Create(params,reply){
        console.log(params)
        var tmp=JSON.stringify(params)
        params=JSON.parse(tmp.replace(/"true"/g,"true")
            .replace(/"false"/g,"false"))
        console.log(params)
        cd.createIndex(params).promise()
        .get("ObjectIdentifier")
        .then(id=>reply(null,id))
        .tapCatch(console.log)
        .catch(x=>reply(null))
    }
    
}

