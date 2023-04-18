// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const _=require('lodash')
const slackifyMarkdown = require('slackify-markdown');
const qnabot = require('qnabot/logging')

// PARSE FUNCTIONS
function isConnectClient(req) {
    return isConnectClientChat(req) || isConnectClientVoice(req);
}

function isConnectClientChat(req){
    return _.get(req,'_clientType') === 'LEX.AmazonConnect.Text'
}

function isConnectClientVoice(req){
    return _.get(req,'_clientType') === 'LEX.AmazonConnect.Voice'
}

function isLexV1(req){
    return req._lexVersion === 'V1';
}

function isElicitResponse(request, response){
    let result = false;
    const qnabotcontextJSON = _.get(response,'session.qnabotcontext');
    if (qnabotcontextJSON) {
        const qnabotcontext = JSON.parse(qnabotcontextJSON);
        if (_.get(qnabotcontext,'elicitResponse.responsebot')) {
            result = true;
        }
        if (_.get(qnabotcontext,'specialtyBot')) {
            result = true;
        }
    }
    return result;
}

// When using QnABot in Amazon Connect call center, callers sometimes use 'filler' words before asking their question
// If the inputTranscript contains only filler words, return true here and the handler will throw an error
// filler words are defined in the setting CONNECT_IGNORE_WORDS
function trapIgnoreWords(req, transcript) {
    const ignoreWordsArr = _.get(req, '_settings.CONNECT_IGNORE_WORDS', '').toLowerCase().split(',');
    if (ignoreWordsArr.length === 0 || !isConnectClient(req)) {
        return false;
    }
    const wordsInTranscript = transcript.toLowerCase().split(' ');
    let trs = '';
    const wordCount = wordsInTranscript.length;
    for (let i = 0; i < wordCount; i++) {
        if (!ignoreWordsArr.includes(wordsInTranscript[i])) {
            if (trs.length > 0) trs += ' ';
            trs += wordsInTranscript[i];
        }
    }

    return trs.trim().length === 0
}

function parseLexV1Event(event) {
    let out = {
        _type: 'LEX',
        _lexVersion: 'V1',
        _userId: _.get(event, 'userId', 'Unknown Lex User'),
        intentname: _.get(event, 'sessionState.intent.name'),
        question: _.get(event, 'inputTranscript').trim(),
        session: _.mapValues(
            _.get(event, 'sessionAttributes', {}),
            x => {
                try {
                    return JSON.parse(x);
                } catch (e) {
                    return x;
                }
            }
        ),
        channel: _.get(event, 'requestAttributes.\'x-amz-lex:channel-type\'')
    };

    //check if we pass in a qnabotUserId as a session attribute, if so, use it, else default
    out._userId = _.get(event,'sessionState.sessionAttributes.qnabotUserId', out._userId);
    qnabot.log('QnaBot User Id: ' + out._userId);

    return out;
}

function parseLexV2Event(event) {
    let out = {
        _type: 'LEX',
        _lexVersion: 'V2',
        _userId: _.get(event, 'sessionId', 'Unknown Lex User'),
        invocationSource: _.get(event, 'invocationSource'),
        intentname: _.get(event, 'sessionState.intent.name'),
        slots: _.mapValues(
            _.get(event,'sessionState.intent.slots',{}),
            x => { return _.get(x,'value.interpretedValue') }
        ),
        question: _.get(event, 'inputTranscript'),
        session: _.mapValues(
            _.get(event.sessionState, 'sessionAttributes', {}),
            x => {
                try {
                    return JSON.parse(x);
                } catch (e) {
                    return x;
                }
            }
        ),
        channel: _.get(event, 'requestAttributes.\'x-amz-lex:channel-type\'')
    };

    qnabot.log(`Lex event type is: ${out.invocationSource}`)
    // If Lex has already matched a QID specific intent, then use intent name to locate matching Qid
    if ( ! ['QnaIntent', 'FallbackIntent'].includes(out.intentname) ) {
        if (out.intentname.startsWith('QID-INTENT-')) {
            qnabot.log('Lex intent created from QID by QnABot');
        } else {
            qnabot.log('Custom Lex intent');
        }
        let qid = out.intentname.replace(/^QID-INTENT-/, '').replace(/_dot_/g, '.')
        qnabot.log(`Intentname "${out.intentname}" mapped to QID: "${qid}"`)
        out.qid = qid
    }


    // If voice, set userPreferredLocale from Lex locale in request (Voice input/output language should be aligned to bot locale)
    const mode = _.get(event,'inputMode') ;
    if (mode == 'Speech') {
        const lex_locale = _.get(event,'bot.localeId').split('_')[0];
        _.set(out,'session.qnabotcontext.userPreferredLocale', lex_locale);
        qnabot.log('LexV2 in voice mode - Set userPreferredLocale from lex V2 bot locale:', out.session.qnabotcontext.userPreferredLocale);
    }

    //check if we pass in a qnabotUserId as a session attribute, if so, use it, else default
    out._userId = _.get(event,'sessionState.sessionAttributes.qnabotUserId', out._userId);
    qnabot.log('QnaBot User Id: ' + out._userId);

    return out;
}

