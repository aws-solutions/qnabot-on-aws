var stack=require('../util').stack
var config=require('./config')
module.exports={
    "domain":stack('domain'),
    "QnABot":stack('lex',{
        "Address":  get('domain','ESAddress'),
        "DomainArn":get("domain","ESArn"),
        "Type":     get("domain","Type"),
        "Index":    get("domain","Index"),
        "ErrorMessage":config.ErrorMessage,
        "EmptyMessage":config.EmptyMessage
    }),
    "api":stack('api',{
        "Botname":  get("QnABot","Bot"),
        "SlotType": get("QnABot","SlotType"),
        "Intent":   get("QnABot","Intent"),
        "Username":{"Ref":"Username"},
        "Email":{"Ref":"Email"},
        "FulfillmentArn":get("QnABot","FulfillmentArn"),
        "PublicOrPrivate":{"Ref":"PublicOrPrivate"},
        "ApprovedDomain":{"Ref":"ApprovedDomain"},
        "ESAddress":  get('domain','ESAddress'),
        "ESDomainArn":get("domain","ESArn"),
        "ESType":     get("domain","Type"),
        "ESIndex":    get("domain","Index")
    }),
    "dashboard":stack('dashboard',{
        "Name":{"Ref":"AWS::StackName"},
        "APIGateWay":   get('api','ApiId'),
        "ESDomain":     get('domain','ESDomain'),
        "BotName":      get("QnABot","Bot"),
        "FulfillmentLambda":      get("QnABot","FulfillmentName")
    })
}

function get(stack,name){
    return {"Fn::GetAtt":[stack,"Outputs."+name]}
}
