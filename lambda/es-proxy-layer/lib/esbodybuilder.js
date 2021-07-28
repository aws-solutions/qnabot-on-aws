//start connection
const Promise = require('bluebird');
const bodybuilder = require('bodybuilder');
const get_keywords = require('./keywords');
const _ = require('lodash');


function build_qid_query(params) {
  console.log("Build_qid_query - params: ", JSON.stringify(params, null, 2));
  const query = bodybuilder()
    .orQuery('match', 'qid', params.qid)
    .from(0)
    .size(1)
    .build();
  console.log("ElasticSearch Query", JSON.stringify(query, null, 2));
  return new Promise.resolve(query);
}


function build_query(params) {
  console.log("Build_query - params: ", JSON.stringify(params, null, 2));
  return (get_keywords(params))
    .then(function (keywords) {
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
      if (keywords.length > 0) {
        if (_.get(params, 'score_answer_field')) {
          query = query
            .orFilter('match', filter_query_unique_terms)
            .orFilter('match', filter_query_a);
        } else {
          query = query.filter('match', filter_query_unique_terms);
        }
      }
      query = query.orQuery(
        'match', match_query
      );
      if (_.get(params, 'enable_client_filters', false) === true) {
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
                "clientFilterValues": qnaClientFilter
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
      }
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
      query = query.orQuery('match', 't', _.get(params, 'topic', ''))
        .from(_.get(params, 'from', 0))
        .size(_.get(params, 'size', 1))
        .build();
      console.log("ElasticSearch Query", JSON.stringify(query, null, 2));
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
