var base=require('./base')
var Promise=require('bluebird')
var cfExports=require('../../bin/exports')

var setup=cfExports.then(function(exports){
    var param={
		DirectoryArn:exports["ENVOY-DIRECTORY-ARN"], 
		IsUnique: true, 
		OrderedIndexedAttributeList: [{
            FacetName: 'Person', 
            Name: 'username', 
		    SchemaArn: exports["ENVOY-DIRECTORY-SCHEMA-ARN"]
		}],
		LinkName: 'test8',
		ParentReference: {
		    Selector:"$"+exports["ENVOY-DIRECTORY-ROOT"]
		}    
    }
    return param
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("CloudDirObject",stage,param))
}
