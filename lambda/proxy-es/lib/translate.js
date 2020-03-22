const Promise = require('bluebird')
const _ = require('lodash')
const AWS = require('aws-sdk');

async function get_translation(englishText, targetLang){
    const params = {
        SourceLanguageCode: 'en', /* required */
        TargetLanguageCode: targetLang, /* required */
        Text: englishText, /* required */
    };
    console.log("get_translation:", targetLang, "InputText: ", englishText);
    if (targetLang === 'en') {
        console.log("get_translation: target is en, translation not required. Return english text");
        return englishText;
    }

    const translateClient = new AWS.Translate();
    try {
        console.log("input text:", englishText);
        const translation = await translateClient.translateText(params).promise();
        console.log("translation:", translation);
        return translation.TranslatedText;
    } catch (err) {
        console.log("warning - error during translation: ", err);
        return englishText;
    }
}

exports.translate_hit = async function(hit,usrLang){
    console.log("translate_hit:", JSON.stringify(hit,null,2));

    var hit_out = _.cloneDeep(hit);
    var a = _.get(hit, "a");
    var markdown = _.get(hit, "alt.markdown");
    var ssml = _.get(hit, "alt.ssml");
    var r = _.get(hit, "r");
    // catch and log errors before throwing exception.
    if (a && _.get(hit,'autotranslate.a')) {
        try {
            hit_out.a = await get_translation(hit_out.a, usrLang) ; 
        } catch (e) {
            console.log("ERROR: Answer caused Translate exception: ", a)
            throw (e);
        }
    }
    if (markdown && _.get(hit,'autotranslate.alt.markdown')) {
        try {
            hit_out.alt.markdown = await get_translation(hit_out.alt.markdown, usrLang) ; 
        } catch (e) {
            console.log("ERROR: Markdown caused Translate exception: ", a)
            throw (e);
        }
    }
    if (ssml && _.get(hit,'autotranslate.alt.ssml')) {
        try {
            hit_out.alt.ssml = await get_translation(hit_out.alt.ssml, usrLang) ; 
        } catch (e) {
            console.log("ERROR: SSML caused Translate exception: ", a)
            throw (e);
        }
    }
    if (r) {
        try {
            if (r.subTitle && r.subTitle.length > 0  && _.get(hit,'autotranslate.r.subTitle')) {
                hit_out.r.subTitle = await get_translation(hit_out.r.subTitle, usrLang) ;
            }
            if (r.title && r.title.length > 0 && _.get(hit,'autotranslate.r.title')) {
                hit_out.r.title = await get_translation(hit_out.r.title, usrLang) ;
            }
            if (r.text && r.text.length > 0) {
                // no op
            }
            if (r.imageUrl && r.imageUrl.length > 0) {
                // no op
            }
            if (r.url && r.url.length > 0) {
                // no op
            }
            if (r.buttons && r.buttons.length > 0) {
                for (let x=0; x<r.buttons.length; x++) {
                    if (_.get(hit,'autotranslate.r.buttons[x].text')) {
                        hit_out.r.buttons[x].text = await get_translation(hit_out.r.buttons[x].text, usrLang) ;
                    }
                    if (_.get(hit,'autotranslate.r.buttons[x].value')) {
                        hit_out.r.buttons[x].value = await get_translation(hit_out.r.buttons[x].value, usrLang) ;
                    }                    
                }
            }
        } catch (e) {
            console.log("ERROR: response card fields format caused Translate exception. Check syntax: " + e );
            throw (e);
        }

    }
    console.log("Preprocessed Result: ", hit_out);
    return hit_out;    
}
