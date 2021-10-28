const AWS = require("aws-sdk")

module.exports = {
    log: function (...messages) {
        console.log(messages.map(message => filter(message)).join(" "))
    },
    filter_comprehend_pii: filter_comprehend_pii,
    isPIIDetected: isPIIDetected,
    setPIIDetectionEnv: isPIIDetected //just to be idiomatic.
}

function filter_comprehend_pii(text) {
    if (!process.env.found_comprehend_pii) {
        return text
    }

    let regex = process.env.found_comprehend_pii.split(",").map(pii => `(${pii})`).join("|")
    let re = new RegExp(regex, "g");

    return text.replace(re, "XXXXXX");
}

const filter = text => {

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

async function isPIIDetected(text, useComprehendForPII, piiRegex, pii_rejection_entity_types, pii_confidence_score = .99) {

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
        try {
            var comprehendResult = await comprehend_client.detectPiiEntities(params).promise();
            if (!("Entities" in comprehendResult) || comprehendResult.Entities.length == 0) {
                console.log("No PII found by Comprehend")
                return false;
            }
            let pii_rejection_entity_list = pii_rejection_entity_types.toLowerCase().split(",")
            let entitiesToFilter = comprehendResult.Entities.filter(entity => entity.Score >= pii_confidence_score && pii_rejection_entity_list.indexOf(entity.Type.toLowerCase()) != -1)
            //For now, we *redact* all detected PII from CloudWatch.  We accept any PII for processing that is listed PII_REJECTION_IGNORE_TYPES
            process.env.found_comprehend_pii = comprehendResult.Entities.map(entity => text.slice(entity.BeginOffset, entity.EndOffset))
            return entitiesToFilter.length != 0 || found_redacted_pii;;

        } catch (exception) {
            console.log("Warning: Exception while trying to detect PII with Comprehend. All logging is disabled.");
            console.log("Exception " + exception);
            process.env.DISABLECLOUDWATCHLOGGING = true //if there is an error during Comprehend PII detection, turn off all logging for this request
            return false;
        }

    }

}
