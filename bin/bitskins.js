const fetch = require('node-fetch');
const base32 = require('thirty-two');
var totp = require('notp').totp;
const config = require('config');
const Bottleneck = require("bottleneck");
var limiter = new Bottleneck(2, 1000);

var api_key = config.get("Bitskins.API_KEY");
var secret = config.get("Bitskins.API_SECRET");

let apiRequest = async (apiEndpoint, method, params = '') => {
    let err, data;
    try {
        let twofactorcode = totp.gen(base32.decode(secret));
        let body = await fetch('https://bitskins.com/api/v1/' + apiEndpoint + '/?api_key=' + api_key + '&code=' + twofactorcode + params, {
            method: method
        }).catch(err => this.err = err);
        if (body.status != 200) {
        data = await body.json().catch(err => this.err = err);
        err = '\x1b[31m Error: '+data.data.error_message+'\x1b[0m'; 
        console.log('https://bitskins.com/api/v1/' + apiEndpoint + '/?api_key=' + api_key + '&code=' + twofactorcode + params);
        }
        data = await body.json().catch(err => this.err = err);
        
    } catch (e) {
        console.log("Catch e:"+e);
        err = e;
    }
    return new Promise((resolve, reject) => {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
    })
}


let buySkin = (item_ids,prices,app_id) => {
    return limiter.schedule(apiRequest, 'buy_item', 'post','&auto_trade=false&app_id=' + app_id + '&item_ids=' + item_ids + '&prices=' + prices);
}

module.exports.buySkin = buySkin;