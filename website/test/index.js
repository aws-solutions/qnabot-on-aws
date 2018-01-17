require('jsdom-global')()
module.exports={
    unit:require('./compiled'),
    endtoend:require('./e2e')
}
