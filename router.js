// In here you set which route will call which function in a controller
var express = require('express');
var router = express.Router();

var MainController = require('./controllers/MainController');
var ChartController = require('./controllers/ChartController');

//Main Page
router.route('/')
    .get(MainController.getInfo);

//Chart page
router.route('/chart')
    .get(ChartController.getSite);

//Event Chart Page
router.route('/moneyeventschart')
    .get(ChartController.getSite2);

//Settings Page (WIP)
router.route('/settings')
    .get(MainController.getSettings);

//controller to do something
router.route('/action')
    .get(MainController.getAction)
    .post(MainController.postAction);

// Finally export the router
module.exports = router;
