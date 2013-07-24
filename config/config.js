/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/16/13
 * Time: 9:56 AM
 * To change this template use File | Settings | File Templates.
 */

var c = require('./config.json')
    , logger = require('../logger/Logger');

var config;

exports.env = function() {
    if (!config) {
        switch (process.env.NODE_ENV) {
            case 'unit_test' :
                logger.debug("** UNIT TEST MODE **", "config.js");
                config = c.unit_test;
                return config;
            case 'development':
                logger.debug("** DEV Env set ***", "config.js");
                config = c.development
                return config;
            case 'test' :
                logger.debug("** TEST Env set ***", "config.js");
                config = c.test
                return config;
            case 'production':
                logger.info("** PROD Env set ***", "config.js");
                config = c.production;
                return config;
            default :
                logger.warn("**** NO NODE ENV SET: Defaulting to DEV ****", "config.js");
                config = c.development;
                return config;
        }
    } else {
        return config;
    }
};