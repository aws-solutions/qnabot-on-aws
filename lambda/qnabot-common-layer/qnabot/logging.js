const AWS = require("aws-sdk")


function filter_comprehend_pii(text) {
    if(process.env.ENABLE_REDACTING_WITH_COMPREHEND !== "true"){
        return text
    }
    if (!process.env.found_comprehend_pii) {
        return text
    }

    let regex = process.env.found_comprehend_pii.split(",").map(pii => `(${pii})`).join("|")

    let re = new RegExp(regex, "g");
    return text.replace(re, "XXXXXX");
}

function filter(text){

    if (process.env.DISABLECLOUDWATCHLOGGING === "true") {
        return "cloudwatch logging disabled";
    } else {
        // always redact jwts
        if (typeof text === "object") {
            text = JSON.stringify(text)
        }
        if (typeof text !== 'string') {
            text = String(text)
        }
        if (text === undefined) {
            return ""
        }

        text = text.replace(/"accesstokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"accesstokenjwt":"<token redacted>"');
        text = text.replace(/"idtokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"idtokenjwt":"<token redacted>"');
        text = text.replace(/"refreshtoken":\s*"[^"]+?([^\/"]+)"/g, '"refreshtoken":"<token redacted>"');
        text = filter_comprehend_pii(text)
    }
    if (process.env.QNAREDACT === "true") {
        if (process.env.REDACTING_REGEX) {
            let re = new RegExp(process.env.REDACTING_REGEX, "g");
            text = text.replace(re, "XXXXXX");
        }
    }
    return text
};

const comprehend_client = new AWS.Comprehend();

async function isPIIDetected(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score = .99){
   try{
    let detectionResult = await _detectPii(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score)
    //Ugly hack to prevent Comprehend PII Detection from being called twice unnecessarily
    process.env.comprehendResult = JSON.stringify(detectionResult.comprehendResult) 
    return detectionResult.pii_detected
   }catch(e){
        console.warn("Error calling Amazon Comprehend ", e)
        return false;
   }

}

async function setPIIRedactionEnvironmentVars(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score = .99){
    try{

        let detectionResult = await _detectPii(text, useComprehendForPII, piiRegex, pii_entitites, pii_confidence_score)
        //Ugly hack to prevent Comprehend PII Detection from being called twice unnecessarily
        process.env.comprehendResult = JSON.stringify(detectionResult.comprehendResult) 
        process.env.found_comprehend_pii = detectionResult.foundPII
    }catch(e){
        console.warn("Warning: Exception while trying to detect PII with Comprehend. All logging is disabled.");
        console.warn("Exception ",e);
        //if there is an error during Comprehend PII detection, turn off all logging for this request
        process.env.DISABLECLOUDWATCHLOGGING = true 
    }

 }

async function _getPIIEntities(params){
    if(process.env.comprehendResult){
        try{
           return JSON.parse(process.env.comprehendResult)
        }catch(e){
        }
    }
    return await comprehend_client.detectPiiEntities(params).promise();
}

function filterFoundEntities(comprehendResult,entity_allow_list,comprehend_confidence_score){
    return comprehendResult.Entities.filter(entity => entity.Score >= comprehend_confidence_score && entity_allow_list.indexOf(entity.Type.toLowerCase()) != -1)
}

async function _detectPii(text, useComprehendForPII, piiRegex, pii_rejection_entity_types, pii_confidence_score = .99) {

    let found_redacted_pii = false
    if (piiRegex) {
        let re = new RegExp(piiRegex, "g");
        let redacted_text = text.replace(re, "XXXXXX");
        found_redacted_pii = redacted_text != text;
    } else {
        console.log("Warning: No value found for setting  PII_REJECTION_REGEX not using REGEX Matching")
    }
    if (useComprehendForPII) {
        var params = {
            LanguageCode: "en",
            Text: text
        };
        let comprehendResult = await _getPIIEntities(params)
        if (!("Entities" in comprehendResult) || comprehendResult.Entities.length == 0) {
            console.log("No PII found by Comprehend")
            return {
                pii_detected: false,
                comprehendResult: comprehendResult
            };
        }
        let foundPII = comprehendResult.Entities.map(entity => text.slice(entity.BeginOffset, entity.EndOffset))
        let foundEntities = filterFoundEntities(comprehendResult,pii_rejection_entity_types.toLowerCase().split(","),pii_confidence_score)
        return {
            pii_detected: foundEntities.length != 0 || found_redacted_pii,
            comprehendResult: comprehendResult,
            foundPII: foundPII
        }
    }
}

module.exports = {
    log: function (...messages) {
        console.log(messages.map(message => filter(message)).join(" "))
    },
    warn: function (...messages) {
        console.warn(messages.map(message => filter(message)).join(" "))
    },
    debug: function(...messages){
        if(process.env.ENABLE_DEBUG_LOGGING == "true"){
            console.debug(messages.map(message => filter(message)).join(" "))
        }
    },
    redact_text: filter,
    filter_comprehend_pii: filter_comprehend_pii,
    isPIIDetected: isPIIDetected,
    setPIIRedactionEnvironmentVars: setPIIRedactionEnvironmentVars 
}

