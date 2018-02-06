var config=require('../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region

module.exports={
    proxyLex:require('../proxy-lex/test'),
    templates:require('../routes/test'),
    routes:require('./routes'),
    workflows:require('./workflows'),
    lex:require('./lex'),
    examples:require('../examples/test')
}

