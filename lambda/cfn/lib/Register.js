var axios=require('axios')
var sign=require('aws4').sign
var Promise=require('./util/promise')
var aws=require('./util/aws')
var Url=require('url')
var sts=new aws.STS()

module.exports=class Register extends require('./base') {
    constructor(){
        super()
    }

    Create(params,reply){
        return send('PUT')(params,reply)
    }

    Update(ID,params,oldparams,reply){
        return this.Create(params,reply)
    }

    Delete(ID,params,reply){
        return send('DELETE')(params,reply)
    }

}

function send(method){
    return function(params,reply){
        var raw=params.ApiUrl+'/accounts/self/roles/'+params.RoleName
        var url=Url.parse(raw)
        return getCredentials(params)
        .then(function(credentials){
            var request={
                host:url.host,
                method:method,
                url:raw,
                path:url.path
            }
            var signed=sign(request,credentials) 
            return Promise.resolve(axios(signed))
        }).get('data').log('result').tapCatch(console.log)
        .then(()=>reply(null,params.RoleName))
        .catch(err=>reply(err))
    }
}

function getCredentials(params){
    var url=Url.parse(params.ApiUrl)
    var host=url.host
    var stage=params.ApiStage || 'prod'
    var base="https://"+host

    return Promise.resolve(axios.get(base+'/'+stage+'/info'))
    .get('data')
    .log('info')
    .then(function(info){
        return sts.assumeRole({
            RoleArn:info.RegisterRoleArn,
            RoleSessionName:params.AccountId  
        }).promise()
    })
    .log('creds-data')
    .then(x=>sts.credentialsFrom(x))
    .log('creds')
}
