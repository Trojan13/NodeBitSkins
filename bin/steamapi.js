const fetch = require('node-fetch');
const config = require('config');

var api_key = config.get("Steamapi.API_KEY");


let getExternalPrices = async(appid) => {
    let err,data,body;
    try {
        body = await fetch('http://api.steamapis.com/market/items/'+appid+'?api_key='+api_key, {
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
            let tmpData = {};
            Object.keys(data.data).forEach(function(k) {
                tmpData[data.data[k].market_hash_name] = data.data[k];
              });
            resolve(tmpData);
        }
    })
}

module.exports.getExternalPrices = getExternalPrices;