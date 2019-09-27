'use strict'
const bitApi = require('./bin/bitskins');
const steamapi = require('./bin/steamapi');
const tradebot = require('./bin/tradebot');

const cron = require('node-cron');
const config = require('config');
const Pusher = require('pusher-client');

const minPrice = config.get("Prices.MIN_PRICE");
const maxPrice = config.get("Prices.MAX_PRICE");
const min_discount = config.get("Prices.MIN_DISCOUNT");

const crawlExtPriceTime = 30000
	, crawlSaleTime = 120000
	, crawlWithdrawTime = 120000
	, logMoneyTime = 3600000
	, app_ids = [570, 730, 578080, 440, 252490, 218620, 232090];


var skinObj = {}
	, extPrices = {}, pusher = undefined
	, pusherOnline = false
	, skinCounter = 0
	, saleChannelSubscribe = undefined;



let processSaleData = (skin) => {
	try {
		skinCounter++;
		var extPrice = extPrices[skin.app_id][skin.market_hash_name];
		var intPrice = skin.price;
		var percent = Math.round(100 - ((intPrice / extPrice) * 100));
		skin.state = "idle";
		skinObj[skin.item_id] = skin;
		if (((extPrice >= 0.06) && (extPrice <= 0.10)) && (percent >= 85.0)) {
			skinObj[skin.item_id].state = "buying";
			bitApi.buySkin(skin.item_id, intPrice, skin.app_id);
		}
		else if ((extPrice >= 0.11) && (extPrice <= 4.99) && (percent >= 70.0)) {
			skinObj[skin.item_id].state = "buying";
			bitApi.buySkin(skin.item_id, intPrice, skin.app_id);
		}
		else if ((extPrice >= 5) && (extPrice <= 80) && (percent >= 55.0)) {
			skinObj[skin.item_id].state = "buying";
			bitApi.buySkin(skin.item_id, intPrice, skin.app_id);
		}
		else if ((extPrice >= 81) && (percent >= 50.0)) {
			skinObj[skin.item_id].state = "buying";
			bitApi.buySkin(skin.item_id, intPrice, skin.app_id);
		} else if (percent >= 98.0) {
			skinObj[skin.item_id].state = "buying";
			bitApi.buySkin(skin.item_id, intPrice, skin.app_id);
		} else {
			delete skinObj[skin.item_id];
		}
	} catch (e) {
		console.error("Couldn't find item: "+ skin.market_hash_name);
	}
}

let initiatePusher = () => {
	let socket = new Pusher('c0eef4118084f8164bec65e6253bf195', {
		host: "notifier.bitskins.com"
		, ws_port: 443
		, wss_port: 443
		, encrypted: true
		, disabledTransports: ['sockjs']
		, disableStats: true
	});
	socket.connection.bind('connected', function () {
		console.log("Pusher connected!")
		pusherOnline = true;
		subscribeToSaleChannel(socket);
	});
	socket.connection.bind('disconnected', function () {
		console.log("Pusher disconnected!")
		pusherOnline = false;
	});
}

let subscribeToSaleChannel = (socket) => {
	if (pusherOnline && saleChannelSubscribe === undefined) {
		saleChannelSubscribe = socket.subscribe('inventory_changes');
		saleChannelSubscribe.bind('listed', function (data) {
			processSaleData(data);
		});
		console.log("Subbed to new item channel");
		saleChannelSubscribe.bind('price_changed', function (data) {
			processSaleData(data);
		});
		console.log("Subbed to price change channel");
	}
	else if (saleChannelSubscribe === undefined) {
		console.log("Sale notices are offline");
	}
	else if (saleChannelSubscribe !== undefined) {
		console.log("Already subscribed to sale channel");
	}
}


let createPriceObj = async () => {
	for (let i in app_ids) {
		extPrices[app_ids[i]] = await steamapi.getExternalPrices(app_ids[i]);
	}
}

let printInfo = () => {
	console.log(skinObj);
	console.log(skinCounter);
}

(async () => {
	try {
		tradebot.init(bitApi);
		await createPriceObj();
		initiatePusher();
	} catch (err) {
		console.log(err);
	}
})();

cron.schedule('*/1 * * * *', async () => {
	try {
		printInfo();
	} catch (err) {
		console.log(err);
	}
});

cron.schedule('0 */2 * * *', async () => {
	try {
		await createPriceObj();
	} catch (err) {
		console.log(err);
	}
});