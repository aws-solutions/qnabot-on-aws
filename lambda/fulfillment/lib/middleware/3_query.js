var _=require('lodash')
var util=require('./util')
const lexRouter=require('./lexRouter');

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
module.exports=async function query(req,res) {
    console.log("Entry REQ:", JSON.stringify(req, null, 2));
    console.log("Entry RES:", JSON.stringify(res, null, 2));

    /* These session variables may exist from a prior interaction with QnABot. They are
       used to control behavior of this function and divert the function away from the normal
       behavior of using an Elastic Search Query.

       - specialtyArn - calls to specialty bot for bot routing
       - queryLambdaArn - calls normally used by the quiz functionality
       - elicitResponse - indicates a lex bot should be used for processing
       - chainingConfig - from a prior elicitResponse based question. Used to conditionally
                          chain to another question when elicitResponse completes
     */
    let specialtyArn = _.get(req,"session.specialtyLambda" ,undefined);
    let queryLambdaArn = _.get(req,"session.queryLambda", undefined);
    let elicitResponse = _.get(req,"session.elicitResponse", undefined);
    let chainingConfig = _.get(req,"session.elicitResponseChainingConfig", undefined);

    if (elicitResponse) {
        console.log('Handling elicitResponse');
        let resp = await lexRouter.elicitResponse(req,res, elicitResponse);
        if (resp.res.session.elicitResponseProgress === 'Fulfilled' ||
            resp.res.session.elicitResponseProgress === 'ReadyForFulfillment') {
            console.log("Bot was fulfilled");
            // LexBot has completed. See if we need to using chaining to go to another question
            if (chainingConfig) {
                console.log("Conditional chaining: " + chainingConfig);
                // chainingConfig will be used in Query Lambda function
                const arn = util.getLambdaArn(process.env.LAMBDA_DEFAULT_QUERY);
                const postQuery = await util.invokeLambda({
                    FunctionName: arn,
                    req: resp.req,
                    res: resp.res
                });
                // elicitResponse processing is done. Remove the flag for now.
                postQuery.res.session.elicitResponseProgress = undefined;
                console.log("After chaining the following response is being made: " + JSON.stringify(postQuery,null,2));
                return postQuery;
            } else {
                // no chaining. continue on with response from standard fulfillment path.
                resp.res.session.elicitResponseProgress = undefined;
            }
        }
        console.log("No chaining. The following response is being made: " + JSON.stringify(resp,null,2));
        return resp;
    }

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
    let postQuery =  await util.invokeLambda({
        FunctionName:arn,
        req,res
    });

    /*
     After standard query look for elicitResponse in question being returned and set session attributes
     such that on next entry, response is sent to LexBot.
     */

    const responsebot_hook = _.get(postQuery.res,"result.elicitResponse.responsebot_hook", undefined);
    const responsebot_session_namespace = _.get(postQuery.res,"result.elicitResponse.response_sessionattr_namespace", undefined);
    const chaining_configuration =_.get(postQuery.res,"result.conditionalChaining", undefined);
    if (responsebot_hook && responsebot_session_namespace) {
        if (postQuery.res.session.elicitResponseLoopCount) {
            postQuery.res.session.elicitResponseLoopCount = 0;
        }
        postQuery.res.session.elicitResponse = responsebot_hook;
        postQuery.res.session.elicitResponseNamespace = responsebot_session_namespace;
        _.set(postQuery.res.session, postQuery.res.session.elicitResponseNamespace + ".boterror", undefined );
        postQuery.res.session.elicitResponseChainingConfig = chaining_configuration;
    }

    console.log("Standard path return from 3_query: " + JSON.stringify(postQuery, null, 2));
    return postQuery;
}
