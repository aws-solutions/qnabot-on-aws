var _=require('lodash')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lambda=new aws.Lambda()
var kms=new aws.KMS()
var handlebars = require('handlebars')
var fs=require('fs')

var markdown=handlebars.compile(
    fs.readFileSync(`${__dirname}/templates/quiz-response.md`,'utf-8')
)
var text=handlebars.compile(
    fs.readFileSync(`${__dirname}/templates/quiz-response.hbs`,'utf-8')
)

exports.handler=async function(event,context,callback){
    console.log(JSON.stringify(event,null,2))
    try{
        if(event.res.session.quizBot){
            var decrypt=await kms.decrypt({
                CiphertextBlob:Buffer.from(event.res.session.quizBot,'base64'),
                EncryptionContext:{
                    userId:event.req._event.userId
                }
            }).promise()
            console.log(decrypt)
            var quizBot=JSON.parse(decrypt.Plaintext.toString('utf8'))
        }else{
            var quizBot={
                questionCount:0,
                correctAnswerCount:0,
                next:event.res.result.args[0],
                originalDocumentQid:_.get(event,"res.session.previous.qid","")
            }
        }
        var templateParams={
            first:quizBot.questionCount===0,
            message:_.get(event,"res.result.a")
        } 
        if(quizBot.questionCount>0){
            templateParams.correctAnswers=quizBot.correctAnswers
            if(isCorrect(event.req.question,quizBot.correctAnswers)){
                templateParams.correct=true
                quizBot.correctAnswerCount++
            }else{
                templateParams.incorrect=true
            }
        }
        
        if( !quizBot.next || ["QUIT","EXIT"].includes(standardize(quizBot.next)) ){
            templateParams.finished=true
            templateParams.totalCorrect=quizBot.correctAnswerCount
            templateParams.totalQuestions=quizBot.questionCount
            var score=quizBot.correctAnswerCount/quizBot.questionCount*100
            templateParams.score=Math.round(score)
            delete event.res.session.quizBot
            delete event.res.session.queryLambda
        }
        
        if(quizBot.next){
            result=await lambda.invoke({
                FunctionName:event.req._info.es.service.qid,
                InvocationType:"RequestResponse",
                Payload:JSON.stringify({qid:quizBot.next})
            }).promise()

            nextDocument=JSON.parse(result.Payload)
            console.log(JSON.stringify(nextDocument,null,2))
            if(!nextDocument) throw `Next Document not Found:${quizBot.next}` 

            templateParams.question=nextDocument.question 
            templateParams.answers=_.shuffle(
                nextDocument.incorrectAnswers.map(answer=>[answer,false])
                .concat(
                    nextDocument.correctAnswers.map(answer=>[answer,true])
                ))
                .map((val,index)=>{
                    val[2]=String.fromCharCode(65+index)
                    return val
                })
            
            quizBot.correctAnswers=templateParams.answers
                .filter(x=>x[1]).map(x=>x[2])

            event.res.session.queryLambda=process.env.AWS_LAMBDA_FUNCTION_NAME
            quizBot.questionCount++
            quizBot.next=_.get(nextDocument,"next[0]",false)
          
            var encrypt=await kms.encrypt({
                KeyId:process.env.QUIZ_KMS_KEY,
                Plaintext:JSON.stringify(quizBot),
                EncryptionContext:{ 
                    userId:event.req._event.userId
                }
            }).promise()
            console.log(encrypt)

            event.res.session.quizBot=encrypt.CiphertextBlob.toString('base64')
            if(_.get(nextDocument,"r.imageUrl")){
                event.res.card=nextDocument.r
                event.res.card.send=true
            }
        }

        event.res.message=text(templateParams)
            .replace(/\r?\n|\r/g, " ").replace(/ +(?= )/g,'');
        _.set(event,
            "res.session.appContext.altMessages.markdown",
            markdown(templateParams)
        )
        
        console.log(JSON.stringify(event,null,2))
        callback(null,event)
    }catch(e){
        console.log("Failed",e)
        delete event.res.session.quizBot
        delete event.res.session.queryLambda
        event.message="Sorry, Failed to process quiz"
        callback(null,event)
    }
}

function isCorrect(response,list){
    return list.includes(standardize(response))
}

function standardize(str){
    return str.toUpperCase().trim().replace(/[^\w\s]|_/g, "")
}


