rp = require('request-promise');
var base32 = require('thirty-two');
var totp = require('notp').totp;
var RateLimiter = require('limiter').RateLimiter;
var limiter = new RateLimiter(5, 'second');
var api_key = '';
var secret = '';
var twofactorcode = totp.gen(base32.decode(secret));
var apiAccess;
var bitSkins2FaCode;
module.exports = {
    get2factorCode: function () {
        return totp.gen(base32.decode(secret));
    }
    , myLimitedRq: function (u, a, cb1, cb2) {
        /*
u = bitskins.com api function
a = additional req params
cb1 = then
cb2 = catch
*/
        if (!apiAccess) {
            //console.log("Generated new Code!");
            bitSkins2FaCode = this.get2factorCode();
            //apiAccess = true;
        }
        var uri = 'https://bitskins.com/api/v1/' + u + '/?api_key=' + api_key + '&code=' + bitSkins2FaCode + a;
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
                console.log(err.error.data.error_message);
                console.log(66666);
                if (err.error.data.error_message.match('API access enabled') != null) {
                    apiAccess = false;
                }
                return cb2({
                    error: err
                    , options: options
                });
            });
        });
    }
    , getDateTime: function () {
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
        return day + " " + month + " " + year + "   " + hour + ":" + min + ":" + sec;
    }
    , timeConverter: function (UNIX_timestamp) {
        var a = new Date(UNIX_timestamp * 1000);
        var year = a.getFullYear();
        var month = a.getMonth();
        var date = a.getDate();
        var hour = a.getHours();
        var min = a.getMinutes();
        var sec = a.getSeconds();
        var time = date + '.' + month + ' ' + hour + ':' + min;
        return time;
    }
};