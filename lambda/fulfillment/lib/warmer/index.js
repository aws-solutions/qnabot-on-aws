const AWS = require('aws-sdk');
const url = require('url');

let credentials;

let getMetadataCredentials = function() {
  credentials = new AWS.EC2MetadataCredentials();
  return credentials.getPromise()
};

let getCredentials = async function() {
  var profile = process.env.AWS_PROFILE;
  if(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && !profile) {
    credentials = new AWS.EnvironmentCredentials('AWS');
    return;
  }

  if(!profile) {
    try {
      await getMetadataCredentials();
      return;
    } catch(err) {
      console.error('Unable to access metadata service.', err.message);
    }
  }

  credentials = new AWS.SharedIniFileCredentials({
    profile: profile || 'default',
    // the filename to use when loading credentials
    // use of AWS_SHARED_CREDENTIALS_FILE environment variable
    // see also 'The Shared Credentials File' http://docs.aws.amazon.com/cli/latest/topic/config-vars.html
    filename: process.env.AWS_SHARED_CREDENTIALS_FILE
  });
  return credentials.getPromise();
}

let execute = function(endpoint, region, path, method, body) {
  return new Promise((resolve, reject) => {
    var req = new AWS.HttpRequest(endpoint);
    req.method = method || 'GET';
    req.path = path;
    req.region = region;

    if(body) {
      if(typeof body === "object") {
        req.body = JSON.stringify(body);
      } else {
        req.body = body;
      }
    }

    req.headers['presigned-expires'] = false;
    req.headers['content-type'] = 'application/json';
    req.headers['content-length'] = Buffer.byteLength(req.body);
    req.headers.Host = endpoint.host;

    var signer = new AWS.Signers.V4(req, 'es');
    signer.addAuthorization(credentials, new Date());

    var send = new AWS.NodeHttpClient();
    send.handleRequest(req, null, (httpResp) => {
      var body = '';
      httpResp.on('data', (chunk) => {
        body += chunk;
      });
      httpResp.on('end', (chunk) => {
        resolve(body);
      });
    }, (err) => {
      console.log('Error: ' + err);
      reject(err);
    });
  });
};

let main = async function() {
  let res = "";
  let proto = "http"
  var maybeUrl = `${proto}://${process.env.TARGET_URL}/${process.env.TARGET_INDEX}/${process.env.TARGET_PATH}`;
  var method = 'GET';
  var region = process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';


  await getCredentials();

  const input = "";
  if(maybeUrl && maybeUrl.indexOf('http') === 0) {
    var uri = url.parse(maybeUrl);
    let d1 = new Date();
    var endpoint = new AWS.Endpoint(uri.host);
    let d2 = new Date();
    let time1 = {};
    time1.metric = 'EndPointSetup';
    time1.t1 = d1.getTime();
    time1.t2 = d2.getTime();
    time1.duration = d2.getTime() - d1.getTime();
    console.log(`${JSON.stringify(time1)}`);
    let e1 = new Date();
    res = await execute(endpoint, region, uri.path, method, input);
    let e2 = new Date();
    let time2 = {};
    time2.metric = 'TotalESQueryTime';
    time2.t1 = e1.getTime();
    time2.t2 = e2.getTime();
    time2.duration = e2.getTime() - e1.getTime();
    console.log(`${JSON.stringify(time2)}`);
  }
  return res;
};

module.exports=class warmer {
  constructor() {
  }

  async perform(event, context, callback) {
    let count = process.env.REPEAT_COUNT ? parseInt(process.env.REPEAT_COUNT) : 4;
    console.log(`Incoming payload: ${JSON.stringify(event, null, 2)}`);
    try {
      for (let i = 0; i < count; i++) {
        console.log(`main ${i}`);
        let res = await main();
        console.log(res);
      }
      return ("success");
    } catch (e) {
      console.log(`Error detected ${e}`);
      return ("failure");
    }
  }

}
