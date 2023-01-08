//start connection
const aws = require('aws-sdk');
const Promise = require('bluebird');
const bodybuilder = require('bodybuilder');
const get_keywords = require('./keywords');
const _ = require('lodash');
const qnabot = require("qnabot/logging");
const get_embeddings = require('./embeddings');

function build_qid_query(params) {
  qnabot.log("Build_qid_query - params: ", JSON.stringify(params, null, 2));
  const query = bodybuilder()
    .orQuery('match', 'qid', params.qid)
    .from(0)
    .size(1)
    .build();
  qnabot.log("ElasticSearch Query", JSON.stringify(query, null, 2));
  return new Promise.resolve(query);
}


function build_query(params) {
  qnabot.log("Build_query - params: ", JSON.stringify(params, null, 2));
  return (get_keywords(params))
    .then(async function (keywords) {
      const filter_query_unique_terms = {
        'quniqueterms': {
          query: keywords,
          minimum_should_match: _.get(params, 'minimum_should_match', '2<75%'),
          zero_terms_query: 'all',
        }
      };
      const filter_query_a = {
        'a': {
          query: keywords,
          minimum_should_match: _.get(params, 'minimum_should_match', '2<75%'),
          zero_terms_query: 'all',
        }
      };
      const match_query = {
        'quniqueterms': {
          query: params.question,
          boost: 2,
        }
      };
      if (_.get(params, 'fuzziness')) {
        filter_query_unique_terms.quniqueterms.fuzziness = "AUTO";
        filter_query_a.a.fuzziness = "AUTO";
        match_query.quniqueterms.fuzziness = "AUTO";
      }
      let query = bodybuilder();

      // Exclude QIDs with enableQidIntent: true. They should be matched only by Lex
      // as intents, not by ES match queries. 
      query = query.notFilter('match', {"enableQidIntent": {"query": true}});

      if (keywords.length > 0) {
        if (_.get(params, 'score_answer_field')) {
          query = query
            .orFilter('match', filter_query_unique_terms)
            .orFilter('match', filter_query_a);
        } else {
          query = query.filter('match', filter_query_unique_terms);
        }
      }
    
      var qnaClientFilter = _.get(params, 'qnaClientFilter', "");
      query = query.orFilter(
        'bool', {
        "must": [
          {
            "exists": {
              "field": "clientFilterValues"
            }
          },
          {
            "term": {
              "clientFilterValues": {
                "value": qnaClientFilter,
                "case_insensitive": true
              }
            }
          }
        ]
      }
      )
        .orFilter(
          'bool', {
          "must_not": [
            {
              "exists": {
                "field": "clientFilterValues"
              }
            }
          ]
        }
        ).filterMinimumShouldMatch(1);

      if (_.get(params, 'settings.EMBEDDINGS_API') != "DISABLED") {
        // do KNN embedding match for semantic similarity
        query = query.orQuery(
          'nested', {
            score_mode: 'max',
            boost: _.get(params, 'phrase_boost', 4),
            path: 'questions',
            query: {
              knn: {
                'questions.q_vector': {
                  k: _.get(params, 'settings.EMBEDDINGS_KNN_K', 10),
                  vector: await get_embeddings(params)
                }
              }
            }
          }
        );
      } else {
        // do terms and phrase matches on question instead, and add topic filters
        query = query.orQuery(
          'match', match_query
        );
        query = query.orQuery(
          'nested', {
            score_mode: 'max',
            boost: _.get(params, 'phrase_boost', 4),
            path: 'questions'
          },
          q => q.query('match_phrase', 'questions.q', params.question)
        );
        if (_.get(params, 'score_answer_field')) {
          query = query.orQuery('match', 'a', params.question);
        }
        let topic = _.get(params, 'topic');
        if (topic) {
          query = query.orQuery('match', 't', topic);
        } else {
          // no topic - query prefers answers with empty/missing topic field for predicable response
          // NOTE: will not work in Kendra FAQ mode since we have no equivalent Kendra query
          query = query.orQuery(
            'bool', {
              "should" : [
                { 
                  "match_all": {
                  } 
                },
                {
                  "bool": {
                    "must_not": [
                        {
                            "exists": {
                                "field": "t"
                            }
                        }
                    ]
                  }
                }          
              ],
              "minimum_should_match" : 2
            }      
          ) ;
        }
      }
      query = query
        .from(_.get(params, 'from', 0))
        .size(_.get(params, 'size', 1))
        .build();
      qnabot.log("ElasticSearch Query: ", JSON.stringify(query, null, 2));
      return new Promise.resolve(query);
    });
    }


module.exports = function (params) {
  // if question starts with "QID::" then build a Qid targeted query, else build question matching query.
  if (params.question.toLowerCase().startsWith("qid::")) {
    // question specifies targeted Qid
    params.qid = params.question.split("::")[1];
    return build_qid_query(params);
  } else {
    return build_query(params);
  }
};


/*
var testparams = {
    question: "what is an example user question",
    topic: "optional_topic",
    from: 0,
    size: 0
};
build_query(testparams)
*/
