/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// returns true if score is within tolerance of top_score
function is_score_match(score, top_score) {
    const diff_tolerance = process.env.TOPIC_TIEBREAKER_SCORE_DIFF_TOLERANCE || 0.001;
    return ((score + diff_tolerance) >= top_score);
}

// splits topic strings and checks for any word overlap indicating a topic match - case insensitive
function is_topic_match(topic1, topic2) {
    // Case 1 (default): one or the other is empty/undefined => no match
    let match = 0;
    if (!topic1 && !topic2) {
        // Case 2: topics are both empty or undefined => match
        match = 1;
    } else if (topic1 && topic2) {
        // Case 3: both topic strings defined.. match if they intersect
        const words1 = topic1.toLowerCase().split(/[ ,]+/);
        const words2 = topic2.toLowerCase().split(/[ ,]+/);
        const intersection = words1.filter((element) => words2.includes(element));
        match = intersection.length;
    }

    return match;
}

function sort_hits_by_topic_match(topic, hits) {
    const same_topic = [];
    const different_topic = [];
    for (const hit of hits) {
        if (is_topic_match(topic, hit._source.t)) {
            same_topic.push(hit);
        } else {
            different_topic.push(hit);
        }
    }
    return same_topic.concat(different_topic);
}

function hits_topic_tiebreaker(topic, hits) {
    console.log(`Apply topic "${topic}" to rank order top hits with matching score`);
    const equal_hits = [];
    const topHit = hits[0]._score;
    for (const hit of hits) {
        // compare score of each hit to score of topd ranked item (index 0)
        if (is_score_match(hit._score, topHit)) {
            // if score is within match tolerance, set it to equal top score
            hit._score = topHit;
            equal_hits.push(hit);
        } else {
            break;
        }
    }
    const sorted_equal_hits = sort_hits_by_topic_match(topic, equal_hits);
    for (let i = 0; i < sorted_equal_hits.length; i++) {
        // replace initial hits with matching scores with the new re-sorted list
        hits[i] = sorted_equal_hits[i];
    }
    return hits;
}

module.exports = function (topic, hits) {
    return hits_topic_tiebreaker(topic, hits);
};
