
var AWS = require('aws-sdk');
var CfnLambda = require('cfn-lambda');

var ES = new AWS.ES({apiVersion: '2015-01-01'});
var Lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

var BoolProperties = [
  'EBSOptions.EBSEnabled',
  'ElasticsearchClusterConfig.DedicatedMasterEnabled',
  'ElasticsearchClusterConfig.ZoneAwarenessEnabled',
  'CognitoOptions.Enabled'
];

var NumProperties = [
  'EBSOptions.Iops',
  'EBSOptions.VolumeSize',
  'ElasticsearchClusterConfig.DedicatedMasterCount',
  'ElasticsearchClusterConfig.InstanceCount',
  'SnapshotOptions.AutomatedSnapshotStartHour'
];


var Update = CfnLambda.SDKAlias({
  api: ES,
  method: 'updateElasticsearchDomainConfig',
  forceBools: BoolProperties,
  forceNums: NumProperties,
  returnPhysicalId: getPhysicalId
});

var Create = Update;

function getPhysicalId(data, params) {
  return CfnLambda.Environment.AccountId + '/' + params.DomainName;
}

module.exports=class ElasticsearchDomainUpdate {
    constructor(){
        Object.assign(this,{
            Create: Create,
            Update: Update,
            Delete: function(ID,params,reply){
                reply()
            },
            NoUpdate: NoUpdate,
            TriggersReplacement: ['DomainName'],
            LongRunning: {
                PingInSeconds: 30,
                MaxPings: 60,
                LambdaApi: Lambda,
                Methods: {
                  Create: CheckCreate,
                  Update: CheckUpdate
                }
            }
        })
    }
};

function CheckProcessComplete(params, reply, notDone) {
  ES.describeElasticsearchDomain({
    DomainName: params.DomainName
  }, function(err, domain) {
    if (err) {
      console.error('Error when pinging for Processing Complete: %j', err);
      return reply(err.message);
    }
    if (domain.DomainStatus.Processing || (!domain.DomainStatus.Endpoint && !domain.DomainStatus.Endpoints.vpc) ) {
      console.log('Status is not Processing: false yet. Ping not done: %j', domain);
      return notDone();
    }
    console.log('Status is Processing: false! %j', domain);
    reply(null, domain.DomainStatus.DomainId, {
      Endpoint: domain.DomainStatus.Endpoint ? domain.DomainStatus.Endpoint : domain.DomainStatus.Endpoints.vpc
    });
  });
}

function CheckCreate(createReponse, params, reply, notDone) {
  CheckProcessComplete(params, reply, notDone);
}

function CheckUpdate(updateResponse, physicalId, params, oldParams, reply, notDone) {
  CheckProcessComplete(params, reply, notDone);
}

function NoUpdate(phys, params, reply) {
  ES.describeElasticsearchDomain({
    DomainName: params.DomainName
  }, function(err, domain) {
    if (err) {
      console.error('Error when pinging for NoUpdate Attrs: %j', err);
      return reply(err.message);
    }
    console.log('NoUpdate pingcheck success! %j', domain);
    reply(null, domain.DomainStatus.DomainId, {
      Endpoint: domain.DomainStatus.Endpoint ? domain.DomainStatus.Endpoint : domain.DomainStatus.Endpoints.vpc
    });
  });
}

