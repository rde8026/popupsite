/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/15/13
 * Time: 10:58 PM
 * To change this template use File | Settings | File Templates.
 */


var winston = require('winston');
    //, config = require('../config/config').env();

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console({
            //handleExceptions: true,
            //json: true
        })
        /*, new winston.transports.File({
            level: 'error'
            , filename : 'error.log'
        })*/
    ]
    //exitOnError: false
});


exports.info = function(msg, metadata, clazz) {
    var msg = (clazz) ? clazz + ":" + msg : msg;
    if (typeof msg  === "object") {
        msg = clazz + ":Empty Message" ;
        metadata = msg;
    }
    logger.info(msg, {metadata : metadata});
};

exports.error = function(msg, metadata, clazz) {
    var msg = (clazz) ? clazz + ":" + msg : msg;
    logger.error(msg, {metadata : metadata});
};

exports.debug = function(msg, metadata, clazz) {
    var msg = (clazz) ? clazz + ":" + msg : msg;
    if (typeof msg  === "object") {
        msg = clazz + ":Empty Message" ;
        metadata = msg;
    }
    logger.debug(msg, {metadata : metadata});
};

exports.warn = function(msg, metadata, clazz) {
    var msg = (clazz) ? clazz + ":" + msg : msg;
    logger.warn(msg, {metadata : metadata});
};

/*
exports.youDecide = function(msg, metadata, clazz) {
    var msg = (clazz) ? clazz + ":" + msg : msg;
    switch (config.logLevel) {
        case "debug":
            logger.debug(msg, {metadata : metadata});
    }
};*/
