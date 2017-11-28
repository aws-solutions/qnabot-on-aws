var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "domain":stack('domain',{})
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
