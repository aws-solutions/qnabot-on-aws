const Promise = require('bluebird')
const _ = require('lodash')
const AWS = require('aws-sdk');

exports.get_translation = async function(inputText, targetLang){
    const params = {
        SourceLanguageCode: 'en', /* required */
        TargetLanguageCode: targetLang, /* required */
        Text: inputText, /* required */
    };
    console.log("get_translation:", targetLang, "InputText: ", inputText);
    if (targetLang === 'en') {
        console.log("get_translation: target is en, translation not required. Return input text");
        return inputText;
    }
    console.log("Auto translating defaultLang answer to language:", targetLang);
    
    const translateClient = new AWS.Translate();
    try {
        console.log("input text:", inputText);
        const translation = await translateClient.translateText(params).promise();
        console.log("translation:", translation);
        return translation.TranslatedText;
    } catch (err) {
        console.log("warning - error during translation: ", err);
        return inputText;
    }
}