exports.parse=async function(req){
    let event = req._event;
    if (event.inputTranscript === undefined || event.inputTranscript === '') {
        // trap invalid input from Lex and and return an error if there is no inputTranscript.
        throw new Error('Error - inputTranscript string is empty.');
    }
    else if (trapIgnoreWords(req, event.inputTranscript)) {
        throw new Error(`Error - inputTranscript contains only words specified in setting CONNECT_IGNORE_WORDS: "${event.inputTranscript}"`);
    }

    let out;
    if ( ! _.get(event,'sessionId')) {
        out = parseLexV1Event(event);
    } else {
        out = parseLexV2Event(event);
    }
    return out;
};

function filterButtons(response) {
    qnabot.log('Before filterButtons ' + JSON.stringify(response));

    let filteredButtons = _.get(response.card,'buttons',[]);
    if (filteredButtons) {
        for (let i = filteredButtons.length - 1; i >= 0; --i) {
            if (!(filteredButtons[i].text && filteredButtons[i].value)){
                filteredButtons.splice(i,1);
            }
        }
        _.set(response.card,'buttons',filteredButtons) ;
    }
    qnabot.log('Response from filterButtons ' + JSON.stringify(response))
    return response;
}

// ASSEMBLE FUNCTIONS

function slackifyResponse(response) {
    // Special handling for Slack responses
    // Markdown conversion, and convert string to utf8 encoding for unicode support
    if (_.get(response,'result.alt.markdown')) {
        let md = response.result.alt.markdown;
        qnabot.log('Converting markdown response to Slack format.');
        qnabot.log('Original markdown: ', JSON.stringify(md));

        md = md.replace(/<\/?span[^>]*>/g,'');  // remove any span tags (eg no-translate tags)
        md = md.replace(/<\/?br *\/?>/g,'\n'); // replace br with \n

        md = slackifyMarkdown(md);

        //decode URIs in markdown -- slackify-markdown encodes URI. If presented with an encoded URI, slackify-markdown is double encoding URIs
        md = decodeURI (md);

        response.message = md ;
        qnabot.log('Converted markdown: ', JSON.stringify(md));
    }
    qnabot.log('Converting Slack message javascript string to utf8 (for multi-byte compatibility).');
    return response;
}

function isCard(card){
    return _.get(card,'send');
}

function isInteractiveMessage(response){
    return (isCard(response.card) && (_.get(response.card,'imageUrl','').trim() || (_.get(response.card,'buttons',[]).length > 0)));
}

function isFallbackIntent(request){
    return (_.get(request,'_event.currentIntent.name', '').toLowerCase()).includes('fallback');
}

function buildResponseCardV1(response) {
    let responseCardV1 = null;
    if (isCard(response.card) && (_.get(response.card,'imageUrl','').trim() || (_.get(response.card,'buttons',[]).length > 0))) {
        responseCardV1 = {
            version:'1',
            contentType:'application/vnd.amazonaws.card.generic',
            genericAttachments:[_.pickBy({
                title:_.get(response,'card.title','Title').slice(0,80), //LexV1 title limit
                subTitle:_.get(response.card,'subTitle')?.slice(0,80),
                imageUrl:_.get(response.card,'imageUrl'),
                buttons:_.get(response.card,'buttons')
            })]
        };
    }
    return responseCardV1;
}

function buildImageResponseCardV2(response) {
    let imageResponseCardV2 = null;
    if (isCard(response.card) && (_.get(response.card,'imageUrl','').trim() || (_.get(response.card,'buttons',[]).length > 0))) {
        let imageUrl = _.get(response.card,'imageUrl')?.trim()
        if(imageUrl && imageUrl.length > 250){
            qnabot.log('Warning: the Image URL length is greater than the Lex ImageResponseCard limit of 250 chars. Removing image from response.')
            qnabot.log('If using LexWebUI, try sending ResponseCard as session attribute rather than as a Lex ImageResponseCard to avoid hitting the Lex URL length limit.')
            imageUrl = undefined
        }

        imageResponseCardV2 = {
            title:_.get(response,'card.title','Title').slice(0,250), //LexV2 title limit
            subTitle:_.get(response.card,'subTitle')?.slice(0,250),
            imageUrl: imageUrl,
            buttons: _.get(response.card,'buttons')
        };
    }
    return imageResponseCardV2;
}

