var Promise = require('bluebird')
var _ = require('lodash')
var AWS = require('aws-sdk');

async function get_userLanguages(inputText) {
    const params = {
        Text: inputText /* required */
    };
    var comprehendClient = new AWS.Comprehend();
    var languages = comprehendClient.detectDominantLanguage(params).promise();
    return languages;
}

async function get_translation(inputText, lang) {
    const params = {
        SourceLanguageCode: lang, /* required */
        TargetLanguageCode: 'en', /* required */
        Text: inputText, /* required */
    };
    var translateClient = new AWS.Translate();
    var translation = await translateClient.translateText(params).promise();

    return translation;
}

function set_userLocale(Languages, userPreferredLocale, defaultConfidenceScore, req) {
    var locale = '';
    var userDetectedLocaleConfidence = Languages.Languages[0].Score;
    var userDetectedLocale = Languages.Languages[0].LanguageCode;
    var isPreferredLanguageDetected = false;
    var i = 0;

    console.log("preferred lang", userPreferredLocale);
    for (i = 0; i <= Languages.Languages.length - 1; i++) {
        if (Languages.Languages[i].LanguageCode === userPreferredLocale) {
            console.log("detected lang", Languages.Languages[i].LanguageCode);
            isPreferredLanguageDetected = true;
        }
    }
    console.log("isPreferredLanguageDetected", isPreferredLanguageDetected);
    console.log("detected lang", userDetectedLocale);
    console.log("detected Confidence", userDetectedLocaleConfidence);

    _.set(req._event.sessionAttributes, "userDetectedLocale", userDetectedLocale);
    _.set(req._event.sessionAttributes, "userDetectedLocaleConfidence", userDetectedLocaleConfidence);

    if (userPreferredLocale && userDetectedLocale !== '') {
        locale = userPreferredLocale;
        console.log("set user preference as language to use: ", locale);
    } else if ((userPreferredLocale === undefined || userPreferredLocale === '') && userDetectedLocaleConfidence <= defaultConfidenceScore) {
        locale = 'en';
        console.log("defaulting locale to en as userDetectedLocaleConfidence not high enough.");
    } else {
        locale = userDetectedLocale;
        console.log("set detected language as language to use: ", locale);
    }
    return locale;
}

async function set_translated_transcript(locale, req) {
    var SessionAttributes = _.get(req._event, 'sessionAttributes');
    var detectedLocale = SessionAttributes.userDetectedLocale;
    var detectedConfidence = SessionAttributes.userDetectedLocaleConfidence;

    if ((locale == '' && detectedLocale != 'en') || (locale == '' && detectedLocale == 'en' && detectedConfidence < 0.5)) {
        _.set(req._event, "inputTranscript", "set language preference");
        console.log("confidence not high enough asking for a preferred language to use, new transcript:  ", req._event.inputTranscript);
    }

    if (locale != '' && locale != 'en' && locale.charAt(0) != '%') {
        console.log("Confidence in the detected language high enough.");
        var translation = await get_translation(req._event.inputTranscript, locale);
        _.set(req, "_translation", translation.TranslatedText);
        _.set(req._event, "inputTranscript", translation.TranslatedText);
        console.log("Overriding input transcript with translation: ", req._event.inputTranscript);
    }
    if (locale.charAt(0) === '%') {
        console.log("Using a language with low confidence and preferred language not detected.");
        _.set(req._event, "inputTranscript", "please speak your language");
        _.set(req._event.sessionAttributes, "userLocale", locale.slice(1));
    }

}

exports.set_multilang_env = async function (req) {
    // Add QnABot settings for multilanguage support
    console.log("Entering multilanguage Middleware");
    console.log("req:", req);

    var userLocale = '';
    var defaultConfidenceScore = req._settings.MINIMUM_CONFIDENCE_SCORE;

    var userLanguages = await get_userLanguages(req._event.inputTranscript);

    const userPreferredLocale = req._event.sessionAttributes.userPreferredLocale ? req._event.sessionAttributes.userPreferredLocale : '';

    userLocale = set_userLocale(userLanguages, userPreferredLocale, defaultConfidenceScore, req);
    _.set(req._event.sessionAttributes, "userLocale", userLocale);
    _.set(req._event, "origTranscript", req._event.inputTranscript);
    await set_translated_transcript(userLocale, req);

    return req;
}
