/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/29/13
 * Time: 1:42 PM
 */

var logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , fs = require('fs')
    , sleep = require('sleep')
    , headers = require('./util/Headers')
    , textMappings = require('../mappings/TextMappings')
    , config = require('../config/config.js').env()
    , url = require('url')

    , userDb = require('../database/Users')
    , artisanProfile = require('../database/ArtisanProfile')
    , stripe = require('stripe')(config.stripeSecretKey);

exports.createArtisanProfile = function(req, res) {
    var companyName, website, location, story, classification, filePath, data;
    try {
        companyName = req.body.companyName;
        website = req.body.website;
        location = req.body.location;
        story = req.body.story;
        classification = req.body.classification;
        if (req.body.tempFilePath) {
            filePath = req.body.tempFilePath;
        }
        data = {companyName : companyName, website : website, location : location, story : story, classification : classification, filePath : filePath, user : req.user};

        artisanProfile.createArtisanProfile(req.user, data, function(err, user) {
            if (err) {
                logger.error(err, data, "profile_web");
                if (filePath) {
                    fs.unlink(filePath, function(err) {});
                }
                res.json(headers.head.SERVER_ERROR, {errorMessage : (err.msg) ? err.msg : textMappings.message.GENERAL_ARTISAN_PROFILE_CREATION_ERROR});
                return;
            }
            if (filePath) {
                fs.unlink(filePath, function(err) {});
            }
            res.json(user);
        });
    } catch (err) {
        logger.error(err, req, "profile_ws");
        if (req.body.tempFilePath) {
            fs.unlink(req.body.tempFilePath, function(err) {});
        }
        res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.GENERAL_ARTISAN_PROFILE_CREATION_ERROR});
        return;
    }
};

exports.findArtisanProfileByUserId = function(req, res) {
    try {
        artisanProfile.findArtisanProfileByUserId(req.user, function(err, profile) {
            if (err) {
                logger.error(err, req.user.id, "find_artisan");
                return res.json(headers.head.NOT_FOUND, {errorMessage : "No profile found"});
            }
            if (profile && profile.stripeCustomerId) {
                getStripeCustomerDetails(profile.stripeCustomerId, function(err, customerObject) {
                    if (err) {
                        logger.error(err, null, "noStripeCustomerInfo");
                    }
                    return res.json({profile : profile, stripeCustomer : customerObject});
                });
            } else {
                return res.json({profile : profile, stripeCustomer : null});
            }
        });

    } catch (err) {
        logger.error(err, req, "artisan_profile_get_by_user_id");
        res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.FIND_ARTISAN_PROFILE_ERROR});
    }
};

exports.updateArtisanProfile = function(req, res) {
    var companyName, website, location, story, classification, filePath, data;
    try {
        companyName = req.body.companyName;
        website = req.body.website;
        location = req.body.location;
        story = req.body.story;
        classification = req.body.classification;
        if (req.body.tempFilePath) {
            filePath = req.body.tempFilePath;
        }
        data = {companyName : companyName, website : website, location : location, story : story, classification : classification, filePath : filePath, user : req.user};
        artisanProfile.updateArtisanProfile(req.user, data, function(err, profile) {
            if (err) {
                return res.json(headers.head.BAD_REQUEST, {errorMessage : textMappings.message.GENERAL_ARTISAN_PROFILE_UPDATE_ERROR});
            }
            if (profile && profile.stripeCustomerId) {
                getStripeCustomerDetails(profile.stripeCustomerId, function(err, customerObject) {
                    if (err) {
                        logger.error(err, null, "noStripeCustomerInfo");
                    }
                    return res.json({profile : profile, stripeCustomer : customerObject});
                });
            } else {
                return res.json(profile);
            }
        });
    } catch (err) {
        logger.error(err, req, "artisan_update_ws");
        res.json(headers.head.BAD_REQUEST, {errorMessage : textMappings.message.GENERAL_ARTISAN_PROFILE_UPDATE_ERROR}) ;
    }
};

exports.removeArtisanProfile = function(req, res) {
    var id = req.params.artisanId;
    try {
        artisanProfile.removeArtisanProfile(req.user, function(err, result) {
            if (err) {
                logger.error(err, null, "removeArtisanProfile");
                return res.json({errorMessage : "Sorry, there was a problem deleting your profile"});
            }
            removeStripeCustomer(result.stripeCustomerId);
            return res.json({message : "Profile removed!"});
        });
    } catch (err) {
        logger.error(err, null, "removeArtisanProfile");
        res.json(headers.head.SERVER_ERROR, {errorMessage : "Sorry, there was a problem deleting your profile"});
    }
};

exports.addStripeTokenToProfile = function(req, res) {
    try {
        var token = req.params.token;
        artisanProfile.findArtisanProfileByUserId(req.user, function(err, profile) {
            if (err) {
                return res.json(headers.head.NOT_FOUND, {errorMessage : "No profile found"});
            }
            if (!profile.stripeCustomerId) {
                stripe.customers.create(
                    {
                        email : req.user.email
                        , card : token
                    },
                    function(err, customer) {
                        if (err) {
                            logger.error(err, null, "addCustomerToStripe");
                            return res.json(headers.head.SERVER_ERROR, {errorMessage : err});
                        }
                        artisanProfile.saveArtisanStripToken(req.user, customer.id, function(err, profile) {
                            if (err) {
                                return res.json(headers.head.SERVER_ERROR, {errorMessage : "Unable to update Profile with Token"});
                            }
                            return res.json({stripeCustomer : customer, message : "Added card to customer!"});
                        });
                    });
            } else {
                stripe.customers.update(profile.stripeCustomerId, {card : token}, function(err, customerObject) {
                    if (err) {
                        logger.error(err, null, "updateStripeCustomerCard");
                        return res.json(headers.head.SERVER_ERROR, {errorMessage : "Unable to update card on file"});
                    }
                    return res.json({stripeCustomer : customerObject, message : "Updated card on file!"});
                });
            }
        });
    } catch (err) {
        logger.error(err, null, "addStripeTokenToProfile");
        return res.json(headers.head.SERVER_ERROR, {errorMessage : "Unable to update Profile with Token"});
    }
};

function getStripeCustomerDetails(customerId, done) {
    try {
        stripe.customers.retrieve(customerId, function(err, customerObject) {
            if (err) {
                logger.error(err, null, "noCustomerObjectReturned");
                return done(err, null);
            }
            return done(null, customerObject);
        });
    } catch (err) {
        logger.error(err, null, "errorGetStripeCustomer");
        done(err, null);
    }
}

function removeStripeCustomer(customerId) {
    try {
        stripe.customers.del(customerId, function(err, customerObject) {
            if (err) {
                logger.error(err, null, "errorRemoveStripeCustomer");
            } else {
                logger.info("removed strip customer " + customerId, null, "removedStripeCustomer");
            }
        });
    } catch (err) {
        logger.error(err, null, "removeStripeCustomer");
    }
}