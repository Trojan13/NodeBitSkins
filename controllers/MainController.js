var express = require('express');
var app = express();
var unique = require('array-unique');
var RequestHelper = require('../helper/RequestHelper.js');
var fs = require('fs');
var moneySpent = 0.0
    , moneyInSale = 0.0;
var startTime = RequestHelper.getDateTime()
    , startTimeUnix = Math.round(+new Date() / 1000);
var lastError = ''
    , lastBuy = ''
    , lastMsg = '';
var itemArrayTryingToBuy = []
    , itemArrayBought = []
    , bought = []
    , buys = []
    , scannedID = []
    , scannedUnique = 0
    , logs = [];
var crawlBuyTime = 650
    , crawlSaleTime = 120000
    , crawlWithdrawTime = 120000
    , logMoneyTime = 3600000;
var inv_count = 0;
var tmpFirstItem, tmpLastItem, searchPage = 1
    , searchPage2 = 1
    , tmpFirstItem2, tmpLastItem2;
var savePrice = 1;
var matchExecptionString = ''; //'★|Souvenir(?! Package)|Case(?! Hardened| Key)|Case Key|StatTrack';
/* 
TODO:
Fix withdraw timings?
buyoneskins spamms less?
item id sell wrong

crawl all items
check new items on update
update all item prices -.01€

new:

new page set percentages

add:
get_my_inventory -> bitskins -> check updated -> if longer than 1 day -> 
check other prices ->

*/
logIt('Started! With code: ' + RequestHelper.get2factorCode(), 'INFO');
module.exports = {
    getInfo: function (req, res, next) {
        var data = {
            title: 'Main Page'
            , infos: showmesumthing()
            , buys: buys
            , logs: logs
        };
        res.status(200);
        res.setHeader('Content-Type', 'text/html');
        res.render('main', data);
        //res.render('main',data, function (err, html) {
        //  res.send(html,data);
        //});
        res.end();
    }
    , getSettings: function (req, res, next) {
        res.status(200);
        var data = {
            title: 'Main Page'
            , filter: matchExecptionString
            , buySettings: ''
        };
        res.setHeader('Content-Type', 'text/html');
        res.render('settings', data);
    }
    , getAction: function (req, res, next) {
        switch (req.query.action) {
        case "getcode":
            logIt('Generated new code: ' + RequestHelper.get2factorCode(), 'INFO');
            res.status(200);
            res.send(code);
            break;
        case "getlogs":
            res.status(200);
            res.send(logs);
            break
        default:
            res.status(404);
            res.setHeader('Content-Type', 'text/html');
            var data = {
                title: '404 Not Found'
            };
            res.render('404', data);
        }
    }
    , postAction: function (req, res, next) {
        console.log(req.body);
        switch (req.query.action) {
        case "setFilter":
            matchExecptionString = req.body.data;
            logIt('Set Filter to: ' + matchExecptionString, 'INFO');
        default:
            res.status(404);
            res.setHeader('Content-Type', 'text/html');
            var data = {
                title: '404 Not Found'
            };
            res.render('404', data);
        }
    }
};

(function repeat() {
   look4Skins();
    //look4Skins2();
    timer = setTimeout(repeat, crawlBuyTime);
})();
(function repeat2() {
    look4Sales();
    timer = setTimeout(repeat2, crawlSaleTime);
})();
(function repeat3() {
    look4Withdraw();
    timer = setTimeout(repeat3, crawlWithdrawTime);
})();
(function repeat4() {
    logMoney()
    timer = setTimeout(repeat4, logMoneyTime);
})();



