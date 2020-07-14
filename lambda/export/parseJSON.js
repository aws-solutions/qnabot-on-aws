// parseJSON.js

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output CSV file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the CSV
 * @returns output_path
 */
function qnaJsonParser(params) {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: params.output_path,
    header: [
      {id: 'question', title: 'Question'},
      {id: 'answer', title: 'Answer'},
      {id: 'link', title: 'Document URL (optional)'},
    ]
  });
  
  const data = [];
  console.log('parseJSON.content is ')
  console.log(params.content);
  var qna = `{"qna":[${params.content.toString().replace(/\n/g,',\n')}]}`
  params.content = JSON.parse(qna).qna;
  console.log("parseJSON content params after JSON-ing");
  console.log(params.content);
  
  const q_list = params.content.qna;
  q_list.forEach(function(elem) {
    elem.q.forEach(function(ques) {
      
      var json_doc = JSON.stringify(elem);
      var entry = {question:ques, answer:elem.a, link:json_doc};    // entire JSON structure in URL field
      
      data.push(entry);
    });
  });
  
  return csvWriter
    .writeRecords(data)
    .then(()=> console.log('The CSV file ' + params.output_path + ' was written successfully'));
  
}

exports.handler = async (params) => {
    return qnaJsonParser(params);
};