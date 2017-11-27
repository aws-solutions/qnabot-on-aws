var Promise=require('./util/promise')
var aws=require('./util/aws')
var cd=new aws.CloudDirectory()
var crypto=Promise.promisifyAll(require('crypto'))

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var Name=getName(params.Name)
        cd.createSchema({
            Name:Name+"-Schema"
        }).promise()
        .tap(function(result){
            return cd.putSchemaFromJson({
                SchemaArn:result.SchemaArn,
                Document:JSON.stringify(params.Schema)
                    .replace(/"false"/g,"false")
                    .replace(/"true"/g,"true")
            }).promise()
        })
        .then(function(result){
            return cd.publishSchema({
                DevelopmentSchemaArn:result.SchemaArn,
                Version:"1.0.0"
            }).promise()
        })
        .then(function(result){
            return cd.createDirectory({
                SchemaArn:result.PublishedSchemaArn,
                Name:Name
            }).promise()
        })
        .tap(console.log)
        .then(result=>reply(null,Name,{
            SchemaArn:getSchemaArn(params,"development"),
            DirectoryArn:result.DirectoryArn,
            Name:Name,
            ObjectIdentifier:result.ObjectIdentifier,
            AppliedSchemaArn:result.AppliedSchemaArn
        }))
        .catch(reply)
    }

    Delete(ID,params,reply){
        var Name=getName(params.Name)
        params.Name=Name
        cd.listDirectories({
            state:"ENABLED"
        }).promise()
        .tap(console.log)
        .get("Directories")
        .filter(x=>(x.Name===Name && x.State==="ENABLED"))
        .log("directory Arn")
        .get(0).get("DirectoryArn")
        .tap(function(Arn){
            return cd.disableDirectory({
                DirectoryArn:Arn
            }).promise()
        })
        .log("directory disabled")
        .then(function(Arn){
            return cd.deleteDirectory({
                DirectoryArn:Arn
            }).promise()
        })
        .log("directory deleted")
        .then(function(){
            return cd.deleteSchema({
                SchemaArn:getSchemaArn(params,"published")+"/1.0.0"
            }).promise()
        })
        .log("published schema deleted")
        .tap(console.log)
        .then(function(){
            return cd.deleteSchema({
                SchemaArn:getSchemaArn(params,"development")
            }).promise()
        })
        .log("development schema deleted")
        .tap(console.log)
        .then(()=>reply(null))
        .catch(reply)
    }
}
function getName(name){
    var hash = crypto.createHash('sha256');
    hash.update(name)
	return "ENVOY-"+hash.digest('hex').slice(0,10);    
}
function getSchemaArn(params,stage){
    return [
        "arn:aws:clouddirectory:",
        process.env.AWS_REGION,
        ":",params.AccountId,
        ":schema/",stage,"/",
        params.Name,"-Schema"
    ].join("")
}
