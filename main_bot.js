/*
This is a standalone bot which runs by itself and include a express server
just set the api_key and secret and run it with node. 
*/
var express = require('express');
var totp = require('notp').totp;
var base32 = require('thirty-two');
var rp = require('request-promise');
var fs = require('fs');
var app = express();
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(5, 'second');
var unique = require('array-unique');
var moneySpent = 0.0
    , moneyInSale = 0.0;
var startTime = getDateTime()
    , startTimeUnix = Math.round(+new Date() / 1000);
var server_port = 3123;
var server_ip_address = '192.168.178.37';
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
    , crawlWithdrawTime = 120000;
var inv_count = 0;
var tmpFirstItem, tmpLastItem, searchPage = 1
    , searchPage2 = 1
    , tmpFirstItem2, tmpLastItem2;
var savePrice = 1;
/* 
TODO:
Fix withdraw timings?
buyoneskins spamms less?
item id sell wrong

crawl all items
check new items on update
update all item prices -.01€

*/
var api_key = '';
var secret = '';
var twofactorcode = totp.gen(base32.decode(secret));
app.get('/', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send("<html><head><script src='https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'></script><link rel='stylesheet' href='http://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'><script src='http://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'></script><script>$('.logdiv').scrollTop($('.logdiv li:last-child').position().top);</script><style>ul{height:300px; width:100%;}ul{overflow:hidden; overflow-y:scroll; }ul.info{ background-color: #ccffff; }ul.error{ background-color: #ffc2b3; }}</style></head><body><div style='text-align: center'><h1>Log:</h1><div class='list-group center-block'><ul class='logdiv'>" + logs.join(' ') + "</ul></div><br><h1>Infos:</h1><p>" + showmesumthing() + "</p><div class='btn-group btn-group-justified'><a href='/getCode'  onclick='location.reload(true); return false;' class='btn btn-primary'>Get 2FA-Code</a><a href='/test' class='btn btn-primary'>Test</a><a href='/test2' class='btn btn-primary'>Test</a></div><h1>Käufe:</h1><ul>" + buys.join("<br>") + "</ul></div></body></html>");
});
app.get('/getCode', function (req, res) {
     logIt('Generated new code: ' + totp.gen(base32.decode(secret)), 'INFO');
    res.end();
});


app.listen(server_port, server_ip_address, function () {
    logIt('Started! With code: ' + twofactorcode, 'INFO');

});

