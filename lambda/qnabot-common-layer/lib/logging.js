module.exports={
    log: function(...messages){
        console.log(messages.reduce((message,text) => message + " " + filter(text)))
    }
}

const filter = text => {

    if (process.env.DISABLECLOUDWATCHLOGGING === "true") {
        return "cloudwatch logging disabled";
    } else {
        // always redact jwts
        if(typeof text === "object"){
            text = JSON.stringify(text)
        }
        if(typeof text !== 'string'){
            text = String(text)
        }
        if(text === undefined){
            return ""
        }
        text = text.replace(/"accesstokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"accesstokenjwt":"<token redacted>"');
        text = text.replace(/"idtokenjwt":\s*"[^"]+?([^\/"]+)"/g, '"idtokenjwt":"<token redacted>"');
        text = text.replace(/"refreshtoken":\s*"[^"]+?([^\/"]+)"/g, '"refreshtoken":"<token redacted>"');
        if (process.env.QNAREDACT === "true") {
            let re = new RegExp(process.env.REDACTING_REGEX, "g");

            return text.replace(re, "XXXXXX");
        } else {
            return text;
        }
    }
};