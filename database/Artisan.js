/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/15/13
 * Time: 1:30 PM
 */
/*
    RAW QUERY:
    var sql = Sequelize.Utils.format(['select * from users where id = ?', 1])
    sequelize.query(sql, null, {raw: true}).success(function(data){ console.log(data) }).error(function(err){ console.log(err) }

 */

var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , db_connection = require('./db_conn')
    , ratings = require('./Rating')
    , entityTypes = require('./EntityType');

exports.artisan = db_connection.Connection.define('artisan', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , username : {type : Sequelize.STRING, unique : true, allowNull: false}
        , passwd : {type : Sequelize.STRING, allowNull:false}
        , firstName : {type: Sequelize.STRING, allowNull:false}
        , lastName : {type : Sequelize.STRING, allowNull: false}
        , profileId : {type: Sequelize.STRING, allowNull : true}
        , averageRating : {type: Sequelize.FLOAT, allowNull: true, defaultValue : 0}
    },
    {
        paranoid: true
    },
    {
        classMethods : {
            rawQuery : function(callback) {
                db_connection.Connection.query("select 1 from dual")
                    .on('success', callback)
                    .on('error', callback);
            }
        },
        instanceMethods: {
            getFullName : function() {
                return [this.firstName, this.lastName].join(' ');
            }
        }
    }
);

/**
 * API Web service actions for Artisans
 */


exports.createArtisan = function(json, done) {
    try {
        var output = {};
        this.artisan.build({
            username : json.username
            , passwd : db_connection.genPassword(json.passwd)
            , firstName : json.firstName
            , lastName : json.lastName
        })
        .save()
        .complete(function(err, result) {
            if (err) {
                logger.error("Error saving artisan", err, "artisan_db");
                done(new error.ApiError("Unable to create artisan.", "artisan_db"));
                return;
            }
            output.artisan = result;
            done(null, output);
            return;
        });
    } catch (err) {
        logger.error(err, json, "artisan_db");
        done(new error.ApiError("Unable to create artisan.", "artisan_db"));
        return;
    }
};

exports.addRatingForArtisan = function(id, json, done) {
    try {
        var output = {};
        var chainer = new Sequelize.Utils.QueryChainer();
        chainer.add(this.artisan.find({where : {id : id}}))
               .add(ratings.rating.count({where : {entityId : id, entityType : entityTypes.entityType.ARTISAN }}));
        chainer.run()
            .success(function(results) {
                var artisan = results[0];
                var ratingCount = results[1];
                try {
                    //*** FORCE ERROR: results.addRating(ratings.rating.build({type : ratings.ratingType.ARTISAN, rating : json.rating}))
                    artisan.addRating(ratings.rating.build({entityType : entityTypes.entityType.ARTISAN, rating : json.rating}))
                        .complete(function(err, rating) {
                            ratingCount++;
                            if (ratingCount === 0) {
                                artisan.averageRating = json.rating;
                                artisan.save()
                                    .complete(function(err, res) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        done(null, res);
                                        return;
                                    });
                            } else {
                                var avg = artisan.averageRating + json.rating;
                                artisan.averageRating = avg / ratingCount;
                                artisan.save()
                                    .complete(function(err, res) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        done(null, res);
                                        return;
                                    });
                            }
                        });
                } catch (err) {
                    logger.error("Error adding rating", err, "artisan_db");
                    done(new error.ApiError("Unable to update ratings.", "artisan_db"));
                    return;
                }

            })
            .error(function(err) {
                logger.error("Error adding rating", err, "artisan_db");
                done(new error.ApiError("Unable to update ratings.", "artisan_db"));
                return;
            });

    } catch (err) {
        logger.error("Error adding rating", err, "artisan_db");
        done(new error.ApiError("Unknown error adding rating.", "artisan_db"));
        return;
    }
};

exports.findArtisan = function(id, done) {
    try {
        var output = {};
        this.artisan.find({where : {id : id}})
            .complete(function(err, result) {
                if (err) {
                    logger.error("Error finding artisan", err, "artisan_db")
                    done(new error.ApiError("Unable to find artisan.", "artisan_db"));
                    return;
                } else {
                    if (!result) {
                        done(new error.ApiError("Unable to find artisan.", "artisan_db"));
                        return;
                    }
                    done(null, result);
                    return;
                }
            });
    } catch (err) {
        logger.error("Error finding artisan", err, "artisan_db");
        done(new error.ApiError("Unable to find artisan.", "artisan_db"));
        return;
    }
};

function sanitizeArtisan(artisan) {
    var obj = {};

}