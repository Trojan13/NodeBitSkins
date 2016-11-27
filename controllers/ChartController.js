var express = require('express');
var totp = require('notp').totp;
var fs = require('fs');
var app = express();
var RequestHelper = require('../helper/RequestHelper.js');
module.exports = {
    getSite: function (req, res, next) {
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
         myData = [];
         myLabels = [];
        for (var o in f.reverse()) {
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
    , getSite2: function (req, res, next) {
        RequestHelper.myLimitedRq('get_account_balance', '', function (data) {
            var myMoney = parseFloat(data.data.available_balance);
            RequestHelper.myLimitedRq('get_money_events', '&page=1', function (data) {
                myData = [];
                myLabels = [];
                myObjs = data.data.events;
                myObjs.sort(function (a, b) {
                    if (a.time > b.time) {
                        return 1;
                    }
                    else if (a.time < b.time) {
                        return -1;
                    }
                    else {
                        return 0;
                    }
                });
                myObjs.reverse();
                myData.push(myMoney.toFixed(5));
                myLabels.push('NOW');
                for (o in myObjs) {
                    switch (myObjs[o].type) {
                    case "sale fee":
                        myMoney = myMoney + parseFloat(myObjs[o].amount);
                        myData.push(myMoney.toFixed(3));
                        myLabels.push('SaleFee ' + myObjs[o].amount + "      " + RequestHelper.timeConverter(myObjs[o].time));
                        break;
                    case "item sold":
                        myMoney = myMoney - parseFloat(myObjs[o].price);
                        myData.push(myMoney.toFixed(3));
                        myLabels.push('ItemSold ' + myObjs[o].price + "      " + RequestHelper.timeConverter(myObjs[o].time));
                        break;
                    case "item bought":
                        myMoney = myMoney + parseFloat(myObjs[o].price);
                        myData.push(myMoney.toFixed(3));
                        myLabels.push('ItemBought ' + myObjs[o].price + "      " + RequestHelper.timeConverter(myObjs[o].time));
                        break;
                    default:
                        myData.push("lol");
                    }
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
            }, function (data) {
                res.status(500);
                res.setHeader('Content-Type', 'text/html');
                res.send('Error in get_money_events <br>Used func:get_money_events<br> Errormsg: ' + data);
            });
        }, function (data) {
            res.status(500);
            res.setHeader('Content-Type', 'text/html');
            res.send('Error in getBalance <br>Used func:get_account_balance<br> Errormsg: ' + data);
        });
}
}