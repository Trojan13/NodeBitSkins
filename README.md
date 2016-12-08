# NodeBitSkins

[![N|Solid](http://i.imgur.com/hSL76di.png)](https://www.reddit.com/r/SteamBotMarket/)

This made this project because I saw the beautiful documented API at BitSkins.com and wanted to see whats possible.
I started like 1 year ago and over the years it grew to a nice little project. The problem with a working style like this is, that the code is going to be a hell of a mess. And it is. So I decided to release it to see if others could improve the code and make some profit out of it aswell.

The code as it is is not ready to be launched. There are a few steps which you have to complete before running it.
But first I will try to explain the folder structure and the use of some files in this project.

## What the hell is the purpose of this file?
Okay. I know it is a bit messy. But once you know the general structure it is easy. In the following table I will describe the most important files for you. 

| File | Location  | Purpose |
|---|---|---|
| test.js | root  | in this file I tested how to format the data to work with chart.js |
| test2.js | root  | I played around with the pusher used by bitskins to get new deals |
| server.js | root | Express APP. You have to start this to run the bot |
| router.js | root | Express APP. Set the routes for the express app |
| polldata.json | root | ehrm. I do not remember |
| money.txt | root | money data | JS to get new notifications |
| main_bot.js | root | this is an old file. You can run this as standalone. |
| GetBitSkinsBots.au3 | root | AutoIt Script to scrape all BitSkinBots |
| FilterDupes.au3 | root | AutoIt Script to Format the BitSkinBots in Clipboard |
| bitskinsfuncs.js | root | Some bitskins functions out of their js |
| myJS.js | root/public/js | JS to get new notifications |
| RequestHelper.js | root/helper | some helper functions like the throtled request |
| ChartController.js | root/controllers | Functions for the chart page |
| MainController.js | root/controllers | Other functions |

Okay. The folders are like every express app you know. "views" contains the .ejs files that are going to be rendered as HTML.  "public" contains the used css,js and fonts like bootstrap.  "helper" contains some helper functions and "controllers" the controllers which are called and reffered to by the router.

Tradeofferinos contains the steambot.

"donation_bot2.js" is there to set up the totp. I got it from someone in reddit but do not remember where (if someone knows pls credit him).

"donation_bot3.js" is a simple storage bot. Right now it accepts EVERY Trade. Usually it checks if the steamid is in the "profile-array" which contains all of the bitskinsbot ids.



## How to run

Unfortunately I messed up my package.json. The easiest thing to do to get all the needed packages is to go trough all files and install the packages by hand. (hehe I just realised that this will keep most of the leeches from using it)

If you installed all packages with "--save" please commit this so I can update it with a proper package.json ;)
Now you have to set up the donation_bot3.js and get it running. You need the sentry file.

As a final step you habe to go through all files and insert your bitskins API-Key and your secret. If you are done. You can run server.js and open up the ip and port which are defined in server.js in your browser. Default is 127.0.0.1:8080.

## Some useful informations to edit this
The "magic" happens in MainController.js. Timers are set which call the functions "look4skins", "look4skins2", "look4Withdraw", "look4Sales" and "logMoney".

#### look4Skins
This functions gets page one of the items on bitskins ordered by descending date -> the newest. Then it looks for their prices and if they are in the specified range it calls "buyoneSkins" to buy them.


#### look4Skins2
Is the same only that it searches for knives only.

#### look4Withdraw
Looks through your recently bought items and tries to withdraw them.

#### look4Sales
Get your steaminventory and tries to sell the items.
  


##To do:
You can update this list or use issues but I will start here and write down all the things which have to be done to make this better:

* Clean this mess up
* Add package.json
* export the apikey and apisecret in a file and add it to gitignore
* fix the tradebot to only accept trade by bitskinbots
* write a detailed description for every file (inside the file)
