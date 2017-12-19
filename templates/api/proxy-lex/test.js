process.env.AWS_REGION=require('../../../config').region
var handler=require('./handler').handler
handler({
    fnc:'getBots',
    params:{maxResults:2}
},{done:console.log},console.log)
