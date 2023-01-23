
function is_score_match(score, top_score) {
    return (score == top_score);
}

// splits topic strings and checks for any word overlap indicating a topic match - case insensitive
function is_topic_match(topic1, topic2) {
    match=0;
    if (!topic1 && !topic2) {
        // topics are both empty or undefined => match
        match = 1;
    } else if (topic1 && topic2) {
        // both topic strings defined.. match if they intersect
        let words1 = topic1.toLowerCase().split(/[ ,]+/);
        let words2 = topic2.toLowerCase().split(/[ ,]+/);
        const intersection = words1.filter(element => words2.includes(element));
        match = intersection.length;
    } else {
        // one or the other is empty/undefined => no match
        match = 0;
    }
    return match ;
}

function sort_hits_by_topic_match(topic, hits) {
    let i=0;
    let sorted_hits=[];
    while (i < hits.length) {
        if (is_topic_match(topic, hits[i]._source.t)) {
            sorted_hits.unshift(hits[i]);
        } else {
            sorted_hits.push(hits[i]);
        }
        i++;
    } 
    return sorted_hits;  
}

function hits_topic_tiebreaker(topic, hits) {
    console.log(`Apply topic "${topic}" to rank order top hits with matching score`);
    let equal_hits = []
    let i=0;
    let top_score=0;
    while (i < hits.length) {
        // compare score of each hit to score of topd ranked item (index 0)
        if (is_score_match(hits[i]._score, hits[0]._score)) {
            equal_hits.push(hits[i]);
        } else {
            break;
        }
        i++;
    }
    var sorted_equal_hits = sort_hits_by_topic_match(topic, equal_hits);
    i=0;
    while (i < sorted_equal_hits.length) {
        // replace initial hits with matching scores with the new re-sorted list
        hits[i] = sorted_equal_hits[i];
        i++;
    }
    return hits;
}

module.exports = function (topic, hits) {
    return hits_topic_tiebreaker(topic, hits);
};

/* Tests
hits=[ {_score:0.1,_source:{t:"qnabot"}}, {_score:0.1,_source:{t:"echoshow"}}, {_score:0.1,_source:{}}, {_score:0.05,_source:{t:"qnabot"}}]
hits_topic_tiebreaker("",hits)
    [
        { _score: 0.1, _source: {} },
        { _score: 0.1, _source: { t: 'echoshow' } },
        { _score: 0.1, _source: { t: 'qnabot' } },
        { _score: 0.05, _source: { t: 'qnabot' } }
    ]
hits_topic_tiebreaker("echoshow",hits)
    [
        { _score: 0.1, _source: { t: 'echoshow' } },
        { _score: 0.1, _source: {} },
        { _score: 0.1, _source: { t: 'qnabot' } },
        { _score: 0.05, _source: { t: 'qnabot' } }
    ]
*/