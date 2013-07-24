/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/19/13
 * Time: 8:45 AM
 * To change this template use File | Settings | File Templates.
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , connection = require('./db_conn')
    , fs = require('fs')
    , artisanProfile = require('./ArtisanProfile')
    , headers = require('../routes/util/Headers')
    , messages = require('../mappings/TextMappings').message
    , keys = require('./Keywords')
    , images = require('./Images')
    , entities = require('./EntityType')
    , PROD_CLAZZ = "product_db";

exports.product = connection.Connection.define('product', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , name : { type : Sequelize.STRING, allowNull: false }
        , thumbnailImage : { type : Sequelize.STRING, allowNull : true }
        , featureImage : { type : Sequelize.STRING, allowNull : true }
        , extraImage : { type : Sequelize.STRING, allowNull : true }
        , classification : { type : Sequelize.STRING, allowNull : true }
        , price : { type : Sequelize.FLOAT, allowNull: false, defaultValue : 0 }
        , averageRating : { type : Sequelize.FLOAT, allowNull: true, defaultValue: 0 }
        , description : { type : Sequelize.TEXT, allowNull: true }
        , qoh : { type : Sequelize.INTEGER, allowNull : true }
    },
    {
        charset: 'latin1'
    }
);


exports.createProduct = function(user, json, done) {
    var thumbnailImage = null, featureImage = null;
    var self = this;
    try {
        if (json.thumbnailImage) {
            thumbnailImage = json.thumbnailImage;
        }
        if (json.featureImage) {
            featureImage = json.featureImage;
        }

        this.product.build({
            name : json.name
            , price : json.price
            , description : json.description
        }).save()
            .complete(function(err, result) {
                if (err) {
                    logger.error(err, json, PROD_CLAZZ);
                    return done(new error.ApiError("Unable to create product", PROD_CLAZZ));
                } else if (!result) {
                    logger.error("Unable to create product", json, PROD_CLAZZ);
                    return done(new error.ApiError("Unable to create product", PROD_CLAZZ, headers.head.SERVER_ERROR));
                }
                var imgs = [];
                if (thumbnailImage) {
                    imgs.push({filePath : thumbnailImage, name : "thumbnailImage"});
                }
                if (featureImage) {
                    imgs.push({filePath : featureImage, name : "featureImage"});
                }
                if (imgs.length > 0) {
                    images.uploadImages(imgs, "product", function(err, images) {
                        if (err) {
                            logger.error(err, imgs, "save_product");
                            return done(null, result);
                        }
                        images.forEach(function(img, index) {
                            if (img.name == "thumbnailImage") {
                                result.thumbnailImage = img.url;
                            }
                            if (img.name == "featureImage") {
                                result.featureImage = img.url;
                            }
                        }, this);
                        result.save()
                            .complete(function(err, prod) {
                                if (err) {
                                    logger.error(err, imgs, "products_update_image");
                                }
                                user.getArtisanProfile()
                                    .complete(function(err, profile) {
                                        if (err) {
                                            logger.error(err, null, "add_product_get_artisan_profile");
                                            return done(err, null);
                                        }
                                        attachProductToArtisan(profile, result, done);
                                    });
                            });
                    });
                } else {
                    user.getArtisanProfile()
                        .complete(function(err, profile) {
                            if (err) {
                                logger.error(err, null, "add_product_get_artisan_profile");
                                return done(err, null);
                            }
                            attachProductToArtisan(profile, result, done);
                        });
                }
            });

    } catch (err) {
        logger.error(err, json, "product_db");
        return done(new error.ApiError("Unable to create product", PROD_CLAZZ));
    }
};

function attachProductToArtisan(artisanProfile, product, done) {
    product.setArtisanProfile(artisanProfile)
        .complete(function(err, product) {
            if (err) {
                logger.error(err, null, "attache_product_to_artisan");
                product.destroy()
                    .complete(function(error, response) {
                        return done(err, null);
                    });
                return done(err, null);
            }
            return done(null, product);
        });
}

