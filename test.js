var rp = require('request-promise');
var express = require('express');
var totp = require('notp').totp;
var base32 = require('thirty-two');
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(6, 'minute');
var http = require('http');
var rp = require('request-promise');
var RequestHelper = require('./helper/RequestHelper.js');
var fs = require('fs');
var idstmp = [];
var api_key = '';
var secret = '';
var twofactorcode = totp.gen(base32.decode(secret));
console.log(twofactorcode);
var myTime = 1000;
var crawlBuyTime = 50;
//test();
logMoney();

function test() {
    fs.readFile('money.txt', function read(err, data) {
        if (err) {
            throw err;
        }
        myLimitedRq('get_account_balance', '', function (data) {
            var myMoney = parseFloat(data.data.available_balance);
            myLimitedRq('get_money_events', '&page=1', function (data) {
                myData = [];
                myLabels = [];
                allData = [""];
                myObjs = data.data.events;
                console.log(f[0]);
                for (var o in myObjs) {
                    if ((myObjs[o].medium.class_id == f[0].medium.class_id) && (myObjs[o].time == f[0].time)) {
                        myObjs = myObjs.slice(0, o);
                        break;
                    }
                }
                console.log("Added " + myObjs.length + " new Objects.");
                for (var key in myObjs) f[key] = f[key];
                fs.writeFile('money.txt', JSON.stringify(f), function () {});
            }, function (data) {
                console.log(data);
            });
        }, function (data) {
            console.log(data);
        });
    });
}


function moneyToChart() {
    fs.readFile('money.txt', function read(err, data) {
        if (err) {
            throw err;
        }
        try {
            f = JSON.parse(data);
        }
        catch (err) {
            f = [];
        }
        var myData = [];
        var myLabels = [];
        for (var o in f) {
         myLabels.push(f[o].date);   
          myData.push(f[o].money);    
        }
        
        var data = {
            title: 'Chart Page'
            , chart: {
                labels: myLabels
                , data: myData
            }
        }
        res.status(200);
        res.setHeader('Content-Type', 'text/html');
        res.render('chart', data);
        res.end();
    });
}
/*
u = bitskins.com api function
a = additional req params
cb1 = then
cb2 = catch
*/
function myLimitedRq(u, a, cb1, cb2) {
    var uri = 'https://bitskins.com/api/v1/' + u + '/?api_key=' + api_key + '&code=' + get2factorCode() + a;
    limiter.removeTokens(1, function () {
        var options = {
            uri: uri
            , headers: {
                'User-Agent': 'Request-Promise'
            }
            , json: true
        };
        rp(options).then(function (res) {
            return cb1(res);
        }).catch(function (err) {
            return cb2(err);
        });
    });
};

function get2factorCode() {
    return totp.gen(base32.decode(secret));
}