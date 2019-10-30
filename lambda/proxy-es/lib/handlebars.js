//start connection
var _=require('lodash');
var Handlebars=require('handlebars');

var res_glbl={};

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

Handlebars.registerHelper('setSessionAttr', function (k, v, options) {
    console.log("Setting res session attribute:",k," Value:",v);
    var key = "session." + k;
    _.set(res_glbl,key,v);
    return "";
});

Handlebars.registerHelper('randomPick', function () {
    var argcount = arguments.length - 1;  // ignore final 'options' argument
    console.log("Select randomly from ",argcount,"inputs: ", arguments);
    var item = arguments[Math.floor(Math.random()*argcount)];
    console.log("Selected: ", item);
    return item;
});


var apply_handlebars=function(req,res,hit){
    res_glbl=res; // shallow copy - allow modification by setSessionAttr helper
    var context={
        LexOrAlexa: req._type,
        UserInfo: req._userInfo,
        SessionAttributes: _.get(req,'session')
    }
    console.log("Apply handlebars preprocessing to ES Response. Context: ", context);
    var hit_out=_.cloneDeep(hit);
    var a = _.get(hit,"a")
    var markdown = _.get(hit,"alt.markdown")
    var ssml = _.get(hit,"alt.ssml")
    // catch and log errors before throwing exception.
    if (a){
        try{
            var a_template = Handlebars.compile(a);
            hit_out.a = a_template(context);            
        } catch(e){
            console.log("ERROR: Answer caused Handlebars exception. Check syntax: ", a)
            throw(e);
        }
    }
    if (markdown){
        try{
            var markdown_template = Handlebars.compile(markdown);
            hit_out.alt.markdown = markdown_template(context);            
        } catch(e){
            console.log("ERROR: Markdown caused Handlebars exception. Check syntax: ", markdown)
            throw(e);
        }
    }    
    if (ssml){
        try{
            var ssml_template = Handlebars.compile(ssml);
            hit_out.alt.ssml = ssml_template(context);            
        } catch(e){
            console.log("ERROR: SSML caused Handlebars exception. Check syntax: ", ssml)
            throw(e);
        }
    }
    console.log("Preprocessed Result: ", hit_out);
    return hit_out;
}

module.exports=function(req,res,es_hit){
    return apply_handlebars(req,res,es_hit);
};


/*
var req = {
    _type:"LEX",
    _userInfo:{GivenName:"Bob"}
};
var hit = {
    a:"Hello {{UserInfo.GivenName}}",
    alt:{
        markdown:"Hello **{{UserInfo.GivenName}}**"
    }
}
apply_handlebars(req,hit)
*/