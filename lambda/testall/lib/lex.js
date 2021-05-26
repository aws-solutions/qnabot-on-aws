const Promise=require('bluebird');
const aws=require("aws-sdk");
aws.config.setPromisesDependency(Promise);
aws.config.region=process.env.AWS_REGION;

const s3=new aws.S3();
const lexv2 = new aws.LexRuntimeV2();

function processWithLex(data, filter) {
    const orig = JSON.parse(data);
    let res = 'Match(Yes/No), Question, Topic, QID, Returned QID, Returned Message' + '\n';
    return new Promise(async (resolve, reject) => {
        for (let [i, item] of Object.entries(orig)) {
            if (item.type && item.type === 'qna') {
                const topic = (item.t) ? item.t : '';
                const exp_qid = item.qid;
                for (let [x, question] of Object.entries(item.q)) {
                    try {
                        let resp = await lexv2.recognizeText({
                            botId: process.env.LEXV2_BOT_ID,
                            botAliasId: process.env.LEXV2_BOT_ALIAS_ID,
                            localeId: "en_US",
                            sessionId: 'automated-tester1',
                            sessionState: {'sessionAttributes':{'topic': topic}},
                            text: question
                        }).promise();
                        let res_qid = resp.sessionState.sessionAttributes.qnabot_qid;
                        if (res_qid === undefined) {
                            res_qid = "NO_QID_IN_RESPONSE";
                        }
                        let m1 = resp.messages[0].content.toString().replace(/\"/g, '');
                        m1 = m1.replace(/(\r\n)+|\r+|\n+|\t+/i, ' ');
                        let res_msg = `"${m1}"`;
                        let result_matches = 'No';
                        if (exp_qid === res_qid) {
                            result_matches = 'Yes';
                        }
                        res += result_matches + ',' + question + ',' + topic + ',' + exp_qid + ',' + res_qid + ',' + res_msg + '\n';
                    } catch (err) {
                        let msg = `"${err.toString().replace(/\n/g, '')}"`
                        res += 'No' + ',' + question + ',' + topic + ',' + exp_qid + ',' + 'undefined' + ',' + msg + '\n';
                    }
                }
            }
        }
        resolve(res);
    });

}
module.exports = function(config){
    console.log('config is: ' + JSON.stringify(config,null,2));
    return Promise.all(config.parts.map(part=>{
        return s3.getObject({
            Bucket:config.bucket,
            Key:part.key,
            VersionId:config.version
        }).promise()
        .then(x=>x.Body.toString())
    })).then(async parts=> {
        let qa = parts.toString();
        let arrayOfParts = `[${qa.replace(/\n/g,',\n')}]`;
        const contents = await processWithLex(arrayOfParts,config.filter);
        return s3.putObject({
            Bucket:config.bucket,
            Key:config.key,
            Body:contents
        }).promise()
    })
    .then(()=>{
        config.status="Clean"
    })
}    



