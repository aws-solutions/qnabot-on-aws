//start connection
var Promise=require('bluebird');
var aws=require('aws-sdk');

//TODO - make config params
var use_keyword_filters = 1;
var keyword_syntax_types = ['NOUN', 'PROPN', 'VERB', 'ADJ', 'INTJ'];
var syntax_confidence_limit = .20;
var stopwords = ["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it",
                "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these",
                "they", "this", "to", "was", "will", "with"
                ] ;

function get_keywords_from_comprehend(params) {
    // get keywords from question using Comprehend syntax api
    var keywords="";
    aws.config.update({region:'us-east-1'});

    var comprehend = new aws.Comprehend();
    var comprehend_params = {
        LanguageCode: 'en',
        Text: params.question
    };
    return(comprehend.detectSyntax(comprehend_params).promise())
    .then(function(data) {
        for (var syntaxtoken of data.SyntaxTokens) {
            console.log(
                "WORD = '" + syntaxtoken.Text + "', "
                + "PART OF SPEECH = " + syntaxtoken.PartOfSpeech.Tag + ", "
                + "SCORE: " + syntaxtoken.PartOfSpeech.Score);
            if (keyword_syntax_types.indexOf(syntaxtoken.PartOfSpeech.Tag) != -1) {
                if (stopwords.indexOf(syntaxtoken.Text.toLowerCase()) == -1) {
                    if (syntaxtoken.PartOfSpeech.Score >= syntax_confidence_limit) {
                        console.log("+KEYWORD: " + syntaxtoken.Text);
                        keywords = keywords + syntaxtoken.Text + " ";
                    } else {
                        console.log("X score < ", syntax_confidence_limit, " (threshold)");
                    }
                } else {
                    console.log("X '" + syntaxtoken.Text + "' is a stop word");
                }
            } else {
                console.log("X part of speech not in list:", keyword_syntax_types);
            }
        }
        if (keywords.length == 0) {console.log("Keyword list empty - no query filter applied")}
        else {console.log("KEYWORDS:",keywords)}
        return keywords;
    });
}

function get_keywords(params) {
    if (use_keyword_filters) {
        console.log("use_keyword_filters is true; detecting keywords from question using Comprehend");
        return get_keywords_from_comprehend(params);
    } else {
        console.log("use_keyword_filters is false");
        return Promise.resolve("");
    }   
}

module.exports=function(params){
    return get_keywords(params);
};


/*
var testparams = {
    question: "what is an example user question",
};
get_keywords(testparams);
*/
