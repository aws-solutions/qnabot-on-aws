var fs=require('fs')
var mock=require('../util/mock')

module.exports={
"rootGet": mock({
    auth:'NONE',
    method:"GET",
    subTemplate:"root/info",
    resource:{"Fn::GetAtt": ["API","RootResourceId"]}
})
}
    
