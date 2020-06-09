var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    var schema = {
        quiz: require('./quiz.js'),
        qna: require('./qna.js')
    }
    callback(null,schema);
}

