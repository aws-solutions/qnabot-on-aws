
// returns true if score is within tolerance of top_score
function is_score_match(score, top_score) {
    const diff_tolerance = process.env.TOPIC_TIEBREAKER_SCORE_DIFF_TOLERANCE || 0.001;
    return ((score + diff_tolerance) >= top_score);
}

// splits topic strings and checks for any word overlap indicating a topic match - case insensitive
function is_topic_match(topic1, topic2) {
    let match=0;
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
    let sorted_hits=[];
    for (let i=0; i < hits.length; i++) {
        if (is_topic_match(topic, hits[i]._source.t)) {
            sorted_hits.unshift(hits[i]);
        } else {
            sorted_hits.push(hits[i]);
        }
    }
    return sorted_hits;
}

function hits_topic_tiebreaker(topic, hits) {
    console.log(`Apply topic "${topic}" to rank order top hits with matching score`);
    let equal_hits = []
    for (let i=0; i < hits.length; i++) {
        // compare score of each hit to score of topd ranked item (index 0)
        if (is_score_match(hits[i]._score, hits[0]._score)) {
            // if score is within match tolerance, set it to equal top score
            hits[i]._score = hits[0]._score;
            equal_hits.push(hits[i]);
        } else {
            break;
        }
    }
    let sorted_equal_hits = sort_hits_by_topic_match(topic, equal_hits);
    for(let i=0; i < sorted_equal_hits.length; i++) {
        // replace initial hits with matching scores with the new re-sorted list
        hits[i] = sorted_equal_hits[i];
    }
    return hits;
}

module.exports = function (topic, hits) {
    return hits_topic_tiebreaker(topic, hits);
};