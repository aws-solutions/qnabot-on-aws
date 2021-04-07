// mockClient3.js

// query calls func(err, data) to return the Data from Kendra JSON from the CloudWatch log
exports.query = function(params, func) {
    const data = require('./kendraData_doc_query.json');
    func(undefined, data);
};