(function repeat() {
    look4Skins();
    look4Skins2();
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

function look4Skins() {
    myLimitedRq('get_inventory_on_sale', '&page=' + searchPage + '&sort_by=created_at&order=desc', function (data) {
        var itemarr = data.data.items;
        for (var item in itemarr) {
            scannedID.push(itemarr[item].item_id);
            scannedUnique++;
            var sgP = itemarr[item].suggested_price;
            var P = itemarr[item].price
            var percent = Math.round(100 - ((P / sgP) * 100));
            if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 0.50)) {
                if (percent >= 55.0) {
                    logIt('look4Skins found item with 55% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                    itemArrayTryingToBuy.push(itemarr[item].item_id);
                    buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 0.10)) {
                if (percent >= 65.0) {
                    logIt('look4Skins found item with 65% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                    itemArrayTryingToBuy.push(itemarr[item].item_id);
                    buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr[item].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr[item].item_id) < 0) && (sgP >= 2) && (sgP <= 80)) {
                if (percent >= 40.0) {
                    logIt('look4Skins found item with 40% or greater:' + itemarr[item].market_hash_name + ' - ' + itemarr[item].id, 'INFO');
                    itemArrayTryingToBuy.push(itemarr[item].item_id);
                    buyoneSkins(itemarr[item].item_id, itemarr[item].price, itemarr[item].market_hash_name);
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
        logIt('Error in look4skins <br>Used func: get_inventory_on_sale<br> params: &page=' + searchPage + '&sort_by=created_at&order=desc<br> Errormsg: ' + data, 'ERROR');
    });
}

function look4Skins2() {
    myLimitedRq('get_inventory_on_sale', '&page=' + searchPage2 + '&item_type=Knife&max_price=20&sort_by=created_at&order=desc', function (data) {
        var itemarr2 = data.data.items;
        for (var item2 in itemarr2) {
            scannedID.push(itemarr2[item2].item_id);
            var sgP2 = itemarr2[item2].suggested_price;
            var P2 = itemarr2[item2].price
            var percent2 = Math.round(100 - ((P2 / sgP2) * 100));
            if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 0.50)) {
                if (percent2 >= 55.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 0.10)) {
                if (percent2 >= 65.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name);
                }
            }
            else if ((itemArrayBought.indexOf(itemarr2[item2].item_id) < 0) && (itemArrayTryingToBuy.indexOf(itemarr2[item2].item_id) < 0) && (sgP2 >= 2) && (sgP2 <= 80)) {
                if (percent2 >= 50.0) {
                    itemArrayTryingToBuy.push(itemarr2[item2].item_id);
                    buyoneSkins(itemarr2[item2].item_id, itemarr2[item2].price, itemarr2[item2].market_hash_name);
                }
            }
        }
        searchPage2 = 1;
    }, function (data) {
        logIt('Error in look4skins2 <br>Used func: get_inventory_on_sale<br> params: &page=' + searchPage + '&sort_by=created_at&order=desc<br> Errormsg: ' + data, 'ERROR');
    });
}

function sellem(itemobj) {
    var searchString = '';
    for (var item in itemobj) {
        searchString = encodeURIComponent(itemobj[item].market_hash_name) + ',' + searchString;
    }
    myLimitedRq('get_price_data_for_items_on_sale', '&names=' + searchString.replace(/,\s*$/, ""), function (data) {
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
        myLimitedRq('list_item_for_sale', '&item_ids=' + sellidString.replace(/,\s*$/, "") + '&prices=' + sellpriceString.replace(/,\s*$/, ""), function (data) {
            logIt('Sold items.', 'INFO');
            var tmpprices = sellpriceString.split(',');
            for (p in tmpprices) {
                moneyInSale = moneyInSale + parseFloat(tmpprices[p]);
            }
        }, function (data) {
            logIt('Error in sellem selling <br>Used func: list_item_for_sale<br> params: &item_ids=' + sellidString.replace(/,\s*$/, "") + '&prices=' + sellpriceString.replace(/,\s*$/, "") + '<br> Errormsg: ' + data, 'ERROR');
            crawlSaleTime = 600000;
        });
    }, function (data) {
        logIt('Error in sellem parsing <br>Used func: get_price_data_for_items_on_sale<br> params: &names=' + searchString.replace(/,\s*$/, "") + '<br> Errormsg: ' + data, 'ERROR');
    });
}

function look4Sales() {
    myLimitedRq('get_my_inventory', '&page=1', function (data) {
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
        logIt('Error in look4Sales <br>Used func: get_my_inventory<br> params: &page=1<br> Errormsg: ' + data, 'ERROR');
    });
}

function look4Withdraw() {
    myLimitedRq('get_buy_history', '&page=1', function (data) {
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
        logIt('Error in look4Withdraw <br>Used func: get_buy_history<br> params: &page=1<br> Errormsg: ' + data, 'ERROR');
    });
}

function buyoneSkins(id, price, name) {
    if (price > savePrice) {
        checkPriceOncsgoFast(name, function (data) {
            var sgP = data;
            var P = price;
            var percent = Math.round(100 - ((P / sgP) * 100));
            logIt('Preis auf bitskins:' + price + ' Preis auf csgofast.com: ' + sgP + ' Unterschied: ' + percent + '%  ID:' + id, 'INFO');
            if (percent >= 65.0) {
                logIt('Trying to buy' + name, 'INFO');
                myLimitedRq('buy_item', '&item_ids=' + id + '&prices=' + price, function (data) {
                    logIt('Item bougth with name: ' + name + ' id: ' + id, 'INFO');
                    itemArrayBought.push(id);
                    itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
                    moneySpent = moneySpent + parseFloat(data.data.items.price);
                    lastBuy = 'Name: ' + data.data.items.market_hash_name + ' Für: ' + data.data.items.price + '$';
                    buys.push('<li>Name:' + data.data.items.market_hash_name + ' Für' + data.data.items.price + '$ ID:' + id + '</li>');
                }, function (data) {
                    logIt('Error in buydemSkins <br>Used func: buy_item<br>params: &item_ids=' + id + '&prices=' + price + '<br> Errormsg: ' + data, 'ERROR');
                    itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
                });
            }
        });
    }
    else {
        logIt('Trying to buy' + name, 'INFO');
        myLimitedRq('buy_item', '&item_ids=' + id + '&prices=' + price, function (data) {
            logIt('Item bougth with name: ' + name + ' id: ' + id, 'INFO');
            itemArrayBought.push(id);
            itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
            moneySpent = moneySpent + parseFloat(price);
            lastBuy = 'Name: ' + name + ' Für: ' + price + '$';
            buys.push('<li>Name:' + name + ' Für' + price + '$ ID:' + id + '</li>');
        }, function (data) {
            console.log("buyoneSkins fail  name: " + name + " id: " + id);
            logIt('Error in buydemSkins <br>func:buy_item<br>params:   &item_ids=' + id + '&prices=' + price + '<br> Errormsg: ' + data, 'ERROR');
            itemArrayTryingToBuy.splice(itemArrayTryingToBuy.indexOf(id), 1);
        });
    }
}

function withdrawdeezSkins(ids) {
    myLimitedRq('withdraw_item', '&item_ids=' + encodeURIComponent(ids.join(',')), function (data) {
        logIt('Withdrew: ' + data.data.items.market_hash_name, 'INFO');
    }, function (data) {
        logIt('Error in withdrawdeezSkins <br>Used func:' + 'withdraw_item <br>params: &item_ids=' + encodeURIComponent(ids.join(',')) + '<br> Errormsg: ' + data, 'ERROR');
        crawlSaleTime = 300000;
    });
}

function getBalance() {
    myLimitedRq('get_account_balance', '', function (data) {
        return data.data.available_balance;
    }, function (data) {
        logIt('Error in getBalance <br>Used func:get_account_balance<br> Errormsg: ' + data, 'ERROR');
    });
}

function showmesumthing() {
    // scannedUnique += unique(scannedID).length;
    return 'Zeit: ' + getDateTime() + '<br>Items ausgelesen: ' + scannedUnique + '<br>Geld ausgegeben: ' + moneySpent + '<br>Waren eingestellt für: ' + moneyInSale + '$<br>Zuletzt gekauft:' + lastBuy + '<br>Items im Inventar:' + inv_count + '<br>SearchPage: ' + searchPage;
}

function logIt(txt, type) {
    var badgecount = 1;
    if (lastMsg == txt) {
        var lastElement = logs.pop();
        var subStr = lastElement.match('class="badge">(.*)</span>');
        console.log(lastElement);
        console.log(subStr[1]);
        badgecount = parseInt(subStr[1]) + 1;
    }
    console.log(txt);
    if (type == 'ERROR') {
        logs.push('<li class="list-group-item list-group-item-danger"><span class="badge">' + badgecount + '</span>' + getDateTime() + ' - ' + txt + '</li>');
    }
    else if (type == 'INFO') {
        logs.push('<li class="list-group-item list-group-item-info"><span class="badge">' + badgecount + '</span>' + getDateTime() + ' - ' + txt + '</li>');
    }
    else {
        logs.push('<li class="list-group-item list-group-item-warning"><span class="badge">' + badgecount + '</span>' + getDateTime() + ' - ' + txt + '</li>');
    }
    

    lastMsg = txt;
        if (logs.length >= 100) {
        logs.splice(logs.lenght,1)
    }
}

function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return day + "." + month + "." + year + "   " + hour + ":" + min + ":" + sec;
}

function get2factorCode() {
    return totp.gen(base32.decode(secret));
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

function myLimitedRq(u, a, cb1, cb2) {
    /*
u = bitskins.com api function
a = additional req params
cb1 = then
cb2 = catch
*/
    var uri = 'https://bitskins.com/api/v1/' + u + '/?api_key=' + api_key + '&code=' + get2factorCode() + a;
    limiter.removeTokens(1, function () {
        var options = {
            uri: uri
            , headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
                    //,'Content-Length': uri.length
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