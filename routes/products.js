/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/30/13
 * Time: 2:09 AM
 */


var product_db = require('../database/Product')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , textMappings = require('../mappings/TextMappings')
    , headers = require('./util/Headers')

    , Sequelize = require('sequelize')
    , userDb = require('../database/Users')
    , artisanProfile = require('../database/ArtisanProfile')
    , productsDb = require('../database/Product');


exports.findProductsByArtisanId = function(req, res) {
    try {
        var start = (req.query['start']) ? req.query['start'] : 0;//, end = (req.query['end']) ? req.query['end'] : 0;
        var usr = req.user;
        req.user.getArtisanProfile()
            .complete(function(err, profile) {
                if (err) {
                    logger.error(err, null, "");
                    return res.json(headers.head.SERVER_ERROR, {errorMessage : "Sorry, there was a problem finding your products"});
                }
                var d = {
                    artisanProfile : profile
                };

                var chain = new Sequelize.Utils.QueryChainer();
                chain.add(productsDb.product.count({where : {artisanProfileId : profile.id}}));
                chain.add(productsDb.product.findAll({where : {artisanProfileId : profile.id}, offset : start, limit : 10}));

                chain.runSerially()
                    .complete(function(err, results) {
                        if (err) {
                            logger.error(err, null, "products_get_artisan");
                            return res.json(headers.head.SERVER_ERROR, {errorMessage : "Sorry, there was a problem finding your products"});
                        }
                        d.count = results[0];
                        d.products = results[1];
                        d.pages = calculatePages(d.count);
                        return res.json(d);
                    });
            });
    } catch (err) {
        logger.error(err, null, "find_all_products_artisan");
        return res.json(headers.head.NOT_FOUND, {errorMessage : "You don't have any products stored yet!"});
    }
};

function calculatePages(count) {
    var totalPages = Math.ceil(count / 10);
    var pages = [];
    for (var i = 0; i < totalPages; i++) {
        var page = {};
        page.start = i * 10;
        //page.end = (i * 10) + 10;
        page.number = i;
        pages.push(page);
    }
    return pages;
}

exports.createArtisanProduct = function(req, res) {
    try {

        var name = req.body.name, description = req.body.description,
            price = req.body.price, thumbnailImage = req.body.tempThumbnailPath
            , featureImage = req.body.tempFeaturePath;
        var d = {name : name, description : description, price : price, thumbnailImage : thumbnailImage, featureImage : featureImage};
        productsDb.createProduct(req.user, d,
            function(err, product) {
                if (err) {
                    logger.error(err, d, "products_save");
                    return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_CREATE_GENERAL_ERROR});
                }
                return res.json(product);
            }
        );
    } catch (err) {
        logger.error(err, req, "create_artisan_products");
        res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_CREATE_GENERAL_ERROR});
    }
};

exports.removeProductFromArtisan = function(req, res) {
    try {
        var id = req.params.productId;
        productsDb.removeProduct(id, function(err, response) {
            if (err) {
                logger.error(err, null, "remove_prodcut");
                return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_DELETE_GENERAL_ERROR});
            }
            return res.json({message : "Your product has been removed!"});
        });
    } catch (err) {
        logger.error(err, null, "remove_product_ws");
        return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_DELETE_GENERAL_ERROR});
    }
};

exports.updateArtisanProduct = function(req, res) {
    try {
        console.log(req.body.tempThumbnailPath);
        var productId = req.params.productId;
        if (!productId) {
            return res.json(headers.head.BAD_REQUEST, {errorMessage : textMappings.message.PRODUCT_ASYNC_UPDATE_MISSING_ID_ERROR});
        } else {
            var name = req.body.name, description = req.body.description,
                price = req.body.price, thumbnailImage = req.body.tempThumbnailPath
                , featureImage = req.body.tempFeaturePath;
            var d = {name : name, description : description, price : price, thumbnailImage : thumbnailImage, featureImage : featureImage};
            productsDb.updateProduct(productId, d, function(err, product) {
                if (err) {
                    logger.error(err, null, "product_update_ws");
                    return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_UPDATE_GENERAL_ERROR});
                }
                return res.json({product : product, message : textMappings.message.PRODUCT_ASYNC_UPDATE_GENERAL_SUCCESS});
            });

        }
    } catch (err) {
        logger.error(err, null, "update_artisan_product");
        return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.PRODUCT_ASYNC_UPDATE_GENERAL_ERROR});
    }
};