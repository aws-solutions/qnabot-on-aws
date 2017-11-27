var Promise=require('./util/promise')
var aws=require('./util/aws')
var cd=new aws.CloudDirectory()

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }

    Create(params,reply){
        console.log(params)
        cd.createObject(params).promise()
        .get("ObjectIdentifier")
        .then(id=>reply(null,id))
        .tapCatch(console.log)
        .catch(x=>reply(null))
    }
}

