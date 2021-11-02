//start connection
var _=require('lodash');
var Promise=require('bluebird');
var aws=require('aws-sdk');
const qnabot = require("qnabot/logging")


function get_sentiment_from_comprehend(utterance) {
    // get sentiment and scores from utterance using Comprehend detectSentiment api
    qnabot.log("detecting sentiment from utterance using Comprehend: ", utterance);
    var keywords="";
    var comprehend = new aws.Comprehend();
    var comprehend_params = {
        LanguageCode: 'en',
        Text: utterance
    };
    return(Promise.resolve(comprehend.detectSentiment(comprehend_params).promise()))
    .then(function(data) {
        qnabot.log(JSON.stringify(data));
        return data ;
    });
}


module.exports=function(utterance){
    return get_sentiment_from_comprehend(utterance);
};


/*
var testparams = {
    question: "what is an example user question",
};
get_keywords(testparams);
*/
