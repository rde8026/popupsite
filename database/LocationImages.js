/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 2/13/13
 * Time: 9:51 PM
 * To change this template use File | Settings | File Templates.
 */

var Sequelize = require('sequelize')
    , connection = require('./db_conn')
    , logger = require('../logger/Logger')
    , Images = require('./Images')
    , fileUpload = require('../routes/util/fileUpload')
    , FOLDER_NAME = "location_images";


exports.locationImages = connection.Connection.define('location_image', {
    id : { type : Sequelize.INTEGER, primaryKey : true, allowNull : false, autoIncrement : true }
    , url : { type : Sequelize.STRING, allowNull : false }
    },
    {
        charset: 'latin1'
    }
);


exports.saveLocationImages = function(location, images, done) {
    var self = this;
    Images.uploadImages(images, FOLDER_NAME, function(err, urls) {
        if (err) {
            logger.error(err, null, "saveLocationImages");
            return done(err, null);
        }
        saveImagesRecursive(location, urls, [], done, self);
    });
};


function saveImagesRecursive(location, urls, sofar, done, self) {
    var url = urls.shift();
    if (typeof url == 'undefined') {
        return done(null, sofar);
    } else {
        self.locationImages.build({url : url.url})
            .save()
            .complete(function(err, image) {
                if (err) {
                    logger.error(err, null, "saveLocationImageToDB");
                    saveImagesRecursive(urls, sofar, done, self);
                } else {
                    image.setMerchantLocation(location)
                        .complete(function(err, img) {
                            if (err) {
                                logger.error(err, null, "attachImageToLocation");
                            }
                            saveImagesRecursive(location, urls, sofar, done, self);
                        });
                }
            });
    }
}
