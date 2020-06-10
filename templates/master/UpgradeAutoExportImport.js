var exportfile=`ExportAll_QnABot_v${process.env.npm_package_version}.json`;
module.exports={
    "PreUpgradeExport":{
        "Type": "Custom::PreUpgradeExport",
        "Properties": {
            ServiceToken: { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            bucket:{"Ref":"ExportBucket"},
            id:exportfile,
            index:{"Fn::Sub":"${Var.QnaIndex}"},
        }
    },
    "PostUpgradeImport":{
        "Type": "Custom::PostUpgradeImport",
        "DependsOn":["CFNInvokePolicy","PreUpgradeExport","ElasticsearchDomainUpdate"],
        "Properties": {
            ServiceToken: { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            importbucket:{"Ref":"ImportBucket"},
            exportbucket:{"Ref":"ExportBucket"},
            id:exportfile,
            index:{"Fn::Sub":"${Var.QnaIndex}"},
        }
    },
}


