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
var morgan=require('morgan')
app.use(morgan(':method :url :status'))

app.put('/', function (req, res) {
    res.send()
})
app.put('/register', function (req, res) {
    res.send(
        {token:JWT.sign(
            {
                AccountId:12345,
                ApiUrl:"https://localhost:8000/register"
            },
            null,
            {algorithm:"none"}
        )} 
    )
})
app.delete('/register/:AccountId', function (req, res) {
    res.send()
})

module.exports=function(){
    server = https.createServer(https_options, app).listen(PORT, HOST);
    console.log('HTTPS Server listening on %s:%s', HOST, PORT);
    return server
}



