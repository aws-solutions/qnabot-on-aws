process.env.AWS_REGION=require('../../../../../config').region
var handler=require('./handler').handler
var env=require('../../../../../bin/exports')('dev/master')

env.then(function(envs){
    
handler({
    endpoint:"https://"+envs["ElasticSearchEndpoint"],
    path:`/${envs["ElasticSearchIndex"]}/_mapping/${envs["ElasticSearchType"]}`,
    method:"GET"
},{done:console.log},console.log)

})
