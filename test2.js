var rp = require('request-promise');
var express = require('express');
var totp = require('notp').totp;
var base32 = require('thirty-two');
var rp = require('request-promise');
var RequestHelper = require('./helper/RequestHelper.js');
var fs = require('fs');
var api_key = '';
var secret = '';
var twofactorcode = totp.gen(base32.decode(secret));

var myTime = 1000;
var crawlBuyTime = 50;
//test();

var Pusher = require('pusher');
var my_channel = undefined;
var apiKey = '';
var pusherChannelName = '';

initiatePusher();

function initiatePusher() {
    
    var pusher = Pusher.forCluster("notifier.bitskins.com", {
  appId: '',
  key: '',
  secret: 'SECRET_KEY',
  encrypted: true, // optional, defaults to false 
  port: 443, // optional, defaults to 80 for unencrypted and 443 for encrypted 
});
    
    Pusher.host = 'notifier.bitskins.com';
    Pusher.ws_port = 443;
    Pusher.wss_port = 443;
    pusher = new Pusher(apiKey, {
        encrypted: true
        , disabledTransports: ['sockjs']
        , disableStats: true
    });
    
    pusher.trigger('connected', 'test_event', { function () {
        chatChannelSubscribe = pusher.subscribe("chat-channel");
        chatChannelSubscribe.bind('chat_message', function (data) {
            processChatData(data);
        });
}
                                              });
}
function processChatData(data) {
    console.log(data);
}