function buildInteractiveMessageElements(elements){
    return elements.map(x => ({title: x.text}));
}

function buildInteractiveMessageTemplate(response){
    response = applyConnectInteractiveMessageButtonLimits(response);

    if(response.message.length > 400){
        qnabot.log('WARNING: Truncating message content to Interactive Message Title limit of 400 characters');
    }

    let template = {
        templateType: 'ListPicker',
        version: '1.0',
        data: {
            content: {
                title: response.message.slice(0,400),
                elements: buildInteractiveMessageElements(_.get(response.card,'buttons')),
            },
        },
    };
    if(_.get(response,'card.title')){
        if( _.get(response,'card.title').length > 400){
            qnabot.log('WARNING: Truncating Card Title to Interactive Message Subtitle limit of 400 characters');
        }
        template.data.content.subtitle = _.get(response,'card.title').slice(0,400);
    }
    if(_.get(response,'card.imageUrl')){
        if( _.get(response,'card.imageUrl').length > 200){
            qnabot.log('Warning: the Image URL length is greater than the Connect InteractiveMessage limit of 200 chars. Removing image from response.')
        }
        else{
            template.data.content.imageType = 'URL';
            template.data.content.imageData = _.get(response,'card.imageUrl');
        }
    }

    return JSON.stringify(template);
}

function buildV1InteractiveMessageResponse(request, response) {
    return  {
        'contentType': 'CustomPayload',
        'content': buildInteractiveMessageTemplate(response),
    };
}

function buildV2InteractiveMessageResponse(request, response) {
    return [
        {
            'contentType': 'CustomPayload',
            'content': buildInteractiveMessageTemplate(response),
        }
    ];
}

function copyResponseCardtoSessionAttribute(response) {
    let responseCardV1 = buildResponseCardV1(response);
    if (responseCardV1) {
        // copy Lex v1 response card to appContext session attribute used by lex-web-ui
        //  - allows repsonse card display even when using postContent (voice) with Lex (not otherwise supported by Lex)
        //  - allows Lex limit of 5 buttons to be exceeded when using lex-web-ui
        let tmp;
        try {
            tmp=JSON.parse(_.get(response,'session.appContext','{}'));
        } catch(e) {
            tmp=_.get(response,'session.appContext','{}');
        }
        tmp.responseCard=responseCardV1;
        response.session.appContext=JSON.stringify(tmp);
    }
    return response;
}

function applyLexResponseCardButtonLimits(request, response) {
    // Lex has limit of max 5 buttons in the responsecard. if we have more than 5, use the first 5 only.
    // note when using lex-web-ui, this limitation is circumvented by use of the appContext session attribute above.
    let buttons = _.get(response.card,'buttons',[]);
    if (buttons && buttons.length > 5) {
        qnabot.log('WARNING: Truncating button list to contain only first 5 buttons to adhere to Lex limits.');
        _.set(response.card,'buttons',buttons.slice(0,5));
        buttons = _.get(response.card,'buttons',[]);
    }

    //LexV1 and V2 have different limits for button text so enforce them here
    //NOTE: LexV1 documentation formally states that 15 is the max limit for
    //button title; however, empirical testing shows that 80 characters are supported
    let textLimit  = isLexV1(request) ? 80 : 50
    let valueLimit = isLexV1(request) ? 1000 : 50
    qnabot.log(`Limiting button text to first ${textLimit} characters to adhere to Lex limits.`);
    for(let i=0;i<buttons.length;i++){
        response.card.buttons[i].text = response.card.buttons[i].text.slice(0,textLimit);
        response.card.buttons[i].value = response.card.buttons[i].value.slice(0,valueLimit);
    }
    return response;
}

function applyConnectInteractiveMessageButtonLimits(response) {
    // Interactive Message has max limit of 6 buttons in the responsecard and a title length of 400.
    let buttons = _.get(response.card,'buttons',[]);
    if (buttons && buttons.length > 6) {
        qnabot.log('WARNING: Truncating button list to contain only first 6 buttons to adhere to Connect limits.');
        _.set(response.card,'buttons',buttons.slice(0,6));
        buttons = _.get(response.card,'buttons',[]);
    }

    qnabot.log('Limiting button text to first 400 characters to adhere to Connect limits.');
    for(let i=0;i<buttons.length;i++){
        response.card.buttons[i].text = response.card.buttons[i].text.slice(0,400);
        response.card.buttons[i].value = response.card.buttons[i].value.slice(0,400);
    }
    return response;
}

