// mockClient2.js for testing top_ans feature

// query calls func(err, data) to return the Data from Kendra JSON from the CloudWatch log
exports.query = function(params, func) {
    const data = require('./kendraData_top_ans.json');
    func(undefined, data);
};