exports.findProductById = function(id, done) {
    try {
        this.product.find({where : {id : id}})
        .complete(function(err, result) {
                if (err) {
                    logger.error(err, id, PROD_CLAZZ);
                    return done(new error.ApiError("An error occurred trying to locate the product", PROD_CLAZZ, headers.head.NOT_FOUND));
                }
                if (!result) {
                    logger.error("Product find returned null!", id, PROD_CLAZZ);
                    return done(new error.ApiError("Unable to find product", PROD_CLAZZ, headers.head.NOT_FOUND));
                }
                return done(null, result);
            });
    } catch (err) {
        logger.error(err, id, "product_db");
        return done(new error.ApiError("Unable to find product", PROD_CLAZZ, headers.head.NOT_FOUND));
    }
};

exports.searchProducts = function(search, start, end, done) {
    try {
        var response = {};
        var that = this;
        keys.searchKeywords(search, entities.entityType.PRODUCT, start, end, function(err, results) {
            if (err) {
                logger.error(err, search, PROD_CLAZZ);
                fallbackLikeQuery(that, search, done);
            } else if (!results || results.length == 0) {
                fallbackLikeQuery(that, search, done);
            } else {
                var ids = [];
                response.total = results.totalCount;
                results.docs.forEach(function(val, index) {
                    ids.push(val.entityId);
                }, this);

                that.product.findAll({where : {id : ids}})
                    .success(function(products) {
                        response.products = products;
                        if (products.length == 0) {
                            response.total = 0;
                        }
                        fetchImages(products, [], function(err, results) {
                            done(null, results);
                            return;
                        });
                    })
                    .error(function(err) {
                        done(err, null);
                        return;
                    });
            }

        });

    } catch (err) {
        logger.error(err, search, "product_db");
        return done(new error.ApiError("The search returned no results", PROD_CLAZZ, headers.head.NOT_FOUND));
    }
};

exports.updateProduct = function(id, json, done) {
    try {
        var thumbnailImage = null, featureImage = null, imgs = [];
        if (json.thumbnailImage) {
            imgs.push({filePath : json.thumbnailImage, name : "thumbnailImage"});
        }
        if (json.featureImage) {
            imgs.push({filePath : json.featureImage, name : "featureImage"});
        }
        this.product.find({where : {id : id}})
            .complete(function(err, product) {
                if (err) {
                    return done(err, null);
                }
                if (!product) {
                    return done("No product found", null);
                }
                if (json.name) {
                    product.name = json.name;
                }
                if (json.description) {
                    product.description = json.description;
                }
                if (json.price) {
                    product.price = json.price;
                }
                if (imgs.length > 0) {
                    images.uploadImages(imgs, "product", function(err, images) {
                        if (err) {
                            logger.error(err, imgs, "save_product");
                            return done(null, result);
                        }
                        images.forEach(function(img, index) {
                            if (img.name == "thumbnailImage") {
                                product.thumbnailImage = img.url;
                            }
                            if (img.name == "featureImage") {
                                product.featureImage = img.url;
                            }
                        }, this);

                        product.save()
                            .complete(function(err, product) {
                                if (err) {
                                    logger.error(err, null, "update_product_w_images");
                                    return done(err, null);
                                }
                                return done(null, product);
                            });

                    });
                } else {
                    product.save()
                        .complete(function(err, product) {
                            if (err) {
                                logger.error(err, null, "update_product");
                                return done(err, null);
                            }
                            return done(null, product);
                        });
                }
            });
    } catch (err) {
        logger.error(err, json, "product_db");
        return done(new error.ApiError((err.msg) ? err.msg : "Unable to update product", PROD_CLAZZ, (err.status) ? err.status : headers.head.BAD_REQUEST));
    }
};

