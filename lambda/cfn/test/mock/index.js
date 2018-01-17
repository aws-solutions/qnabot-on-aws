#! /usr/bin/env node
var JWT=require('jsonwebtoken')
var fs = require('fs');
var express = require('express');
var https = require('https');
var key = fs.readFileSync(__dirname+'/key.pem');
var cert = fs.readFileSync(__dirname+'/cert.pem')
var https_options = {
    key: key,
    cert: cert
};
var PORT = 8000;
var HOST = 'localhost';
app = express();
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({type:()=>true}))
var callback
exports.register=function(fnc){
    console.log("registered")
    callback=fnc 
}
exports.server=function(test){
    app.put('/*', function (req, res) {
        console.log("recieved")
        callback(req.body.Status)
        res.send()
    })

    server = https.createServer(https_options, app).listen(PORT, HOST);
    console.log('HTTPS Server listening on %s:%s', HOST, PORT);
    return server
}



