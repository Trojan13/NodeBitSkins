var express = require('express');
var router = express.Router();

var MainController = require('./controllers/MainController');
var ChartController = require('./controllers/ChartController');

//Main
router.route('/')
    .get(MainController.getInfo);

router.route('/chart')
    .get(ChartController.getSite);

router.route('/moneyeventschart')
    .get(ChartController.getSite2);

router.route('/settings')
    .get(MainController.getSettings);

router.route('/action')
    .get(MainController.getAction)
    .post(MainController.postAction);

// Finally export the router
module.exports = router;
