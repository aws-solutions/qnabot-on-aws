// parseJSON.js

const { S3, FSx } = require('aws-sdk');
var fs = require('fs');

/**
 * Function to parse JSON of configurations/questions from QNA Content Designer and write an output Kendra JSON FAQ file
 * @param input_path : the input file path of the exported JSON
 * @param output_path : the output file path to write the JSON
 * @returns output_path
 */
async function qnaJsontoKendraJsonParser(params){
  var data = {
    "SchemaVersion": 1,
    "FaqDocuments": [
            ]
        }
    
  var qna = `{"qna":[${params.content.toString().replace(/\n/g,',\n')}]}`
  params.content = JSON.parse(qna);
  const q_list = params.content.qna;
  
  //const data = [];
  q_list.forEach(function(elem) {
      if (elem.q) {                           // qna type questions (standard)
        elem.q.forEach(function(ques){
          var entry = {
            Question:ques, 
            Answer:elem.a, 
            Attributes:{
              // use standard index attribute _source_uri  (string) to reference qid
              // - embedding the entire JSON document can cause issues with Kendra attribute length limits
              // - custom attributes need to be added at the index level, which represents extra work/complexity for user
              // QnABot query lambda will use the qid stored in the _source_uri attribute to retrieve full JSON doc from ES
              _source_uri : JSON.stringify({_source_qid: elem.qid})
            }
          };
          data.FaqDocuments.push(entry);
        })
      } else {
        console.log(`this element is not supported with KendraFAQ and was skipped in the sync: ${JSON.stringify(elem)}`);
      }
      
  });
  console.log(`Kendra Data ${JSON.stringify(data)}`)

  fs.writeFileSync(params.output_path,JSON.stringify(data),{encoding: "utf8"});
  console.log('The JSON file ' + params.output_path + ' was written successfully')
  return 
  
}


exports.handler = async (params) => {
    return await qnaJsontoKendraJsonParser(params)
};