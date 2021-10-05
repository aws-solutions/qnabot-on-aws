module.exports = {
    log: function (...messages) {
        console.log(messages.map(message => filter(message)).join(" "))
    }
}


const filter = text => {

    console.log("Running filter")
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
        if (process.env.QNAREDACT === "true") {
            if (process.env.REDACTING_REGEX) {
                let re = new RegExp(process.env.REDACTING_REGEX, "g");
                text = text.replace(re, "XXXXXX");
            }
        }
    }
    return text
};