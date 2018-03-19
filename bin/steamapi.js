const fetch = require('node-fetch');
const config = require('config');

var api_key = config.get("Steamapi.API_KEY");


getExternalPrices = async(appid) => {
    let err,data,body;
    try {
        body = await fetch('https://api.steamapi.io/market/prices/'+appid+'?key='+api_key, {
            method: 'get'
        });
        data = await body.json();
    } catch (e) {
        err = e;
    }

    return new Promise((resolve, reject) => {
        if (err) {
            let error = {};
            error.err = err;
            error.body = body;
            reject(error)
        } else {
            resolve(data);
        }
    })
}

module.exports.getExternalPrices = getExternalPrices;