function look4Skins() {
    RequestHelper.myLimitedRq('get_inventory_on_sale', '&page=' + searchPage + '&sort_by=created_at&order=desc', function (data) {
        var itemarr = data.data.items;
        for (var item in itemarr) {
            scannedID.push(itemarr[item].item_id);
            scannedUnique++;
            var sgP = itemarr[item].suggested_price;
            var P = itemarr[item].price
            var percent = Math.round(100 - ((P / sgP) * 100));
            if (itemarr[item].market_hash_name.match(matchExecptionString) == null || itemarr[item].market_hash_name.match(matchExecptionString) == "") {
                if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 0.02) && (sgP <= 0.10)) {
                    if (percent >= 80.0) {
                        logIt('look4Skins found item with 80% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                        itemArrayTryingToBuy.push(itemarr[item].item_id);
                        buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name, 80.0);
                    }
                }
                else if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 0.11) && (sgP <= 1.99)) {
                    if (percent >= 55.0) {
                        logIt('look4Skins found item with 55% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                        itemArrayTryingToBuy.push(itemarr[item].item_id);
                        buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name, 55.0);
                    }
                }
                else if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 2) && (sgP <= 80)) {
                    if (percent >= 40.0) {
                        logIt('look4Skins found item with 40% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                        itemArrayTryingToBuy.push(itemarr[item].item_id);
                        buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name, 30.0);
                    }
                }
                else if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 81)) {
                    if (percent >= 85.0) {
                        logIt('look4Skins found item with 85% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                        itemArrayTryingToBuy.push(itemarr[item].item_id);
                        buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name, 85.0);
                    }
                }
            }
        }
        if (searchPage > 1) {
            searchPage = 1;
        }
        if ((tmpFirstItem != itemarr[0].item_id) && (tmpLastItem != itemarr[itemarr.length - 1].item_id)) {
            searchPage += 1;
        }
        tmpFirstItem = itemarr[0].item_id;
        tmpLastItem = itemarr[itemarr.length - 1].item_id;
    }, function (data) {
        logIt('Error in look4skins <br>Used func: get_inventory_on_sale<br>  Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function look4Skins2() {
    RequestHelper.myLimitedRq('get_inventory_on_sale', '&page=' + searchPage2 + '&item_type=Knife&sort_by=created_at&order=desc', function (data) {
        var itemarr2 = data.data.items;
        for (var item2 in itemarr2) {
            scannedID.push(itemarr2[item2].item_id);
            var sgP2 = itemarr2[item2].suggested_price;
            var P2 = itemarr2[item2].price
            var percent2 = Math.round(100 - ((P2 / sgP2) * 100));
            if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 0.02) && (sgP2 <= 0.10)) {
                if (percent2 >= 80.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name, 80.0);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 0.11) && (sgP2 <= 1.99)) {
                if (percent2 >= 65.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name, 65.0);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 2) && (sgP2 <= 80)) {
                if (percent2 >= 85.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name, 85.0);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 81)) {
                if (percent2 >= 85.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name, 85.0);
                }
            }
        }
        searchPage2 = 1;
    }, function (data) {
        logIt('Error in look4skins2 <br>Used func: get_inventory_on_sale<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function sellem(itemobj) {
    var searchString = '';
    for (var item in itemobj) {
        searchString = encodeURIComponent(itemobj[item].market_hash_name) + ',' + searchString;
    }
    RequestHelper.myLimitedRq('get_price_data_for_items_on_sale', '&names=' + searchString.replace(/,\s*$/, ""), function (data) {
        var itemarr = data.data.items;
        sellidString = "";
        sellpriceString = "";
        for (var item in itemobj) {
            for (var item in itemarr) {
                if ((itemarr[item].market_hash_name == itemobj[item].market_hash_name) && (itemobj[item].average_price <= itemarr[item].lowest_price)) {
                    itemobj[item].average_price = ((itemarr[item].lowest_price) - 0.01);
                }
            }
        }
        for (var item in itemobj) {
            var ids = itemobj[item].item_ids
            for (id in ids) {
                sellidString = ids[id] + ',' + sellidString;
                try {
                    sellpriceString = itemobj[item].average_price.toFixed(2) + ',' + sellpriceString;
                }
                catch (e) {
                    sellpriceString = "5555.55" + ',' + sellpriceString;
                }
            }
        }
        RequestHelper.myLimitedRq('list_item_for_sale', '&item_ids=' + sellidString.replace(/,\s*$/, "") + '&prices=' + sellpriceString.replace(/,\s*$/, ""), function (data) {
            logIt('Sold items.', 'INFO');
            var tmpprices = sellpriceString.split(',');
            for (p in tmpprices) {
                moneyInSale = moneyInSale + parseFloat(tmpprices[p]);
            }
        }, function (data) {
            logIt('Error in sellem selling <br>Used func: list_item_for_sale<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
            crawlSaleTime = 600000;
        });
    }, function (data) {
        logIt('Error in sellem parsing <br>Used func: get_price_data_for_items_on_sale<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function look4Sales() {
    RequestHelper.myLimitedRq('get_my_inventory', '&page=1', function (data) {
        if (data.data.steam_inventory.fresh_or_cached == "fresh") {
            var itemarr = data.data.steam_inventory.items;
            inv_count = data.data.steam_inventory.total_items;
            for (var items in itemarr) {
                var saleObj = {};
                saleObj.item_ids = itemarr[items].item_ids;
                saleObj.market_hash_name = itemarr[items].market_hash_name;
                saleObj.average_price = itemarr[items].recent_sales_info.average_price;
                itemarr[items] = saleObj;
            }
            if (inv_count > 0) {
                sellem(itemarr);
            }
        }
    }, function (data) {
        console.log("ney");
        logIt('Error in look4Sales <br>Used func: get_my_inventory<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function look4Withdraw() {
    RequestHelper.myLimitedRq('get_buy_history', '&page=1', function (data) {
        var itemarr = data.data.items;
        var withdrawArr = [];
        for (var item in itemarr) {
            if (itemarr[item].time > startTimeUnix && itemarr[item].withdrawn == false) {
                withdrawArr.push(itemarr[item].item_id);
            }
        }
        if (withdrawArr.length > 0) {
            withdrawdeezSkins(withdrawArr);
        }
    }, function (data) {
        logIt('Error in look4Withdraw <br>Used func: get_buy_history<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function buyoneSkins(id, price, name, prct) {
    if (price > savePrice) {
        checkPriceOncsgoFast(name, function (data) {
            var sgP = data;
            var P = price;
            var percent = Math.round(100 - ((P / sgP) * 100));
            logIt('Preis auf bitskins:' + price + ' Preis auf csgofast.com: ' + sgP + ' Unterschied: ' + percent + '%  ID:' + id, 'INFO');
            if (percent >= prct) {
                logIt('Trying to buy: "' + name + '"', 'INFO');
                RequestHelper.myLimitedRq('buy_item', '&item_ids=' + id + '&prices=' + price, function (data) {
                    logIt('Item bougth with name: ' + data.data.items.market_hash_name + ' id: ' + id, 'INFO');
                    itemArrayBought.push(id);
                    itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
                    moneySpent = moneySpent + parseFloat(data.data.items.price);
                    lastBuy = 'Name: ' + data.data.items.market_hash_name + ' Für: ' + data.data.items.price + '$';
                    buys.push('<li>Name:' + data.data.items.market_hash_name + ' Für' + data.data.items.price + '$ ID:' + id + '</li>');
                }, function (data) {
                    logIt('Error in buydemSkins <br>Used func: buy_item<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
                    itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
                });
            }
        });
    }
    else {
        logIt('Trying to buy: "' + name + '"', 'INFO');
        RequestHelper.myLimitedRq('buy_item', '&item_ids=' + id + '&prices=' + price, function (data) {
            logIt('Item bougth with name: ' + data.data.items.market_hash_name + ' id: ' + id, 'INFO');
            itemArrayBought.push(id);
            itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
            moneySpent = moneySpent + parseFloat(data.data.items.price);
            lastBuy = 'Name: ' + data.data.items.market_hash_name + ' Für: ' + data.data.items.price + '$';
            buys.push('<li>Name:' + data.data.items.market_hash_name + ' Für' + data.data.items.price + '$ ID:' + id + '</li>');
        }, function (data) {
            console.log("buyoneSkins fail  name: " + name + " id: " + id);
            logIt('Error in buydemSkins <br>func:buy_item<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
            itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
        });
    }
}

function withdrawdeezSkins(ids) {
    RequestHelper.myLimitedRq('withdraw_item', '&item_ids=' + encodeURIComponent(ids.join(',')), function (data) {
        logIt('Withdrew: ' + data.data.items.market_hash_name, 'INFO');
    }, function (data) {
        logIt('Error in withdrawdeezSkins <br>Used func:' + 'withdraw_item <br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
        crawlSaleTime = 300000;
    });
}

function getBalance() {
    RequestHelper.myLimitedRq('get_account_balance', '', function (data) {
        return data.data.available_balance;
    }, function (data) {
        logIt('Error in getBalance <br>Used func:get_account_balance<br> Uri: '+data.options.uri+'<br> Error: ' + data.error, 'ERROR');
    });
}

function showmesumthing() {
    // scannedUnique += unique(scannedID).length;
    return new Array('Zeit: ' + RequestHelper.getDateTime(), 'Items ausgelesen: ' + scannedUnique, 'Geld ausgegeben: ' + moneySpent, 'Waren eingestellt für: ' + moneyInSale + '$', 'Zuletzt gekauft:' + lastBuy, 'Items im Inventar:' + inv_count, 'SearchPage: ' + searchPage);
}

function logMoney() {
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
        RequestHelper.myLimitedRq('get_account_balance', '', function (data) {
            var myMoney = parseFloat(data.data.available_balance);
            var newObj = {
                'date': RequestHelper.getDateTime()
                , 'money': myMoney
            };
            f.push(newObj);
            fs.writeFile('money.txt', JSON.stringify(f), function (err) {
                if (err) throw err;
                 logIt('Logged Current Money to File', 'INFO');
            });
        }, function (data) {
            console.log(data);
        });
    });
}


function logIt(txt, type) {
    var badgecount = 1;
    if (lastMsg == txt) {
        var lastElement = logs.pop();
        var subStr = lastElement.match('class="badge">(.*)</span>');
        badgecount = parseInt(subStr[1]) + 1;
    }
    console.log(txt);
    if (type == 'ERROR') {
        logs.push('<li class="list-group-item list-group-item-danger"><span class="badge">' + badgecount + '</span>' + RequestHelper.getDateTime() + ' - ' + txt + '</li>');
    }
    else if (type == 'INFO') {
        logs.push('<li class="list-group-item list-group-item-info"><span class="badge">' + badgecount + '</span>' + RequestHelper.getDateTime() + ' - ' + txt + '</li>');
    }
    else {
        logs.push('<li class="list-group-item list-group-item-warning"><span class="badge">' + badgecount + '</span>' + RequestHelper.getDateTime() + ' - ' + txt + '</li>');
    }
    lastMsg = txt;
    if (logs.length >= 100) {
        logs.splice(logs.lenght, 1)
    }
}

function checkPriceOncsgoFast(name, cb) {
    var options = {
        uri: 'https://api.csgofast.com/price/all'
        , headers: {
            'User-Agent': 'Request-Promise'
        }
        , json: true
    };
    rp(options).then(function (response) {
        return cb(response[name]);
    }).catch(function (err) {
        logIt('Could not get price from csgofast.com', 'ERROR');
    });
}