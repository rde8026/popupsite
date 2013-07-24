/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/14/13
 * Time: 8:13 PM
 * To change this template use File | Settings | File Templates.
 */

var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , config = require('../config/config.js').env()
    , bcrypt = require('bcrypt')
    , salt = bcrypt.genSaltSync(10);

var db_connection;

if (!config.sqlLite) {
    db_connection = new Sequelize(config.database, config.username, config.password, {
        dialect: 'mysql'
        , pool: { maxConnections: 5, maxIdleTime: 30}
        , logging : function(str) {
            logger.debug(str, null, "db_connection");
        }
    });
} else {
    db_connection = new Sequelize('', '', '', {
        dialect: 'sqlite'
        , logging : console.log
    });
}



exports.Connection = db_connection;

exports.genPassword = function(pwd) {
    return bcrypt.hashSync(pwd, salt);
};

exports.comparePwd = function(provided, existing) {
    return bcrypt.compareSync(provided, existing);
};

var ratings = require('./Rating')
    , products = require('./Product')
    , images = require('./Images')
    , keywords = require('./Keywords')
    , users = require('./Users')
    , roles = require('./Roles')
    , artisanProfiles = require('./ArtisanProfile')
    , merchantProfiles = require('./MerchantsProfile')
    , merchantLocation = require('./MerchantLocation')
    , locationImages = require('./LocationImages');

exports.init = function(done) {

    /*products.product.hasMany(ratings.rating, {foreignKey : 'entityId'});
    products.product.hasMany(images.image, {as : 'Images', foreignKey : 'entityId'});
    products.product.hasMany(keywords.keyword, {foreignKey : 'entityId'});*/

    users.user.hasMany(roles.role, {as : "Roles"});
    roles.role.hasMany(users.user, {as : "Users"});

    users.user.hasOne(artisanProfiles.artisanProfile, {as : "ArtisanProfile"});
    artisanProfiles.artisanProfile.belongsTo(users.user, {foreignKey : "userId", as : "User"});

    artisanProfiles.artisanProfile.hasMany(products.product, { foreignKey : "artisanProfileId", as : 'Products'});
    products.product.belongsTo(artisanProfiles.artisanProfile, { foreignKey : "artisanProfileId", as : "ArtisanProfile"});

    users.user.hasOne(merchantProfiles.merchantProfile, {as : 'MerchantProfile'});
    merchantProfiles.merchantProfile.belongsTo(users.user, {foreignKey : "userId", as : "User"});

    merchantProfiles.merchantProfile.hasMany(merchantLocation.merchantLocation, {foreignKey : 'merchantProfileId', as : 'Locations'});
    merchantLocation.merchantLocation.belongsTo(merchantProfiles.merchantProfile, { foreignKey : 'merchantProfileId', as : 'MerchantProfile' });

    merchantLocation.merchantLocation.hasMany(locationImages.locationImages, {foreignKey : 'merchantLocationId', as : 'Images'});
    locationImages.locationImages.belongsTo(merchantLocation.merchantLocation, {foreignKey : 'merchantLocationId', as : 'MerchantLocation'});

    if (config.drop_db) {
        var dropChain = new Sequelize.Utils.QueryChainer();
        dropChain.add(db_connection.query('ALTER TABLE rolesusers DROP FOREIGN KEY fk_role_user'));
        dropChain.add(db_connection.query('ALTER TABLE rolesusers DROP FOREIGN KEY fk_role_role'));
        dropChain.add(db_connection.query('ALTER TABLE artisan_profiles DROP FOREIGN KEY fk_user'));
        dropChain.add(db_connection.query('ALTER TABLE merchant_profiles DROP FOREIGN KEY fk_user'));
        dropChain.add(db_connection.query('ALTER TABLE products DROP FOREIGN KEY fk_artisan'));
        dropChain.add(db_connection.query('ALTER TABLE merchant_locations DROP FOREIGN KEY fk_merch_location'));
        dropChain.add(db_connection.query('ALTER TABLE location_images DROP FOREIGN KEY fk_location_img'));
        dropChain
            .runSerially({ skipOnError: true })
            .complete(function(err, results) {
                if (err) {
                    logger.error(err, null, "init drop");
                }
                db_connection.drop().success(function() {
                    db_connection.sync().success(function() {

                        var alterChain = new Sequelize.Utils.QueryChainer();
                        alterChain.add(db_connection.query('ALTER TABLE rolesusers ADD CONSTRAINT fk_role_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALTER TABLE rolesusers ADD CONSTRAINT fk_role_role FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALTER TABLE artisan_profiles ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALTER TABLE merchant_profiles ADD CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALTER TABLE products ADD CONSTRAINT fk_artisan FOREIGN KEY (artisanProfileId) REFERENCES artisan_profiles(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALTER TABLE merchant_locations ADD CONSTRAINT fk_merch_location FOREIGN KEY (merchantProfileId) REFERENCES merchant_profiles(id) ON DELETE CASCADE'));
                        alterChain.add(db_connection.query('ALERT TABLE location_images ADD CONSTRAINT fk_location_img FOREIGN KEY (merchantLocationId) REFERENCES merchant_locations(id) ON DELETE CASCADE'));
                        alterChain
                            .runSerially({ skipOnError: true })
                            .complete(function(err, results) {
                                if (err) {
                                    logger.error(err, null, "init alter");
                                }
                                roles.initRoles(function(bool) {
                                    if (bool) {
                                        done(true);
                                    } else {
                                        done(false);
                                    }
                                });
                            });
                    });
                });
            });
    } else {
        db_connection.sync().success(function() {
            roles.initRoles(function(bool) {
                if (bool) {
                    done(true);
                } else {
                    done(false);
                }
            });
        });
    }

};
