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
        "HandlerArn":get("QnABot","HandlerArn"),
        "Botname":  get("QnABot","Bot"),
        "SlotType": get("QnABot","SlotType"),
        "Intent":   get("QnABot","Intent"),
        "Username":{"Ref":"Username"},
        "Email":{"Ref":"Email"},
        "PublicOrPrivate":{"Ref":"PublicOrPrivate"},
        "ApprovedDomain":{"Ref":"ApprovedDomain"},
        "Utterances":{"Fn::Join":["\n",
            require('../../lambda/handler/lib/default-utterances')
        ]}
    }),
    "dashboard":stack('dashboard',{
        "Name":{"Ref":"AWS::StackName"},
        "APIGateWay":   get('api','ApiId'),
        "ESDomain":     get('domain','ESDomain'),
        "BotName":      get("QnABot","Bot"),
        "HandlerLambda":      get("QnABot","HandlerName")
    })
}

function get(stack,name){
    return {"Fn::GetAtt":[stack,"Outputs."+name]}
}
