exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var approvedDomain = process.env.APPROVED_DOMAIN;
    
    if(approvedDomain){
        var regex=new RegExp(`^[A-Za-z0-9._%+-]+@${approvedDomain}$`)
        if (event.request.userAttributes.email.match(regex)) {
            context.done(null, event);
        }else{
            var error = new Error('EMAIL_DOMAIN_DENIED_ERR');
            context.done(error, event);
        }
    }else{
        context.done(null,event) 
    }
};

