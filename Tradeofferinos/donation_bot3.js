
var SteamCommunity = require('steamcommunity');
var SteamTotp = require('steam-totp');
var TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
var fs = require('fs');
var profileArray = require('profile-array');
var retryTime = 5000;
var steam = new SteamCommunity();
var manager = new TradeOfferManager({
    "domain": "example.com", // Our domain is example.com
    "language": "en", // We want English item descriptions
    "pollInterval": 5000 // We want to poll every 5 seconds since we don't have Steam notifying us of offers
});
// Steam logon options
var twoFaCode = SteamTotp.getAuthCode("");
console.log(twoFaCode);
var logOnOptions = {
    "accountName": ""
    , "password": ""
    , "twoFactorCode": twoFaCode
};
if (fs.existsSync('steamguard.txt')) {
    logOnOptions.steamguard = fs.readFileSync('steamguard.txt').toString('utf8');
}
if (fs.existsSync('polldata.json')) {
    manager.pollData = JSON.parse(fs.readFileSync('polldata.json'));
}
steam.login(logOnOptions, function (err, sessionID, cookies, steamguard) {
    if (err) {
        console.log("Steam login fail: " + err.message);
        process.exit(1);
    }
    fs.writeFile('steamguard.txt', steamguard);
    console.log("Logged into Steam");
    manager.setCookies(cookies, function (err) {
        if (err) {
            console.log(err);
            process.exit(1); // Fatal error since we couldn't get our API key
            return;
        }
        console.log("Got API key: " + manager.apiKey);
    });
    steam.startConfirmationChecker(30000, "opOZA2p3f5UkLlaxffhLcnbC27I="); // Checks and accepts confirmations every 30 seconds
});
manager.on('newOffer', function (offer) {
    console.log("New offer #" + offer.id + " from " + offer.partner.toString());
        console.log('Steam64ID found in Array. Accepting trade.');
        offer.accept(function (err) {
            if (err) {
                console.log("Unable to accept offer: " + err.message);
                //reconnect if 403
                if (err.message.indexOf('403') > 0) {
                    Login();
                }
                console.log("Cause: " + err.eresult);
                if (err.eresult == 28) {
                    retryOffer(offer.id);
                }
            }
            else {
                steam.checkConfirmations();
                console.log("Offer accepted");
            }
        });
    
});

function retryOffer(id) {
    manager.getOffer(id, function (err, offer) {
        if (err) {
            console.log("Unable to get offer: " + err.message);
            console.log("Retrying to get.");
            setTimeout(function () {
                retryOffer(id);
            }, retryTime);
        }
        else {
            offer.accept(function (err) {
                if (err) {
                    console.log("Unable to accept offer: " + err.message);
                    if (err.eresult == 28) {
                        console.log("Retrying to accept.");
                        retryOffer(offer.id);
                    }
                }
                else {
                    steam.checkConfirmations();
                    console.log("Offer accepted");
                }
            });
        }
    });
}
manager.on('receivedOfferChanged', function (offer, oldState) {
    console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);
    if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
        offer.getReceivedItems(function (err, items) {
            if (err) {
                console.log("Couldn't get received items: " + err);
            }
            else {
                var names = items.map(function (item) {
                    return item.name;
                });
                console.log("Received: " + names.join(', '));
            }
        });
    }
});
manager.on('pollData', function (pollData) {
    fs.writeFile('polldata.json', JSON.stringify(pollData));
});

function Login() {
   process.exit();
}