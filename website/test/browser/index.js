var webdriverio = require('webdriverio');
var options = { 
    desiredCapabilities: { browserName: 'chrome' } 
};
var client = webdriverio.remote(options);
require('./auth')(client)
module.exports=client
