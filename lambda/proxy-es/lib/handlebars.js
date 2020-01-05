//start connection
var _ = require('lodash');
var Handlebars = require('handlebars');
var supportedLanguages = require('./supportedLanguages');

console.log("SUPPORTED lang: ", supportedLanguages.getSupportedLanguages());

var res_glbl = {};
var req_glbl = {};

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('ifLang', function (lang, options) {
    const SessionAttributes = _.get(req_glbl, 'session');
    const usrLang = SessionAttributes.userLocale;
    if (usrLang && lang === usrLang) {
        _.set(req_glbl.session, 'matchlang', 'true');
        return options.fn(this);
    }
});

Handlebars.registerHelper('defaultLang', function (options) {
    var SessionAttributes = _.get(req_glbl, 'session');
    let previousMatchLang = SessionAttributes.matchlang;

    if (previousMatchLang && previousMatchLang === 'true' ) {
        // case one. Hitting the default en lang response and a previous lang has matched. Return nothing and reset matchlang
        // matchlang to false for next processing.
        _.set(req_glbl.session, 'matchlang', 'false');
        return options.inverse(this);
    } else if (previousMatchLang && previousMatchLang === 'false' ) {
        // case two. Hitting the default lang response and a previous lang has NOT matched. Return value. matchlang is
        // false for next processing.
        return options.fn(this);
    } else if (previousMatchLang === undefined) {
        // case three. Hitting the default lang response and no previous lang has been encountered. Return default value
        // but set matchlang to false for next processing.
        _.set(req_glbl.session, 'matchlang', 'false');
        return options.fn(this);
    } else {
        if (previousMatchLang === undefined) {
            _.set(req_glbl.session, 'matchlang', 'false');
        }
        return options.inverse(this);
    }
});

Handlebars.registerHelper('setLang', function (lang, last, options) {
    if (_.get(req_glbl._settings, 'ENABLE_MULTI_LANGUAGE_SUPPORT') === true) {
        const userPreferredLocaleKey = 'session.userPreferredLocale';
        const userLocaleKey = 'session.userLocale';
        const currentPreferredLocale = _.get(res_glbl, userPreferredLocaleKey);
        const currentUserLocale = _.get(res_glbl, userLocaleKey);
        const errorLocale = currentPreferredLocale ? currentPreferredLocale : (currentUserLocale ? currentUserLocale : "en");
        const capitalize = (s) => {
            if (typeof s !== 'string') return ''
            return s.charAt(0).toUpperCase() + s.slice(1)
        };
        var errorFound = _.get(req_glbl._event, 'errorFound')
        var userLanguage = capitalize(_.get(req_glbl._event, 'inputTranscript'));
        var supported_languages = supportedLanguages.getSupportedLanguages();
        var languageErrorMessages = supportedLanguages.getLanguageErrorMessages();
        var userLanguageCode = supported_languages[userLanguage];

        if (userLanguageCode === undefined && !errorFound) {
            console.log("no language mapping for user utterance");
            _.set(req_glbl._event, 'errorFound', true);
            return languageErrorMessages[errorLocale].errorMessage;
        }

        if (userLanguageCode && lang == userLanguageCode) {
            console.log("setting: ", options.fn(this));
            console.log("Setting res session attribute:", "session.userPreferredLocale", " Value:", userLanguageCode);
            _.set(res_glbl, userPreferredLocaleKey, userLanguageCode);
            return options.fn(this);
        } else if ((last === true) && (_.get(res_glbl, userPreferredLocaleKey) !== userLanguageCode) && !errorFound) {
            return languageErrorMessages[errorLocale].errorMessage;
        } else {
            return "";
        }
    } else {
        console.log("Warning - attempt to use setLang handlebar helper function while ENABLE_MULTI_LANGUAGE_SUPPORT is set to false. Please check configuration.");
    }
});

Handlebars.registerHelper('setSessionAttr', function (k, v, options) {
    console.log("Setting res session attribute:", k, " Value:", v);
    var key = "session." + k;
    _.set(res_glbl, key, v);
    return "";
});

Handlebars.registerHelper('randomPick', function () {
    var argcount = arguments.length - 1;  // ignore final 'options' argument
    console.log("Select randomly from ", argcount, "inputs: ", arguments);
    var item = arguments[Math.floor(Math.random() * argcount)];
    console.log("Selected: ", item);
    return item;
});

var apply_handlebars = function (req, res, hit) {
    console.log("apply handlebars");
    console.log('req is: ' + JSON.stringify(req,null,2));
    console.log('res is: ' + JSON.stringify(res,null,2));
    res_glbl = res; // shallow copy - allow modification by setSessionAttr helper
    req_glbl = req; // shallow copy - allow sessionAttributes retrieval by ifLang helper
    _.set(req_glbl._event, 'errorFound', false);
    var context = {
        LexOrAlexa: req._type,
        UserInfo: req._userInfo,
        SessionAttributes: _.get(req, 'session')
    }
    console.log("Apply handlebars preprocessing to ES Response. Context: ", context);
    var hit_out = _.cloneDeep(hit);
    var a = _.get(hit, "a")
    var markdown = _.get(hit, "alt.markdown")
    var ssml = _.get(hit, "alt.ssml")
    // catch and log errors before throwing exception.
    if (a) {
        try {
            var a_template = Handlebars.compile(a);
            hit_out.a = a_template(context);
        } catch (e) {
            console.log("ERROR: Answer caused Handlebars exception. Check syntax: ", a)
            throw (e);
        }
    }
    if (markdown) {
        try {
            var markdown_template = Handlebars.compile(markdown);
            hit_out.alt.markdown = markdown_template(context);
        } catch (e) {
            console.log("ERROR: Markdown caused Handlebars exception. Check syntax: ", markdown)
            throw (e);
        }
    }
    if (ssml) {
        try {
            var ssml_template = Handlebars.compile(ssml);
            hit_out.alt.ssml = ssml_template(context);
        } catch (e) {
            console.log("ERROR: SSML caused Handlebars exception. Check syntax: ", ssml)
            throw (e);
        }
    }
    console.log("Preprocessed Result: ", hit_out);
    return hit_out;
}

module.exports = function (req, res, es_hit) {
    console.log("entering apply_handlebars");
    return apply_handlebars(req, res, es_hit);
};
