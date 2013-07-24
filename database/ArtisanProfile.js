/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/24/13
 * Time: 8:41 PM
 * To change this template use File | Settings | File Templates.
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , connection = require('./db_conn')
    , textMappings = require('../mappings/TextMappings').message

    , fs = require('fs')
    , aws = require('aws-sdk')
    , utils = require('./util/Utils')

    , roles = require('./Roles')
    , users = require('./Users')
    , images = require('./Images')
    ;

exports.artisanProfile = connection.Connection.define('artisan_profile', {
        id : { type : Sequelize.INTEGER, primaryKey:true, allowNull: false, autoIncrement: true}
        , companyName : {type : Sequelize.STRING, allowNull : false }
        , location : { type : Sequelize.STRING, allowNull : true }
        , latitude : { type : Sequelize.FLOAT, defaultValue : 0 }
        , longitude : { type :Sequelize.FLOAT, defaultValue : 0 }
        , website : { type : Sequelize.STRING, allowNull : true }
        , story : { type : Sequelize.TEXT, allowNull : false }
        , classification : { type: Sequelize.STRING, allowNull : true }
        , profileImageUrl : {type : Sequelize.STRING, allowNull : true }
        , stripeCustomerId : { type : Sequelize.STRING, allowNull : true}
    },
    {
        charset: 'latin1'
    }
);


exports.createArtisanProfile = function(user, json, done) {
    try {
        var self = this;
        self.artisanProfile.build({companyName : json.companyName, website : json.website, location : json.location, story : json.story, classification : json.classification})
            .save()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, null, "artisan_profile_db");
                    return done(err, null);
                }
                profile.setUser(user)
                    .success(function(p) {
                        if (json.filePath && checkExtension(json.filePath)) {
                            images.uploadImage(json.filePath, "artisan_profile", function(err, url) {
                                if (err) {
                                    logger.error(err, null, "artisan_profile_db");
                                    return done(null, profile);
                                }
                                profile.profileImageUrl = url;
                                profile.save()
                                    .complete(function(err, prof) {
                                        if (err) {
                                            logger.error("error updating profile with image url", null, "artisan_profile_db");
                                            return done(null, profile);
                                        }
                                        addArtisanRoleToUser(profile, user.id, done);
                                        geoCodeAddress(profile);
                                    });
                            });
                        } else {
                            addArtisanRoleToUser(profile, user.id, done);
                            geoCodeAddress(profile);
                        }
                    })
                    .error(function(err) {
                        logger.error(err, null, "artisan_profile_db");
                        return done(err, null);
                    })
            });
    } catch (err) {
        logger.error(err, json, "artisan_profile_db");
        return done(new error.ApiError(textMappings.GENERAL_ARTISAN_PROFILE_CREATION_ERROR, "artisan_profile_db"), null);
    }

};

function addArtisanRoleToUser(profile, id, done) {
    users.addRoleToUser(id, roles.roleTypes.ARTISAN, function(err, user) {
        if (err) {
            logger.error(err, null, "adding_role_to_user");
            return done(err, null);
        }
        done(null, profile);
    });
}

function geoCodeAddress(profile) {
    if (profile.location) {
        utils.geoCodeArtisanProfile(profile.location, profile);
    }
}

exports.updateArtisanProfile = function(user, data, done) {
    try {
        user.getArtisanProfile()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, data, "artisan_profile_update_db");
                    return done(err, null);
                } else {
                    if (data.filePath && checkExtension(data.filePath)) {
                        images.uploadImage(data.filePath, "artisan_profile", function(err, url) {
                            if (err) {
                                logger.error(err, data, "artisan_update_image_upload");
                                return done(err, null);
                            }
                            profile.updateAttributes({
                                companyName : data.companyName
                                , website : data.website
                                , location : data.location
                                , story : data.story
                                , classification : data.classification
                                , profileImageUrl : url
                            }).complete(function(err, profile) {
                                    if (err) {
                                        logger.error(err, data, "artisan_update_image_upload");
                                        return done(err, null);
                                    }
                                    geoCodeAddress(profile);
                                    return done(null, profile);
                                });
                        });
                    } else {
                        profile.updateAttributes({
                            companyName : data.companyName
                            , website : data.website
                            , location : data.location
                            , story : data.story
                            , classification : data.classification
                        }).complete(function(err, profile) {
                                if (err) {
                                    logger.error(err, data, "artisan_update_image_upload");
                                    return done(err, null);
                                }
                                geoCodeAddress(profile);
                                return done(null, profile);
                            });
                    }
                }
            });
    } catch (err) {
        logger.error(err, data, "artisan_profile_update_db");
        return done(err, null);
    }
};

exports.findArtisanProfileByUserId = function(user, done) {
    try {
        user.getArtisanProfile({include : ['Products']})
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, {userId : id}, "artisan_profile_db");
                    return done(err, null);
                }
                if (profile) {
                    var d = {
                        id : profile.id
                        , companyName : profile.companyName
                        , website : profile.website
                        , location : profile.location
                        , story : profile.story
                        , classification : profile.classification
                        , profileImageUrl : profile.profileImageUrl
                        , stripeCustomerId : profile.stripeCustomerId
                        , userId : profile.userId
                        , products : profile.products
                    };
                    return done(null, d);
                } else {
                    return done(null, null);
                }
            });
    } catch (err) {
        logger.error(err, id, "artisan_profile_db");
        return done(new error.ApiError(textMappings.FIND_ARTISAN_PROFILE_ERROR, "artisan_profile_db"), null);
    }
};

exports.findArtisanProfileById = function(id, done) {
    try {
        this.artisanProfile.find(id)
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, {id : id}, "artisan_profile_id");
                    return done(err, null);
                }
                done(null, profile);
            });
    } catch (err) {
        logger.error(err, {id : id}, "artisan_db");
        return done(new error.ApiError(textMappings.FIND_ARTISAN_PROFILE_ERROR, "artisan_profile_db"), null);
    }
};

exports.saveArtisanStripToken = function(user, id, done) {
    user.getArtisanProfile()
        .complete(function(err, profile) {
            if (err) {
                logger.error(err, null, "save_stripe_token");
                return done(err, null);
            }
            profile.stripeCustomerId = id;
            profile
                .save()
                .complete(function(err, profile) {
                    if (err) {
                        logger.error(err, null, "updateProfileWithStripe");
                        return done(err, null);
                    }
                    return done(null, profile);
                });
        });
};

exports.removeArtisanProfile = function(user, done) {
    try {
        users.removeRollFromUser(user, roles.roleTypes.ARTISAN, function(err, result) {
            if (err) {
                logger.error(err, null ,"removeArtisanProfile");
                return done(err, null);
            }
            user.getArtisanProfile()
                .complete(function(err, profile) {
                    profile.destroy()
                        .complete(function(err, result) {
                            if (err) {
                                logger.error(err, null, "removeArtisanProfile");
                                return done(err, null);
                            }
                            return done(null, result);
                        });
                });
        });
    } catch (err) {
        logger.error(err, null, "removeArtisanProfile");
        done(err, null);
    }
};

function checkExtension(filePath) {
    var extension = filePath.substr(filePath.indexOf("."), filePath.length);
    if (extension.toLowerCase() == ".png" || extension.toLowerCase() == ".jpg") {
        return true;
    } else {
        return false;
    }
}


