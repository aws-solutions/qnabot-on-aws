var _=require('lodash')
var util=require('./util')

/**
 * This function identifies and invokes a lambda function that either queries elasticsearch for a
 * document to serve as an answer or will farm out to other alternate handling mechanisms (lambdas)
 * integrated via configured questions. There are two other alternate mechanisms at the present time.
 * One is quiz functionality and the second are specialty bots. Answers provided to questions from a
 * QnABot quiz are always directed to the quiz handler which is defined by the session attribute
 * queryLambda. Specialty Bots handle answering questions via a different bot. Specialty Bots are
 * configured in the question database with the keyword "specialty" as a prefix to the question id (qid).
 *
 * The three potential ARNs are identified first based on current state
 *
 * specialtyArn - indicates that a specialtyBot is active from the last input
 * queryLambdaArn - indicates that a quiz bot is active
 * arn - the default Arn to handle input
 *
 * Note that If a specialtyArn is available, this routine first checks to see if a different specialtyBot should
 * provide the answer and resets properties to use a new specialty Bot if one is identified via a local
 * query to the ES cluster.
 *
 * Now that the three Arns have been identified the following precedence is used
 * 1) queryLambda takes precedence and is used if defined.
 * 2) specialtyLambda has the next highest priority.
 * 3) default Lambda arn is used if neither queryLambda or specialtyLambda is present.
 *
 * @param req
 * @param res
 * @returns {Promise<any>}
 */
module.exports = async function query(req,res) {
    let specialtyArn = _.get(req,"session.specialtyLambda" ,undefined);
    let queryLambdaArn = _.get(req,"session.queryLambda", undefined);
    let arn = util.getLambdaArn(process.env.LAMBDA_DEFAULT_QUERY);
    if (specialtyArn) {
        let localEsQueryResults = await util.invokeLambda({
            FunctionName: arn,
            req, res
        });
        if ( localEsQueryResults.res.got_hits > 0 && localEsQueryResults.res.result.qid.startsWith('specialty') &&
            (localEsQueryResults.req.session.botName !==
                localEsQueryResults.res.result.args[0]) ) {
            /**
             * A number of session state attributes need to be removed as we switch away to another
             * specialty bot.
             */
            delete localEsQueryResults.res.session.brokerUID;
            delete localEsQueryResults.res.session.botAlias;
            delete localEsQueryResults.res.session.botName;
            delete localEsQueryResults.res.session.nohits;
            delete localEsQueryResults.res.session.specialtyLambda;
            return localEsQueryResults;
        }
    }
    if (queryLambdaArn) {
        arn = queryLambdaArn;
    } else if (specialtyArn) {
        arn = specialtyArn;
    } else {
        arn = util.getLambdaArn(process.env.LAMBDA_DEFAULT_QUERY);
    }
    return await util.invokeLambda({
        FunctionName:arn,
        req,res
    })
}
