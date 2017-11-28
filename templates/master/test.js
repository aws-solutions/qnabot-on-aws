var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "master":stack('master',{
        Email:'jcalho@amazon.com',
        BootstrapBucket:{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
        BootstrapPrefix:{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
        PublicOrPrivate:"PRIVATE"
    })
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
