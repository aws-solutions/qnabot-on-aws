var stack=require('../util').stacktest
var config=require('../../config')
module.exports={
  "Resources": {
    "master":stack('master',{
        Email:config.devEmail,
        BootstrapBucket:{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
        BootstrapPrefix:{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
        PublicOrPrivate:"PRIVATE"
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
