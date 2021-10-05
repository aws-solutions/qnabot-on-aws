var _=require('lodash');
var jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa-promisified');
const qnabot = require("qnabot/logging")



exports.decode=function (idtoken) {
  var decoded = jwt.decode(idtoken, {complete:true});
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

async function getSigningKey(kid,url) {
    const client = jwksClient({
      jwksUri: url,
    });
    // locate IdP for the token from list of trusted IdPs
    var signingKey = "" ;
    try {
      var key = await client.getSigningKeyAsync(kid);
      signingKey = key.publicKey || key.rsaPublicKey ;
    } catch (e) {
    }
  return signingKey;
}

function verifyToken(idtoken,signingKey) {
  // verify that the token is valid and not expired
  try {
    jwt.verify(idtoken, signingKey) ;
    return true;
  } catch (e) {
    qnabot.log("idaccesstoken is not valid:", e);
    return false;
  }
}

exports.verify=async function (idtoken,kid,urls) {
  for (var index = 0; index < urls.length; index++) { 
    var url=urls[index]; 
    // locate IdP for the token from list of trusted IdPs
    qnabot.log("checking:",url);
    let signingKey = await getSigningKey(kid,url);
    if (signingKey) {
      qnabot.log("token kid matches:",url);
      qnabot.log("verifying token");
      if (verifyToken(idtoken,signingKey)) {
        return url;
      }
    }
  }
  return false;
};
