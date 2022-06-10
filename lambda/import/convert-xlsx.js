var XLSX = require("xlsx")
const _ = require('lodash')

exports.convertxlsx = function (content) {
  
  var header_mapping = {
    question: "q",
    topic: "t",
    markdown: "alt.markdown",
    answer: "a",
    "Answer": "a",
    ssml: "alt.ssml",
  };

  console.log('inside convert json')
  try {
    var workbook = XLSX.read(content, {
      type: 'array'
    });
    var valid_questions = []
    workbook.SheetNames.forEach(function (sheetName) {
      // Here is your object
      var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      var json_object = JSON.stringify(XL_row_object);
      var question_number = 1
      XL_row_object.forEach(question => {
        console.log("Processing " + JSON.stringify(question))
        for (const property in header_mapping) {
          var dest_property = header_mapping[property]
          if (question[dest_property] == undefined) {
            _.set(question, dest_property.split("."), question[property])
            console.log("Assigning value for " + dest_property)
            delete question[property]
          }
        }
        question_number++
        if (question["cardtitle"] != undefined) {
          console.log("processing response title")
          question.r = {}
          question.r.title = question["cardtitle"]
          delete question["cardtitle"]
          if (question["imageurl"] != undefined) {
            question.r.imageUrl = question.imageurl
            delete question.imageurl
          }
          if (question["cardsubtitle"] != undefined) {
            question.r.subTitle = question.subtitle
            delete question["cardsubtitle"]
          }
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
        let counter = 1
        question.q = question.q == undefined ? [] : question.q
        while (true) {
          var userQuestion = question["question" + counter]
          if (userQuestion != undefined) {
            question.q.push(userQuestion.replace(/(\r\n|\n|\r)/gm, " "))
            delete question["question" + counter]
            counter++
          } else {
            break;
          }
        }
        for (let property in question) {
          if (property.includes(".")) {
            _.set(question, property.split("."), question[property])
          }
        }
        if (question.qid == undefined) {
          console.log(`Warning: No QID found for line ${question_number}. The question will be skipped.`)
          return []
        }

        if (question.a == undefined || question.a.replace(/[^a-zA-Z0-9-_]/g, '').trim().length == 0) {
          console.log("Warning: No answer found for QID:\"" + question.qid + "\". The question will be skipped.")
          return []
        }
        if (question.q.length == 0) {
          console.log("Warning: No questions found for QID: \"" + question.qid + "\". The question will be skipped.")
          return []
        }
        console.log("Processed " + JSON.stringify(question))
        valid_questions.push(question)
      })
    })
    return valid_questions
  } catch (err) {
    console.log("Parse error");
    console.log(err);
    throw err;
  }
}
