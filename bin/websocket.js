const Pusher = require('pusher-client');

var saleChannelSubscribe = undefined;
let pusherOnline;

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
		return socket;
	});
	socket.connection.bind('disconnected', function () {
		console.log("Pusher disconnected!")
		pusherOnline = false;
	});
}

let subscribeToSaleChannel = (socket) => {
	if (pusherOnline && saleChannelSubscribe === undefined) {
		saleChannelSubscribe = socket.subscribe('inventory_changes');
		return saleChannelSubscribe;
	}
	else if (saleChannelSubscribe === undefined) {
		console.log("Sale notices are offline");
	}
	else if (saleChannelSubscribe !== undefined) {
		console.log("Already subscribed to sale channel");
	}
}

module.exports.initiatePusher = initiatePusher;
module.exports.subscribeToSaleChannel = subscribeToSaleChannel;