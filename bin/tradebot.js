const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');
const SteamTotp = require('steam-totp');
const config = require('config');
const TradeOfferManager = require('steam-tradeoffer-manager'); // use require('steam-tradeoffer-manager') in production
const FS = require('fs');
const cfg = config.get("Steam");

let init = async (bitAPI) => {
    let client = new SteamUser();
    let manager = new TradeOfferManager({
        "steam": client, // Polling every 30 seconds is fine since we get notifications from Steam
        "domain": "example.com", // Our domain is example.com
        "language": "en" // We want English item descriptions
    });
    let community = new SteamCommunity();

    // Steam logon options
    let logOnOptions = {
        "accountName": cfg.accountName,
        "password": cfg.accountPassword,
        "twoFactorCode": SteamTotp.getAuthCode(cfg.authCode)
    };

    if (FS.existsSync('polldata.json')) {
        manager.pollData = JSON.parse(FS.readFileSync('polldata.json').toString('utf8'));
    }

    client.logOn(logOnOptions);

    client.on('loggedOn', function () {
        console.log("Logged into Steam");
    });

    client.on('webSession', function (sessionID, cookies) {
        manager.setCookies(cookies, function (err) {
            if (err) {
                console.log(err);
                process.exit(1); // Fatal error since we couldn't get our API key
                return;
            }

            console.log("Got API key: " + manager.apiKey);
        });

        community.setCookies(cookies);
    });

    manager.on('newOffer', async function (offer) {
        console.log("New offer #" + offer.id + " from " + offer.partner.getSteam3RenderedID());
        let bitskinsOffers = await bitAPI.getActiveTradeOffers();
        bitskinsOffers = bitskinsOffers.data.offers;

        for (i in bitskinsOffers) {
            if (offer.message == bitskinsOffers[i].trade_message) {
                offer.isValid = true;
                console.log("Offer #" + offer.id + "is valid. Code: " + offer.message);
            }
        }
        if ((offer.isValid) || (offer.itemsToGive.length < 1 && offer.itemsToReceive.length > 0)) {
            offer.accept(function (err, status) {
                if (err) {
                    console.log("Unable to accept offer: " + err.message);
                } else {
                    console.log("Offer accepted: " + status);
                    if (status == "pending") {
                        community.acceptConfirmationForObject(cfg.identitySecret, offer.id, function (err) {
                            if (err) {
                                console.log("Can't confirm trade offer: " + err.message);
                            } else {
                                console.log("Trade offer " + offer.id + " confirmed");
                            }
                        });
                    }
                }
            });
        }
    });

    manager.on('receivedOfferChanged', function (offer, oldState) {
        console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);

        if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
            offer.getExchangeDetails((err, status, tradeInitTime, receivedItems, sentItems) => {
                if (err) {
                    console.log(`Error ${err}`);
                    return;
                }

                // Create arrays of just the new assetids using Array.prototype.map and arrow functions
                let newReceivedItems = receivedItems.map(item => item.new_assetid);
                let newSentItems = sentItems.map(item => item.new_assetid);

                console.log(`Received items ${newReceivedItems.join(',')} Sent Items ${newSentItems.join(',')} - status ${TradeOfferManager.ETradeStatus[status]}`)
            })
        }
    });

    manager.on('pollData', function (pollData) {
        FS.writeFileSync('polldata.json', JSON.stringify(pollData));
    });
}

module.exports.init = init;