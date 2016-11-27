// SERVER SETUP
// =========================================================
var totp = require('notp').totp;
var base32 = require('thirty-two');
var rp = require('request-promise');
var ejs = require('ejs');
var fs = require('fs');
var express = require('express');


// GLOBAL SCOPE
// =========================================================
global.__coreDir = __dirname + "/";
global.__port = 8080;
global.__ip = '127.0.0.1';


// EXPRESS SETUP
// =========================================================
var app = express();
app.set('port', __port);
app.disable('x-powered-by');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('view cache', false);
app.set('layout', 'default');

app.use(express.static('public'));

// ROUTEN
// =========================================================
var routes = require('./router');
app.use('/', routes);


// ERROR HANDLING AND OUTPUT PROCESSING
// =========================================================
app.use(function(err, req, res, next) {
    if (err) {
        res.status(err.code || 500);
        res.send(err);
    } else {
        // No error occured so we proceed with the actual response \o/
        next();
    }
});

app.use(function(req, res, next) {
    if (req.response !== undefined) {
        res.json(req.response);
    }
    // Catch 404s
    else {
         var data = {
            title: 'Main Page'
        };
       res.status(404);
        res.setHeader('Content-Type', 'text/html');
        res.render('404',data);
    }
});

// START WEBSERVER
// =========================================================
app.listen(__port);
console.log("Server started: " +__ip+":"+__port);