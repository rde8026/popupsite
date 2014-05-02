/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/19/13
 * Time: 9:18 AM
 * To change this template use File | Settings | File Templates.
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , fs = require('fs')
    , aws = require('aws-sdk')
    , textMappings = require('../mappings/TextMappings')
    , connection = require('./db_conn');

exports.image = connection.Connection.define('image', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , url : { type : Sequelize.STRING, allowNull : false }
        , type : { type : Sequelize.STRING, allowNull : false }
        , entityId : { type : Sequelize.INTEGER, allowNull : false }
        , entityType : { type : Sequelize.STRING, allowNull : false }
    },
    {
        charset: 'latin1'
    }
);

exports.imageType = {
    PRODUCT_THUMB : "PRODUCT_THUMBNAIL"
    , PRODUCT_FEATURE : "PRODUCT_FEATURE"
    , ARTISAN_PROFILE : "ARTISAN_PROFILE"
    , ARTISAN_THUMB : "ARTISAN_THUMBNAIL"
    , ARTISAN_FEATURE : "ARTISAN_FEATURE"
    , MERCHANT_THUMBNAIL : "MERCHANT_THUMBNAIL"
    , MERCHANT_FEATURE : "MERCHANT_FEATURE"
};

function uuid(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }
    return buf.join('');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.saveImage = function(filePath, type, entityId, entityType, folder, done) {
    try {
        var self = this;
        addImageToS3(filePath, entityId, entityType, folder, function(err, url) {
            if (err) {
                logger.error(err, {filePath : filePath, type : type, folder : folder, entityId : entityId, entityType : entityType}, "images_db");
                return done(new error.ApiError(textMappings.message.S3_STORAGE_ERROR, "images_db"), null);
            }
            self.image.build({url : url, type : type, entityId: entityId, entityType : entityType})
                .save()
                .complete(function(err, image) {
                    if (err) {
                        logger.error(err, {filePath : filePath, type : type, folder : folder, entityId : entityId, entityType : entityType}, "images_db");
                        return done(new error.ApiError(textMappings.message.S3_STORAGE_ERROR, "images_db"), null);
                    }
                    return done(null, image);
                });
        });
    } catch (err) {
        logger.error(err, {filePath : filePath, type : type, folder : folder, entityId : entityId, entityType : entityType}, "images_db");
        return done(new error.ApiError(textMappings.message.S3_STORAGE_ERROR, "images_db"), null);
    }
};

exports.saveImages = function(filePaths, entityId, entityType, folder, done) {
    try {
        var p = [];
        filePaths.forEach(function(path, index) {
            p.push({filePath : path.filePath, type : path.type, entityId: entityId, entityType: entityType, folder : folder});
        }, this);
        recursiveSave(p, [], function(err, images) {
            if (err) {
                logger.error(err, p, "images_db");
                return done(err, null);
            }
            return done(null, images);
        });
    } catch (err) {
        logger.error(err, null, "images_db");
        return done(err, null);
    }
};

exports.uploadImage = function(imagePath, folder, done) {
    addImageToS3(imagePath, null, null, folder, function(err, url) {
        if (err) {
            logger.error(err, {imagePath : imagePath}, "images_db");
            return done(err, null);
        }
        return done(null, url);
    });
};

exports.uploadImages = function(images, folder, done) {
    recursiveImageUpload(images, folder, [], function(err, imgs) {
        if (err) {
            logger.error(err, images, "upload_images");
            return done(err, null);
        }
        return done(null, imgs);
    });
};

function recursiveImageUpload(images, folder, sofar, done) {
    var img = images.shift();
    if (typeof img == 'undefined') {
        done(null, sofar);
    } else {
        addImageToS3(img.filePath, null, null, folder, function(err, url) {
            if (err) {
                logger.error(err, img.filePath, "images_upload_recursive");
                recursiveImageUpload(images, folder, sofar, done);
            } else {
                sofar.push({url : url, name : img.name});
                recursiveImageUpload(images, folder, sofar, done);
            }
        });
    }
}

function recursiveSave(imgObjs, sofar, done) {
    var Images = require('./Images');
    var imgObj = imgObjs.shift();
    if (typeof imgObj == 'undefined') {
        done(null, sofar);
    } else {
        var fPath = imgObj.filePath, type = imgObj.type, entityId = imgObj.entityId, entityType = imgObj.entityType, folder = imgObj.folder;
        addImageToS3(fPath, entityId, entityType, folder, function(err, url) {
            if (url) {
                Images.image.build({url: url, type : type, entityId: entityId, entityType:entityType})
                    .save()
                    .complete(function(err, image) {
                        if (err) {
                            throw err;
                        } else {
                            sofar.push(image);
                            recursiveSave(imgObjs, sofar, done);
                        }
                    });
            } else {
                recursiveSave(imgObjs, sofar, done);
            }
        });
    }
}

var siteApiImageBucket = "site_api_images";
var s3BaseUrl = "http://s3.amazonaws.com/site_api_images/"


function addImageToS3(filePath, entityId, entityType, folder, done) {
    //TODO: Figure out how to load the config from file
    //TODO: Figure out how to store a job and retry it.

    aws.config.update({accessKeyId: '', secretAccessKey: '', region : 'us-east-1'});
    var s3 = new aws.S3();
    var extension = filePath.substr(filePath.indexOf("."), filePath.length);
    var fName = uuid(10) + extension;
    fs.readFile(filePath, function (err, data) {
        if (err) {
            logger.error(err, null, "image_db");
            return done(new error.ApiError(textMappings.message.S3_STORAGE_ERROR, "artisan_profile_db"), null)
        }
        s3.client.putObject({
            Bucket: siteApiImageBucket,
            ACL:'public-read',
            Key: folder + '/' + fName,
            Body: data
        }, function (err, data) {
            if (err) {
                logger.error(err, {filePath : filePath, entityId: entityId, entityType: entityType, folder : folder}, "image_db");
                return done(err, null);
            }
            fs.unlink(filePath, function(err) {
                if (err) {
                    logger.error(err, null, "images_db");
                }
                var url = s3BaseUrl + folder + "/" + fName;
                return done(null, url);
            });
        })

    });
}