exports.removeProduct = function(id, done) {
    try {
        this.product.find({where : {id : id}})
            .complete(function(err, p) {
                if (err) {
                    return done(new error.ApiError("Unable to find product", PROD_CLAZZ, headers.head.NOT_FOUND), null);
                }
                keys.removeKeywords(p.id, entities.entityType.PRODUCT, function(err, obj) {
                    if (err) {
                        logger.error(null, err, "products_db")
                    }
                    p.destroy().complete(function(err, response) {
                        if (err) {
                            return done(new error.ApiError("Unable to remove product", PROD_CLAZZ, headers.head.NOT_FOUND), null);
                        }
                        return done(null, response);
                    });
                });
            });
    } catch (err) {
        logger.error(err, {id : id}, "product_db");
        return done(new error.ApiError((err.msg) ? err.msg : "Unable to remove product", PROD_CLAZZ, (err.status) ? err.status : headers.head.BAD_REQUEST));
    }
};

exports.findProductsByArtisanId = function(artisanId, done) {
    try {
        this.product.findAll({where : {artisanProfileId : artisanId}})
            .complete(function(err, products) {
                if (err) {
                    logger.error(err, {artisanId : artisanId}, "products_db");
                    return done(err, null);
                }
                return done(null, products);
            });
    } catch (err) {
        logger.error(err, {artisanId : artisanId}, "products_db");
        return done(new error.ApiError(messages.PRODUCT_ASYNC_GET_GENERAL_ERROR, "products_db"), null);
    }
};

exports.removeProductById = function(id, done) {
    this.product.find(id)
        .complete(function(err, product) {
            if (err) {
                logger.error(err, {productId : id}, "product_db");
                return done(err, null);
            }
            if (product) {
                product.destroy()
                    .success(function() {
                        return done(null, true);
                    })
                    .error(function(err) {
                        return done(err, null);
                    });
            } else {
                return done(null, false);
            }
        });
};

function uploadImages(imgObjs, sofar, done) {
    var imgObj = imgObjs.shift();
    if (typeof imgObj  == 'undefined') {
        done(null, sofar);
    } else {
        images.uploadImage(imgObj.filePath, "product", function(err, url) {
            if (err) {
                logger.error(err, {filePath : imgObj.filePath}, "product_db");
                uploadImages(imgObjs, sofar, done);
            } else {
                sofar.push({url : url, type : imgObj.type});
                uploadImages(imgObjs, sofar, done);
            }
        });
    }
}

function fallbackLikeQuery(ctx, search, done) {
    ctx.product.findAll({where : ["name LIKE ? OR description LIKE ?", "%" + search + "%", "%" + search + "%"], order : 'name', limit : 10})
        .complete(function(err, result) {
            if (err) {
                logger.error(err, search, PROD_CLAZZ);
                return done(new error.ApiError("An error occurred trying to locate the product", PROD_CLAZZ, headers.head.NOT_FOUND));
            }
            if (!result) {
                logger.error("No products where found using the provided search terms", id, PROD_CLAZZ);
                return done(new error.ApiError("Unable to find product", PROD_CLAZZ, headers.head.NOT_FOUND));
            }
            return done(null, result);
        });
}

function fetchImages(products, sofar, done) {
    var product = products.shift();
    if (typeof product == 'undefined') {
        done(null, sofar);
    } else {
        var prod = mapProduct(product);
        product.getImages()
            .success(function(images) {
                if (images) {
                    prod.images = images;
                }
                sofar.push(prod);
                fetchImages(products, sofar, done);
            })
            .error(function(err) {
                logger.error(err, null, "product_db");
                fetchImages(products, sofar, done);
            });
    }
}

function mapProduct(product) {
    var prod = {};
    prod.id = product.id;
    prod.name = product.name;
    prod.price = product.price;
    prod.averageRating =  product.averageRating;
    prod.description = product.description;
    prod.qoh = product.qoh;
    prod.createdAt = product.createdAt;
    prod.updatedAt = product.updatedAt;
    prod.artisanId = product.artisanId;

    return prod;
}

function checkExtension(filePath) {
    var extension = filePath.substr(filePath.indexOf("."), filePath.length);
    if (extension.toLowerCase() == ".png" || extension.toLowerCase() == ".jpg") {
        return true;
    } else {
        return false;
    }
}