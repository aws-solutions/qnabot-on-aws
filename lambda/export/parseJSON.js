// parseJSON.js

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output CSV file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the CSV
 * @returns output_path
 */
async function qnaJsonParser(params) {
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: params.output_path,
    header: [
      {id: 'question', title: 'Question'},
      {id: 'answer', title: 'Answer'},
      {id: 'link', title: 'Document URL (optional)'},
    ]
  });
  
  var qna = `{"qna":[${params.content.toString().replace(/\n/g,',\n')}]}`
  params.content = JSON.parse(qna);
  const q_list = params.content.qna;
  
  const data = [];
  q_list.forEach(function(elem) {
      var json_doc = JSON.stringify(elem);    // puts entire JSON structure in URL field
      if (elem.q) {                           // qna type questions (standard)
        elem.q.forEach(function(ques){
          var entry = {question:ques, answer:elem.a, link:json_doc};
          data.push(entry);
        })
      } else {
        console.log(`this element is not supported with KendraFAQ and was skipped in the sync: ${JSON.stringify(elem)}`);
      }
      
  });
  
  return csvWriter
    .writeRecords(data)
    .then(()=> console.log('The CSV file ' + params.output_path + ' was written successfully'));
  
}

exports.handler = async (params) => {
    return await qnaJsonParser(params);
};