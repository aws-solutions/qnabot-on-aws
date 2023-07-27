var _ = require('lodash');
const AWS = require('aws-sdk');
const qnabot = require("qnabot/logging")


function signS3URL(url, expireSecs) {
    var bucket, key;
    if (url.search(/\/s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
      //bucket in path format
      bucket = url.split('/')[3];
      key = url.split('/').slice(4).join('/');
    }
    if (url.search(/\.s3[.-](\w{2}-\w{4,9}-\d\.)?amazonaws\.com/) != -1) {
      //bucket in hostname format
      let hostname = url.split("/")[2];
      bucket = hostname.split(".")[0];
      key = url.split('/').slice(3).join('/');
    }
    if (bucket && key) {
        qnabot.debug("Convert S3 url to a signed URL: ",url, "Bucket: ", bucket, " Key: ", key);
        try {
            const s3 = new AWS.S3() ;
            const signedurl = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: expireSecs
            })
            qnabot.log("Signed URL: ", signedurl);
            url = signedurl;
        } catch (err) {
              qnabot.log("Error signing S3 URL (returning original URL): ", err) ;
        }
    } else {
        qnabot.debug("URL is not an S3 url - return unchanged: ",url);
    }
    return url;
}

function createHit(docs, hitCount){
    if(hitCount <= 0){
        return null
    }

    let hit = {
        "a": docs,
        "alt": {
            "markdown": docs,
            "ssml": ""
        },
        "type": "text",
        "questions": [],
        "answersource": "KENDRA RETRIEVE API",
        "hit_count": hitCount,
        "debug": []
    }
    qnabot.log("createHit: ", JSON.stringify(hit, null, 2))
    return hit
}

function getIndexIDs(req){
    let parsedIndexes
    let indexes = req["_settings"]["ALT_SEARCH_KENDRA_INDEXES"] ? req["_settings"]["ALT_SEARCH_KENDRA_INDEXES"] : process.env.KENDRA_INDEXES
    if (indexes && indexes.length) {
        try {
            // parse JSON array of kendra indexes
            parsedIndexes = JSON.parse(indexes);
        } catch (err) {
            // assume setting is a string containing single index
            parsedIndexes = [ indexes ];
        }
        return parsedIndexes
    }
    else{
        throw new Error('Undefined Kendra Indexes');
    }
}

function getResult(resp, index, signS3Urls, expireSeconds){
    let r = resp["ResultItems"][index]
    let doc_excerpt = r["Content"]
    let doc_title = r["DocumentTitle"]
    let doc_uri = r["DocumentURI"]
    if (signS3Urls){
        doc_uri = signS3URL(doc_uri, expireSeconds)
    }
    let link = `<span translate=no>[${doc_title}](${doc_uri})</span>`
    let result = `${doc_excerpt}\n\nSource Link: ${link}`
    return result
}


function getQuery(req){
    let origQuestion = req["_event"]["origQuestion"];
    let question = req["question"];
    let userDetectedLocale = _.get(req, 'session.qnabotcontext.userLocale');
    let standaloneQuery = _.get(req, 'llm_generated_query.concatenated');

    let kendraIndexedLanguages = _.get(req["_settings"],
        "KENDRA_INDEXED_DOCUMENTS_LANGUAGES",["en"]);
    qnabot.log("Retrieved Kendra multi-language settings: " + kendraIndexedLanguages);

    let useOriginalLanguageQuery = kendraIndexedLanguages.includes(userDetectedLocale, 0)
        && origQuestion && question && origQuestion!=question;
    if (standaloneQuery) {
        useOriginalLanguageQuery = false;
        qnabot.log("Using LLM generated standalone query: " + standaloneQuery);
    }
    qnabot.log("useOriginalLanguageQuery: " + useOriginalLanguageQuery);
    return useOriginalLanguageQuery ? origQuestion : question
}

async function kendraRetrieve(kendraClient, req){
    let kcount = _.get(req["_settings"],"ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT",2)
    let signS3Urls = _.get(req["_settings"],"ALT_SEARCH_KENDRA_S3_SIGNED_URLS",true)
    let expireSeconds = _.get(req["_settings"],"ALT_SEARCH_KENDRA_S3_SIGNED_URL_EXPIRE_SECS",300)


    let kindexIDs = getIndexIDs(req)
    let kquery = getQuery(req)
    let response = await kendraClient.retrieve({
        IndexId: kindexIDs[0],
        QueryText: kquery.trim(),
        PageSize: kcount
    }).promise()
    qnabot.log("Debug: Retrieve API response: ", JSON.stringify(response, null, 2))

    let respLen = response["ResultItems"].length
    qnabot.log("Debug: Retrieve response length: ", respLen)

    //process the results of the retrieve API
    let rCount = respLen > kcount ? kcount : respLen

    let results = []
    for(let i = 0; i< rCount; i++){
        let result = getResult(response, i, signS3Urls, expireSeconds)
        results.push(result)
    }
    docs = results.join("\n---\n")
    hit = createHit(docs, rCount)
    return hit
}

exports.handler = async (event, context) => {
    qnabot.debug("event: " + JSON.stringify(event, null, 2));
    const kendraClient = new AWS.Kendra({apiVersion: '2019-02-03', region: process.env.AWS_REGION || 'us-east-1'})
    hit = await kendraRetrieve(kendraClient, event)

    return hit;
};