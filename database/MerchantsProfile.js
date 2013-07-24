/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 2/6/13
 * Time: 3:57 PM
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , connection = require('./db_conn')
    , textMappings = require('../mappings/TextMappings').message
    , fs = require('fs')
    , aws = require('aws-sdk')
    , fileUpload = require('../routes/util/fileUpload')

    , utils = require('./util/Utils')
    , images = require('./Images')
    , users = require('./Users')
    , roles = require('./Roles');



exports.merchantProfile = connection.Connection.define('merchant_profile', {
        id : { type : Sequelize.INTEGER, primaryKey:true, allowNull: false, autoIncrement: true}
        , companyName : {type : Sequelize.STRING, allowNull : false}
        , website : { type : Sequelize.STRING, allowNull : true }
        , story : { type : Sequelize.TEXT, allowNull : false }
        , classification : { type: Sequelize.STRING, allowNull : true }
        , profileImageUrl : {type : Sequelize.STRING, allowNull : true }
    },
    {
        instanceMethods : {
            loadLocationsWithImages : function(done) {
                this.getLocations()
                    .complete(function(err, locations) {
                        if (err) {
                            return done(err, null);
                        } else {
                            if (locations != null && locations.length > 0) {
                                loadUpImages(locations, [], done);
                            } else {
                                return done(null, locations);
                            }
                        }
                    });
            }
        }
    },
    {
        charset: 'latin1'
    }
);

function loadUpImages(locs, sofar, done) {
    var loc = locs.shift();
    if (typeof loc == 'undefined') {
        return done(null, sofar);
    } else {
        loc.loadImages(function(err, imgs) {
            sofar.push({location : loc, locationImages : imgs});
            loadUpImages(locs, sofar, done);
        });
    }
}

exports.findMerchantProfileByUser = function(user, done) {
    try {
        user.getMerchantProfile()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, null, "getMerchantProfile()");
                    return done(err, null);
                }
                profile.loadLocationsWithImages(function(err, locations) {
                    if (err) {
                        logger.error(err, null, "loadLocationsWithImages");
                        return done(err, null);
                    }
                    return done(null, {profile : profile, locations : locations});
                });
                //return done(null, profile);
            });
    } catch (err) {
        logger.error(err, null, "findMerchantByUser");
        return done(err, null);
    }
};

exports.createMerchantProfile = function(user, json, done) {
    var self = this;
    try {
        this.merchantProfile.build({companyName : json.companyName, website : json.website, story : json.story, classification : json.classification})
            .save()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, null, "createMerchantProfileErr");
                    return done(err, null);
                }
                profile.setUser(user)
                    .complete(function(err, associatedProfile) {
                        if (err) {
                            logger.error(err, {profile : profile}, "addUserToMerchantProfile");
                            profile.destroy();
                            return done(err, null);
                        }
                        if (json.filePath && fileUpload.checkExtension(json.filePath)) {
                            images.uploadImage(json.filePath, "merchant_profile", function(err, url) {
                                if (err) {
                                    logger.error(err, null, "artisan_profile_db");
                                    return done(null, profile);
                                }
                                profile.profileImageUrl = url;
                                profile.save()
                                    .complete(function(err, prof) {
                                        if (err) {
                                            logger.error("error updating profile with image url", null, "updateMerchantProfileWithImage");
                                            return done(null, profile);
                                        }
                                        addMerchantRole(profile, user.id, done);
                                    });
                            });
                        } else {
                            addMerchantRole(profile, user.id, done);
                        }
                    });
            });
    } catch (err) {
        logger.error(err, null, "createMerchantProfile");
        done(err, null);
    }
};

exports.updateMerchantProfile = function(user, data, done) {
    var self = this;
    try {
        user.getMerchantProfile()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, null, "updateMerchantProfile");
                    return done(err, null);
                } else {
                    if (data.filePath && fileUpload.checkExtension(data.filePath)) {
                        images.uploadImage(data.filePath, "merchant_profile", function(err, url) {
                            if (err) {
                                logger.error(err, data, "merchantProfileImageUpload");
                                return done(err, null);
                            }
                            profile.updateAttributes({
                                companyName : data.companyName
                                , website : data.website
                                , story : data.story
                                , classification : data.classification
                                , profileImageUrl : url
                            }).complete(function(err, profile) {
                                    if (err) {
                                        logger.error(err, data, "merchantProfileUpdate");
                                        return done(err, null);
                                    }
                                    return done(null, profile);
                                });
                        });
                    } else {
                        profile.updateAttributes({
                            companyName : data.companyName
                            , website : data.website
                            , story : data.story
                            , classification : data.classification
                        }).complete(function(err, profile) {
                                if (err) {
                                    logger.error(err, data, "artisan_update_image_upload");
                                    return done(err, null);
                                }
                                return done(null, profile);
                            });
                    }
                }
            });
    } catch (err) {
        logger.error(err, null, "updateMerchantProfile");
        done(err, null);
    }
};





function addMerchantRole(profile, id, done) {
    users.addRoleToUser(id, roles.roleTypes.MERCHANT, function(err, user) {
        if (err) {
            logger.error(err, null, 'add_role_merch_to_user');
            return done(err, null);
        }
        return done(null, profile);
    });
}