function getV1CloseTemplate(request,response){
    return {
        sessionAttributes:_.get(response,'session',{}),
        dialogAction:_.pickBy({
            type:'Close',
            fulfillmentState:'Fulfilled',
            message:{
                contentType:response.type,
                content:response.message
            }
        })
    };
}

function getV1ElicitTemplate(request,response){
    return {
        sessionAttributes:_.get(response,'session',{}),
        dialogAction:{
            type:'ElicitSlot',
            intentName: _.get(request,'_event.currentIntent.name'),
            slotToElicit: 'slot',
            message: {
                contentType:response.type,
                content:response.message,
            }
        }
    };
}

function getV2CloseTemplate(request, response){
    return {
        sessionState: {
            sessionAttributes:_.get(response,'session',{}),
            dialogAction:{
                type:'Close'
            },
            intent: {
                name: response.intentname,
                state:'Fulfilled'
            }
        },
        messages: [
            {
                contentType: response.type,
                content: response.message,
            }
        ]
    };
}

function getV2ElicitTemplate(request, response){
    return {
        sessionState: {
            sessionAttributes:_.get(response,'session',{}),
            dialogAction:{
                type:'ElicitIntent'            },
            intent: {
                name: 'QnaIntent',
            },
            state:'InProgress'
        },
        messages: [
            {
                contentType: response.type,
                content: response.message,
            }
        ]
    } ;
}

function getV2DialogCodeHookResponseTemplate(request, response){
    let nextSlot = _.get(response,'nextSlotToElicit');
    return {
        sessionState: {
            sessionAttributes:_.get(response,'session',{}),
            dialogAction:{
                type: (nextSlot) ? 'ElicitSlot' : 'Delegate',
                slotToElicit: nextSlot,
            },
            intent: {
                name: response.intentname,
                slots: _.mapValues(_.get(response,'slots'), value=>{
                    return (value) ? {'value': {'interpretedValue': value}} : null ;
                }),
            },
            state: (nextSlot) ? 'InProgress' : 'ReadyForFulfillment',
        },
    } ;
}

function assembleLexV1Response(request,response) {
    let out = {};

    if((isConnectClientChat(request) && isInteractiveMessage(response) && !isFallbackIntent(request))){
        out = getV1ElicitTemplate(request, response);
        out.dialogAction.message = buildV1InteractiveMessageResponse(request, response);
    }
    else if(isElicitResponse(request, response) && ! isFallbackIntent(request)){
        out = getV1ElicitTemplate(request, response);
    }
    else{
        out = getV1CloseTemplate(request, response);
    }

    if(!isConnectClient(request)){
        response = applyLexResponseCardButtonLimits(request, response)
        out.dialogAction.responseCard = buildResponseCardV1(response);
    }
    return out;
}

function assembleLexV2Response(request, response){
    let out = {};

    if(isConnectClientChat(request) && isInteractiveMessage(response)){
        out = getV2ElicitTemplate(request, response);
        out.messages = buildV2InteractiveMessageResponse(request, response);
    }
    else if(isElicitResponse(request, response)){
        out = getV2ElicitTemplate(request, response);
    }
    else if(_.get(request,'invocationSource') === 'DialogCodeHook'){
        out = getV2DialogCodeHookResponseTemplate(request, response);
    }
    else{
        out = getV2CloseTemplate(request, response);
    }

    if (!isConnectClient(request)){
        response = applyLexResponseCardButtonLimits(request, response)
        let imageResponseCardV2 = buildImageResponseCardV2(response);
        if(imageResponseCardV2) {
            out.messages[out.messages.length] = {
                'contentType': 'ImageResponseCard',
                'imageResponseCard': imageResponseCardV2
            };
        }
    }
    return out;
}

exports.assemble=function(request,response){
    if (request._clientType === 'LEX.Slack.Text') {
        response = slackifyResponse(response);
    }

    qnabot.log('filterButtons')
    response = filterButtons(response);

    qnabot.log('copyResponseCardToSessionAttributes')
    response = copyResponseCardtoSessionAttribute(response);

    let out;
    if (isLexV1(request)) {
        out = assembleLexV1Response(request,response);
    } else {
        out = assembleLexV2Response(request, response);
    }

    qnabot.log('Lex response:',JSON.stringify(out,null,2))
    return out
}


