var username;
var password;
var steamID;
var steamCode;

var fs = require("fs");
var SteamCommunity = require("steamcommunity");
var readline = require("readline");

var community = new SteamCommunity();

var rl = readline.createInterface({
   input: process.stdin,
  output: process.stdout
});

rl.question("Username: ", function(name) {
    username = name;
    rl.question("Password: ", function(pass) {
        password = pass;
        rl.question("Steam ID: ", function(id) {
            steamID = id;
            rl.pause();
            login();
        });
    });
});

function login() {
    community.login({
        "accountName": username,
        "password": password,
    }, function(err, sessionId, cookies, steamguard) {
        if (err) {
            console.log(err);
            rl.resume();
            rl.question("SteamGuard code: ", function(answer) {
                steamCode = answer;
                rl.pause();
                community.login({
                    "accountName": username,
                    "password": password,
                    "authCode": steamCode
                }, function(err, sessionId, cookies, steamguard) {
                    if (err) {
                        console.log(err);
                    } else {
                        enable2fa();
                    };
                });
            });
        } else {
            enable2fa();
        };
    });
};

function enable2fa() {
    community.enableTwoFactor(function(err, resp) {
        if (err) {
            console.log(err)
        } else {
            if (resp.status != 1) {
                console.log("Failed: " + resp.status);
            } else {
                console.log(resp);
                var shared_secret = resp.shared_secret;
                fs.writeFile(username + ".2fa", JSON.stringify(resp), function(err) {
                    if (err) throw err;
                    console.log("Response saved as " + username + ".2fa");
                    rl.resume();
                    rl.question("Activation code: ", function(actCode) {
                        finalize2fa(shared_secret, code);
                        rl.close();
                    });
                }); 

            };
        };
    });
};

function finalize2fa(shared_secret, code) {
    community.finalizeTwoFactor(shared_secret, code, function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("2FA finalized successfully");
        };
    });
};