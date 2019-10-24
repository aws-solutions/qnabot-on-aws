var _=require('lodash');
var jws = require('jws');
const jwksClient = require('jwks-rsa-promisified');


exports.decode=function (jwt) {
  var decoded = jws.decode(jwt, {complete:true});
  if (!decoded) { return null; }
  var payload = decoded.payload;
  //try parse the payload
  if(typeof payload === 'string') {
  try {
    var obj = JSON.parse(payload);
    if(obj !== null && typeof obj === 'object') {
      payload = obj;
    }
  } catch (e) { }
  }
  return {
    header: decoded.header,
    payload: payload,
    signature: decoded.signature
  };
};

exports.verify=async function (kid,urls) {
  for (var index = 0; index < urls.length; index++) { 
    var url=urls[index]; 
    const client = jwksClient({
      jwksUri: url,
    });
    try {
      await client.getSigningKeyAsync(kid);  
      console.log("Verified idaccess token key with trusted IdP:", url);
      return url;
    } catch (e) {
      console.log("Token key does not match trusted IdP jwks from:", url);
    }
  }
  return false;
};
