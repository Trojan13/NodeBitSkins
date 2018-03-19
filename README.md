
# NodeBitSkins

[![N|Solid](http://i.imgur.com/hSL76di.png)](https://www.reddit.com/r/SteamBotMarket/)

I removed all old stuff and made it work with the websocket API.
But first I will try to explain the folder structure and the use of some files in this project.

## What the hell is the purpose of this file?
Okay. I know it is a bit messy. But once you know the general structure it is easy. In the following table I will describe the most important files. 

| File | Location  | Purpose |
|---|---|---|
| index.js | root  | Main File. Run this. |



## How to run


 1. First `npm install` in the folder
 2. Rename the file `default.sample.json` to `default.json`
 3. Insert your API-Keys into the `default.json`
 4. Check and edit the prices in the `index.js` starting at line 32
 5. `node ./index.js`
 6. ?????
 7. Profit
  

## To do:
You can update this list or use issues but I will start here and write down all the things which have to be done to make this better:

* Exclude the websocket logic to the `./bin` Folder
* Improve buying decision making
* Add package.json
* Support another pricing API
* Add a steam tradebot
