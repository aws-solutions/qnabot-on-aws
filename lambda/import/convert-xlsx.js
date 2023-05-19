var XLSX = require("read-excel-file")
const _ = require('lodash')

exports.convertxlsx = async function (content) {

  //this headermap enabled customers to more conveniently
  //map some of the more common fields using a 'friendly' name
  let headerMapping = {
    question: 'q',
    topic: 't',
    markdown: 'alt.markdown',
    answer: 'a',
    'Answer': 'a',
    ssml: 'alt.ssml'
  };

  console.log('inside convert json')
  try {
    let sheetNames = await XLSX.readSheetNames(content)
    var valid_questions = [];
    for(let i = 0; i < sheetNames.length; i++){
        // Here is your object
        let rows = await XLSX.default(content, {sheet: sheetNames[i]})
        let headerRow = rows.shift()
        let excelRowNumber = 1; //excel sheets start at index 1, which for us is the header
        rows.forEach((question) => {
            console.log('Processing ' + JSON.stringify(question));
            excelRowNumber++;

            //first let's remap the current row entry from an index array
            //to a key value map for easier processing
            let questionMap = {}
            for(let j = 0; j < headerRow.length; j++){
                questionMap[headerRow[j]] = question[j]
            }
            question = questionMap

            //let's try and map a couple friendly column names into their
            //actual property names using the header mapping (e.g. 'topic' to 't')
            for (const property in headerMapping) {
                let dest_property = headerMapping[property];
                if (question[dest_property] == undefined) {
                    console.log('Assigning value for ' + dest_property);
                    _.set(question, dest_property, question[property]);
                    delete question[property];
                }
            }


            //lets try to extract all of the user questions
            question.q = question.q ? [question.q] : []
            let counter = 1;
            while (true) {
                //users can import multiple utterances, be appending sequential numbers to
                //the column 'question', e.g. question8
                var userQuestion = question['question' + counter];
                if(!userQuestion) {
                    //break on the first instance of missing question number. For example,
                    //if user has question1 and question3 in their excel file, but no question2
                    //then we would never look at question3 because question2 is missing
                    break
                }
                question.q.push(userQuestion.replace(/(\r\n|\n|\r)/gm, ' '));
                delete question['question' + counter];
                counter++;
            }

            //validate mandatory fields of qid, question, and answer
            //qid must exist
            if (!question.qid) {
                console.log(
                    `Warning: No QID found for line ${excelRowNumber}. The question will be skipped.`
                );
                return;
            }
            //must have atleast 1 question
            if (question.q.length == 0) {
                console.log(
                    'Warning: No questions found for QID: "' +
                        question.qid +
                        '". The question will be skipped.'
                );
                return;
            }
            //answer must exist and include valid characters
            if (!question.a || question.a.replace(/[^a-zA-Z0-9-_]/g, '').trim().length == 0) {
                console.log(
                    'Warning: No answer found for QID:"' +
                        question.qid +
                        '". The question will be skipped.'
                );
                return;
            }

            if (question['cardtitle']) {
                console.log('processing response title');
                question.r = {};
                question.r.title = question['cardtitle'];
                delete question['cardtitle'];
                if (question['imageurl']) {
                    question.r.imageUrl = question.imageurl;
                    delete question.imageurl;
                }
                if (question['cardsubtitle']) {
                    question.r.subTitle = question.subtitle;
                    delete question['cardsubtitle'];
                }

                //TODO, refactor to operate similar to import.vue
                //better yet, move common xlsx validation into common-modules
                question.r.buttons = []
                let i = 1
                while (true) {
                  console.log("Processing Button" + i)
                  var buttonFieldTextName = "displaytext" + i
                  var buttonFieldValueName = "buttonvalue" + i
                  i++
                  var undefinedButtonFieldCount = (question[buttonFieldTextName] == undefined) + (question[buttonFieldValueName] == undefined)
                  console.log("ButtonName " + question[buttonFieldTextName] + " ButtonValue " + question[buttonFieldValueName])
                  console.log("Undefined field count " + undefinedButtonFieldCount)

                  if (undefinedButtonFieldCount == 2) {
                    break
                  }
                  if (undefinedButtonFieldCount == 1) {
                    console.log(`Warning:  Both ${buttonFieldTextName} and ${buttonFieldValueName} must be defined for qid: "${question.qid}"`)
                    continue;
                  }
                  console.log("Found two values")
                  if (question[buttonFieldValueName].length > 80) {
                    console.log(`Warning: ${buttonFieldValueName} must be less than or equal to 80 characters for qid:"${question.qid}"`)
                    continue;
                  }
                  if (question[buttonFieldTextName].length > 80) {
                    console.log(`Warning: ${buttonFieldTextName} must be less than or equal to 80 characters for qid:"${question.qid}"`)
                    continue;
                  }
                  var button = {
                    "text": question[buttonFieldTextName],
                    "value": question[buttonFieldValueName]
                  }
                  console.log("Adding button " + JSON.stringify(button))
                  question.r.buttons.push(button)
                  delete question[buttonFieldTextName]
                  delete question[buttonFieldValueName]
                }
            }

            //properties with a '.' should be treated as nested properties
            //let's set any that we find into their proper destination within the object
            //e.g. 'botRouting.specialty_bot' ==> 'botRouting': { 'specialty_bot': value }
            for (let property in question) {
              if (property.includes('.')) {
                  let value = question[property]
                  //need to delete the property first to ensure lodash treats the property
                  //variable as a path, and not just as a string key
                  delete question[property];
                  if(value != null){
                      _.set(question, property, value);
                  }
              }
            }

            //Note that at this point we have stopped processing the excel file and any additional
            //fields will be left as is. This means that new or more advanced fields can be imported
            //by directly referencing their schema id (e.g. 'kendraRedirectQueryArgs')
            console.log('Processed ' + JSON.stringify(question));
            valid_questions.push(question);
        });
    };
    return valid_questions
  } catch (err) {
    console.log("Parse error");
    console.log(err);
    throw err;
  }
}
