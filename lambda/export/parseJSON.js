// parseJSON.js

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output CSV file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the CSV
 * @returns output_path
 */
function qnaJsonParser(input_path, output_path) {
  const createCsvWriter = require('./node_modules/csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: output_path,
    header: [
      {id: 'question', title: 'Question'},
      {id: 'answer', title: 'Answer'},
      {id: 'link', title: 'Document URL (optional)'},
    ]
  });
  
  const data = [];
  
  const q_list = require(input_path).qna;
  q_list.forEach(function(elem) {
    elem.q.forEach(function(ques) {
      
      var json_doc = JSON.stringify(elem);
      var entry = {question:ques, answer:elem.a, link:json_doc};    // entire JSON structure in URL field
      
      data.push(entry);
    });
  });
  
  csvWriter
    .writeRecords(data)
    .then(()=> console.log('The CSV file ' + output_path + ' was written successfully'));
    
  return output_path;
}

exports.handler = async (params) => {
    return qnaJsonParser(params.input_path, params.output_path);
};