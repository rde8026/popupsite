/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 2/10/13
 * Time: 8:55 PM
 * To change this template use File | Settings | File Templates.
 */

var geocoder = require('geocoder')
    , logger = require('../../logger/Logger');


exports.geoCodeAddress = function(address, done) {
    geocoder.geocode(address, function(err, results) {
        if (err) {
            return done(err, null);
        }
        return getLatLong(results[0]);
    });
};

exports.geoCodeArtisanProfile = function(address, profile) {
    geocoder.geocode(address, function(err, results) {
        if (err) {
            logger.error(err, {address : address, profileId : profile.id}, "geoCodeArtisanProfile");
        } else {
            if (results != null && (results.results != null && results.results.length > 0)) {
                var location = getLatLong(results.results[0]);
                profile.updateAttributes({
                    latitude : location.lat
                    , longitude : location.lng
                }).complete(function(err, profile) {
                        if (err) {
                            logger.error(err, null, "updateProfileWithGeoCode");
                        } else {
                            logger.info("updated profile with geocode");
                        }
                    });
            } else {
                logger.info("No results returned from address " + address + " for profileId " + profile.id, null, "geoCodeArtisanProfile");
            }
        }
    });
};

exports.geoCodeMerchantLocation = function(location) {
    var address = '';
    address += (location.address != null && typeof location.address != 'undefined') ? location.address : '';
    address += (location.address2 != null && typeof location.address2 != 'undefined') ? ' ' + location.address2 : '';
    address += (location.city != null && typeof location.city != 'undefined') ? ' ' + location.city : '';
    address += (location.state != null && typeof location.state != 'undefined') ? ' ' + location.state : '';
    address += (location.zipCode != null && typeof location.zipCode != 'undefined') ? ' ' + location.zipCode : '';

    geocoder.geocode(address, function(err, results) {
        if (err) {
            logger.error(err, {address : address, locationId : location.id}, "geocodeMerchantLocation");
        } else {
            if (results != null && (results.results != null && results.results.length > 0)) {
                var loc = getLatLong(results.results[0]);
                location.updateAttributes({
                    latitude : loc.lat
                    , longitude : loc.lng
                }).complete(function(err, location) {
                        if (err) {
                            logger.error(err, null, "updateMerchantLocationWithGeoCode");
                        } else {
                            logger.info("updated merchant location with GeoCode");
                        }
                    });
            }
        }
    });

};



function getLatLong(result) {
    if (typeof result != 'undefined' && typeof result.geometry != 'undefined' && result.geometry.location != 'undefined') {
        return result.geometry.location;
    }
    return null;
}