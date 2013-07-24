/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 2/6/13
 * Time: 5:32 PM
 */


var logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , fs = require('fs')
    , headers = require('./util/Headers')
    , textMappings = require('../mappings/TextMappings')


    , userDb = require('../database/Users')
    , merchantProfile = require('../database/MerchantsProfile')
    , merchantLocation = require('../database/MerchantLocation');

exports.findMerchantProfileById = function(req, res) {
    try {
        merchantProfile.findMerchantProfileByUser(req.user, function(err, profile) {
            if (err) {
                return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.FIND_MERCHANT_PROFILE_GENERAL_ERROR});
            }
            return res.json(profile);
        });

    } catch (err) {
        logger.error(err, null, "find_merchant_profile_by_id");
        return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.FIND_MERCHANT_PROFILE_GENERAL_ERROR});
    }
};

exports.createMerchantProfile = function(req, res) {
    var companyName, website, story, classification, filePath, data;
    try {
        companyName = req.body.companyName;
        website = req.body.website;
        story = req.body.story;
        classification = req.body.classification;
        if (req.body.tempFilePath) {
            filePath = req.body.tempFilePath;
        }
        data = {companyName : companyName, website : website, story : story, classification : classification, filePath : filePath};
        merchantProfile.createMerchantProfile(req.user, data, function(err, profile) {
            if (err) {
                return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.CREATE_MERCHANT_PROFILE_GENERAL_ERROR});
            }
            var response = {
                profile : profile,
                message : textMappings.message.CREATE_MERCHANT_PROFILE_SUCCESS
            };
            return res.json(response);
        });
    } catch (err) {
        logger.error(err, null, "createMerchantProfileWs");
        return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.CREATE_MERCHANT_PROFILE_GENERAL_ERROR});
    }
};

exports.updateMerchantProfile = function(req, res) {
    var companyName, website, story, classification, filePath, data;
    try {
        companyName = req.body.companyName;
        website = req.body.website;
        story = req.body.story;
        classification = req.body.classification;
        if (req.body.tempFilePath) {
            filePath = req.body.tempFilePath;
        }
        data = {companyName : companyName, website : website, story : story, classification : classification, filePath : filePath};
        merchantProfile.updateMerchantProfile(req.user, data, function(err, profile) {
            if (err) {
                return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.UPDATE_MERCHANT_PROFILE_GENERAL_ERROR});
            }
            var response = {
                profile : profile,
                message : textMappings.message.UPDATE_MERCHANT_PROFILE_SUCCESS
            };
            return res.json(response);
        });
    } catch (err) {
        logger.error(err, null, "createMerchantProfileWs");
        res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.UPDATE_MERCHANT_PROFILE_GENERAL_ERROR});
    }
};

exports.addMerchantLocation = function(req, res) {
    try {
        var location = {
            name : req.body.name
            , description : req.body.description
            , address : req.body.address
            , address2 : req.body.address2
            , city : req.body.city
            , state : req.body.state
            , zipCode : req.body.zipCode
            , dailyRate : req.body.dailyRate
            , hourlyRate : req.body.hourlyRate
        };
        var images = req.body.images;
        merchantLocation.saveAndAttachLocation(req.user, location, images, function(err, location) {
            if (err) {
                return res.json(headers.head.SERVER_ERROR, {errorMessage : "Unable to save location"});
            } else {
                return res.json(location);
            }
        });
    } catch (err) {
        logger.error(err, null, "addMerchantLocation");
        res.json(headers.head.SERVER_ERROR, {errorMessage : "Unknown error"});
    }
};


