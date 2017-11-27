module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": {
    "Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {}
    }  
   },
   "Outputs": {
        "Bucket": {
            "Value": {"Ref": "Bucket"},
            "Export":{"Name":"QNA-DEV-BUCKET"}
        }
   }
}
