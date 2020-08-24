// Filenames must match across:
// aws-ai-qna-bot/templates/import/UpgradeAutoImport.js
// aws-ai-qna-bot/templates/master/UpgradeAutoExport.js
// and pattern in /aws-ai-qna-bot/lambda/import/index.js
var exportfile=`ExportAll_QnABot_v${process.env.npm_package_version}.json`;
var exportfile_metrics=`ExportAll_QnABot_v${process.env.npm_package_version}_metrics.json`;
var exportfile_feedback=`ExportAll_QnABot_v${process.env.npm_package_version}_feedback.json`;

module.exports={
    "PostUpgradeImport":{
        "Type": "Custom::PostUpgradeImport",
        "DependsOn":["ImportStepLambda"],
        "Properties": {
            ServiceToken: { "Ref" : "CFNLambda" },
            importbucket:{"Ref":"ImportBucket"},
            exportbucket:{"Ref":"ExportBucket"},
            id:exportfile,
            index:{"Ref":"VarIndex"},
            encryption:{"Ref":"Encryption"},
            es_endpoint:{"Ref":"EsEndpoint"},
        }
    },
    "PostUpgradeImportMetrics":{
        "Type": "Custom::PostUpgradeImport",
        "DependsOn":["ImportStepLambda"],
        "Properties": {
            ServiceToken: { "Ref" : "CFNLambda" },
            importbucket:{"Ref":"ImportBucket"},
            exportbucket:{"Ref":"ExportBucket"},
            id:exportfile_metrics,
            index:{"Ref":"MetricsIndex"},
            encryption:{"Ref":"Encryption"},
            es_endpoint:{"Ref":"EsEndpoint"},
        }
    },
    "PostUpgradeImportFeedback":{
        "Type": "Custom::PostUpgradeImport",
        "DependsOn":["ImportStepLambda"],
        "Properties": {
            ServiceToken: { "Ref" : "CFNLambda" },
            importbucket:{"Ref":"ImportBucket"},
            exportbucket:{"Ref":"ExportBucket"},
            id:exportfile_feedback,
            index:{"Ref":"FeedbackIndex"},
            encryption:{"Ref":"Encryption"},
            es_endpoint:{"Ref":"EsEndpoint"},
        }
    },
}


