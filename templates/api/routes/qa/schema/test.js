process.env.AWS_REGION=require('../../../../../config').region
var handler=require('./handler').handler
var env=require('../../../../../bin/exports')()

env.then(function(envs){
    
handler({
    endpoint:"https://"+envs["QNA-DEV-ES-ADDRESS"],
    path:`/${envs["QNA-DEV-INDEX"]}/_mapping/${envs["QNA-DEV-TYPE"]}`,
    method:"GET"
},{done:console.log},console.log)

})
