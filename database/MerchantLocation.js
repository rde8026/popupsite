/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 2/6/13
 * Time: 5:01 PM
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , connection = require('./db_conn')
    , textMappings = require('../mappings/TextMappings').message
    , geoCodeUtil = require('./util/Utils')

    , users = require('./Users')
    , images = require('./Images')
    , LocationImages = require('./LocationImages')
    , MerchantProfile = require('./MerchantsProfile');



exports.merchantLocation = connection.Connection.define('merchant_location', {
        id : { type : Sequelize.INTEGER, primaryKey:true, allowNull: false, autoIncrement: true}
        , name : {type : Sequelize.STRING, allowNull : false}
        , address : {type : Sequelize.STRING, allowNull : false}
        , address2 : {type : Sequelize.STRING, allowNull : true}
        , city : {type : Sequelize.STRING, allowNull : false}
        , state : {type : Sequelize.STRING, allowNull : false}
        , zipCode : {type : Sequelize.STRING, allowNull: false}
        , dailyRate : { type : Sequelize.FLOAT, allowNull: false, defaultValue : 0 }
        , hourlyRate : { type : Sequelize.FLOAT, allowNull: false, defaultValue : 0 }
        , latitude : { type : Sequelize.FLOAT, allowNull : true, defaultValue : 0.0 }
        , longitude : { type : Sequelize.FLOAT, allowNull : true, defaultValue : 0.0 }
    },
    {
        instanceMethods : {
            loadImages : function(done) {
                this.getImages()
                    .complete(function(err, imgs) {
                        if (err) {
                            logger.error(err, null, "loadImages");
                            return done(err, null);
                        }
                        return done(null, imgs);
                    });
            }
        }
    },
    {
        charset: 'latin1'
    }
);

exports.saveAndAttachLocation = function(user, loc, images, done) {
    var self = this;
    try {
        MerchantProfile.findMerchantProfileByUser(user, function(err, profile) {
            if (err) {
                return done(err, null);
            }
            self.merchantLocation.build(loc)
                .save()
                .complete(function(err, location) {
                    if (err) {
                        logger.error(err, null, "createMerchantLocation");
                        done(err, null);
                    } else {
                        location.setMerchantProfile(profile.profile)
                            .complete(function(err, loc) {
                                if (err) {
                                    logger.error(err, null, "attacheLocationToProfile");
                                    destroyLocation(location);
                                    return done(err, null);
                                }
                                geoCodeUtil.geoCodeMerchantLocation(location);
                                LocationImages.saveLocationImages(location, images, function(err, images) {
                                    if (err) {
                                        logger.error(err, null, "addImages");
                                    }
                                    return done(null, location);
                                });
                            });
                    }
                });
        });
    } catch (err) {
        logger.error(err, null, "saveAndAttacheLocation");
        done(err, null);
    }
};



function destroyLocation(location) {
    location.destroy()
        .complete(function(err, location) {
            if (err) {
                logger.error(err, null, "destroyLocation");
            } else {
                logger.info("destroyed location " + location.id);
            }
        });
}