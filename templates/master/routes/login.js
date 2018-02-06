var fs=require('fs')
var resource=require('./util/resource')
var redirect=require('./util/redirect')

module.exports={
    "Login":resource('pages'),
    "DesignerLoginResource":resource('designer',{"Ref":"Login"}),
    "ClientLoginResource":resource('client',{"Ref":"Login"}),
    "DesignerLoginResourceGet":redirect(
        {"Fn::GetAtt":["DesignerLogin","loginUrl"]},
        {"Ref":"DesignerLoginResource"}),
    "ClientLoginResourceGet":redirect(
        {"Fn::GetAtt":["ClientLogin","loginUrl"]},
        {"Ref":"ClientLoginResource"})
}
    
