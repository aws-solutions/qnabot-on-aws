const Promise = require('bluebird')
const _ = require('lodash')
const AWS = require('aws-sdk');
const qnabot = require("qnabot/logging")


async function get_userLanguages(inputText) {
    const params = {
        Text: inputText /* required */
    };
    const comprehendClient = new AWS.Comprehend();
    const languages = comprehendClient.detectDominantLanguage(params).promise();
    return languages;
}

async function get_terminologies(sourceLang) {
    const translate = new AWS.Translate();
    qnabot.log("Getting registered custom terminologies");
    const configuredTerminologies = await translate.listTerminologies({}).promise();
    qnabot.log("terminology response " + JSON.stringify(configuredTerminologies));
    const sources = configuredTerminologies["TerminologyPropertiesList"].filter(t => t["SourceLanguageCode"] == sourceLang).map(s => s.Name);
    qnabot.log("Filtered Sources " + JSON.stringify(sources));
    return sources;
}

async function get_translation(inputText, sourceLang, targetLang, req) {
    const customTerminologyEnabled = _.get(req._settings, "ENABLE_CUSTOM_TERMINOLOGY") == true;
    qnabot.log("get translation request " + JSON.stringify(inputText));
    const params = {
        SourceLanguageCode: sourceLang, /* required */
        TargetLanguageCode: targetLang, /* required */
        Text: inputText, /* required */
    };
    qnabot.log("get_translation:", targetLang, "InputText: ", inputText);
    if (targetLang === sourceLang) {
        qnabot.log("get_translation: source and target are the same, translation not required." + inputText);
        return inputText;
    }
    if (customTerminologyEnabled) {
        qnabot.log("Custom terminology enabled");
        const customTerminologies = await get_terminologies(sourceLang);
        qnabot.log("Using custom terminologies " + JSON.stringify(customTerminologies));
        params["TerminologyNames"] = customTerminologies;
    }
    const translateClient = new AWS.Translate();
    try {
        qnabot.log("Fulfillment params " + JSON.stringify(params));
        const translation = await translateClient.translateText(params).promise();
        qnabot.log("Translation response " + JSON.stringify(translation));
        return translation.TranslatedText;
    } catch (err) {
        qnabot.log("warning - error during translation. Returning: " + inputText);
        return inputText;
    }
}

function set_userLocale(Languages, userPreferredLocale, defaultConfidenceScore, req) {
    let locale = '';
    let userDetectedLocaleConfidence = Languages.Languages[0].Score;
    let userDetectedLocale = Languages.Languages[0].LanguageCode;
    let isPreferredLanguageDetected = false;
    let i = 0;
    let userDetectedSecondaryLocale;

    qnabot.log("preferred lang", userPreferredLocale);
    for (i = 0; i <= Languages.Languages.length - 1; i++) {
        qnabot.log("found lang: " + Languages.Languages[i].LanguageCode);
        qnabot.log("score: " + Languages.Languages[i].Score);
        if (Languages.Languages[i].LanguageCode === userPreferredLocale) {
            isPreferredLanguageDetected = true;
            userDetectedLocale = Languages.Languages[i].LanguageCode;
        }
        if (i > 0 && Languages.Languages[i].LanguageCode !== 'en' && userDetectedSecondaryLocale === undefined) {
            userDetectedSecondaryLocale = Languages.Languages[i].LanguageCode;
        }
    }
    qnabot.log("isPreferredLanguageDetected", isPreferredLanguageDetected);
    qnabot.log("detected locale", userDetectedLocale);
    qnabot.log("detected secondary locale", userDetectedSecondaryLocale);
    qnabot.log("detected Confidence", userDetectedLocaleConfidence);

    _.set(req.session, "userDetectedLocale", userDetectedLocale);
    _.set(req.session, "userDetectedLocaleConfidence", userDetectedLocaleConfidence);
    if (userDetectedSecondaryLocale) {
        _.set(req.session, "userDetectedSecondaryLocale", userDetectedSecondaryLocale);
    } else {
        if (req.session.userDetectedSecondaryLocale) delete req.session.userDetectedSecondaryLocale;
    }

    if (userPreferredLocale && userDetectedLocale !== '') {
        locale = userPreferredLocale;
        qnabot.log("set user preference as language to use: ", locale);
    } else if ((userPreferredLocale === undefined || userPreferredLocale === '') && userDetectedLocaleConfidence <= defaultConfidenceScore) {
        locale = 'en'; // default to english
        qnabot.log("Detected language confidence too low, defaulting to English");
    } else {
        locale = userDetectedLocale;
        qnabot.log("set detected language as language to use: ", locale);
    }
    return locale;
}

async function set_translated_transcript(locale, req) {
    const SessionAttributes = _.get(req, 'session');
    const detectedLocale = SessionAttributes.userDetectedLocale;
    const detectedSecondaryLocale = SessionAttributes.userDetectedSecondaryLocale;

    if ( ! req.question.toLowerCase().startsWith("qid::")) {
        if (locale === 'en' && detectedLocale === 'en' && detectedSecondaryLocale === undefined) {
            qnabot.log("No translation - english detected");
        } else if (locale === 'en' && detectedLocale === 'en' && detectedSecondaryLocale) {
            qnabot.log("translate to english using secondary detected locale:  ", req.question);
            const translation = await get_translation(req.question, detectedSecondaryLocale, 'en',req);

            _.set(req, "_translation", translation);
            _.set(req, "question", translation);
            qnabot.log("Overriding input question with translation: ", req.question);
        }  else if (locale !== '' && locale.charAt(0) !== '%' && detectedLocale && detectedLocale !== '') {
            qnabot.log("Confidence in the detected language high enough.");
            const translation = await get_translation(req.question, detectedLocale, 'en',req);

            _.set(req, "_translation", translation);
            _.set(req, "question", translation);
            qnabot.log("Overriding input question with translation: ", req.question);
        }  else {
            qnabot.log ('not possible to perform language translation')
        }
    } else {
        qnabot.log("Question targeting specified Qid (starts with QID::) - skip translation");
    }

}

exports.set_multilang_env = async function (req) {
    // Add QnABot settings for multilanguage support
    qnabot.log("Entering multilanguage Middleware");
    qnabot.log("req:", req);

    let userLocale = '';
    const defaultConfidenceScore = req._settings.MINIMUM_CONFIDENCE_SCORE;
    const userLanguages = await get_userLanguages(req.question);
    const userPreferredLocale = _.get(req, "session.qnabotcontext.userPreferredLocale") ? req.session.qnabotcontext.userPreferredLocale : '';
    userLocale = set_userLocale(userLanguages, userPreferredLocale, defaultConfidenceScore, req);
    _.set(req.session, "qnabotcontext.userLocale", userLocale);
    _.set(req._event, "origQuestion", req.question);
    await set_translated_transcript(userLocale, req);

    return req;
}


exports.translateText = async function (inputText, sourceLang, targetLang,req) {
    const res = await get_translation(inputText, sourceLang, targetLang,req);
    return res.TranslatedText;
}

exports.get_translation = get_translation;

