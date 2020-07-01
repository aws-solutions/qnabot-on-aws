// parseJSON.js

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output CSV file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the CSV
 * @param plainText : a boolean to write the standard Q&A format or the JSON meta-data format
 * @returns output_path
 */
function qnaJsonParser(input_path, output_path, plainText) {
  // sets default behavior to construct a plain text FAQ which does NOT string-ify the entire JSON field into the 'Answer' column
  if (plainText == undefined) {
    plainText = true;
  }
  
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
      
      // var ans = JSON.stringify(elem);
      // var entry = {question:ques, answer: ans, link:'<document url>'};    // entire JSON field in the answer field
      
      var entry = {question:ques, answer:elem.a, link:'<document url>'};  // original
      data.push(entry);
    });
  });
  
  csvWriter
    .writeRecords(data)
    .then(()=> console.log('The CSV file ' + output_path + ' was written successfully'));
    
  return output_path;
}

exports.handler = async (input, output, plainText) => {
    return qnaJsonParser(input, output, plainText);
};