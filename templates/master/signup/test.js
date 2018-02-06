var handler=require('./signup').handler
process.env.APPROVED_DOMAIN='amazon.com'
handler({
    request:{
        userAttributes:{
            email:"example@amazon.com"
        },
        codeParameter:'asdf4ds'
    },
    response:{

    }
},{done:console.log},console.log)
