/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/19/13
 * Time: 12:11 PM
 * To change this template use File | Settings | File Templates.
 */


var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , solr = require('solr-client')
    , connection = require('./db_conn');

function generateQuery(term, entityType) {
    var limiter = '';
    if (entityType) {
        limiter = " AND entityType = '" + entityType + "'";
    }
    return "SELECT entityId as ENTITY_ID, entityType as ENTITY_TYPE, MATCH(value) AGAINST ('" + term + "') as SCORE, COUNT(IF(MATCH (value) AGAINST ('" + term + "' IN NATURAL LANGUAGE MODE), 1, NULL)) as COUNT FROM keywords WHERE MATCH(value) against ('" + term + "' IN NATURAL LANGUAGE MODE)" + limiter;
}

var pagingCount = 20;

exports.keyword = connection.Connection.define('keyword', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , entityId : { type : Sequelize.INTEGER, allowNull : false }
        , entityType : { type : Sequelize.STRING, allowNull : false }
        , title : { type : Sequelize.STRING, allowNull : true }
        , description : { type : Sequelize.TEXT, allowNull : true }
        , keywords : { type : Sequelize.STRING, allowNull : true }
    },
    {
        charset: 'latin1'
    }
);


exports.searchKeywords = function(term, entityType, start, end, done) {
    logger.debug("Searching for keywords", term, "keywords_db");
    try {
        var response = {};
        var query_str = '(s_name:' + term + ' OR s_description:' + term + ' OR s_keywords:' + term + ') AND entityType : ' + entityType;
        var client = solr.createClient();
        var query = client.createQuery()
            .q(query_str)
            .start(start)
            .rows(end);
        client.search(query, function(err, obj) {
            if (err) {
                logger.error(err, null, "keywords_db");
                done(err, null);
                return;
            }
            response.totalCount = obj.response.numFound;
            response.docs = obj.response.docs;
            done(null, response);
            return;
        });
    } catch (err) {
        logger.error(err, null, "keywords_db");
        done(err, null);
        return;
    }
};

exports.addKeywords = function(keywords, entityId, entityType, done) {
    try {
        var client = solr.createClient();
        client.autoCommit = true;

        logger.debug("Adding keywords to product " + entityId, "product_db");
        if (keywords) {
            this.keyword.build({entityId : entityId, entityType : entityType, title : keywords.title, description : keywords.description, keywords : keywords.keywords})
                .save()
                .complete(function(err, result) {
                    if (err) {
                        done(err, null);
                        return;
                    }
                    var doc = {
                        id : result.id
                        , entityId : entityId
                        , entityType : entityType
                        , s_name : result.title
                        , s_description : result.description
                        , s_keywords : result.keywords
                    };
                    client.add(doc, function(err, obj) {
                        if (err) {
                            logger.error(err, doc, "keywords_db");
                            done(err, null);
                            return;
                        }
                        logger.debug(null, obj, "keywords_db");
                        done(null, doc);
                        return;
                    });
                });

        } else {
            done(null, null);
            return;
        }
    } catch (err) {
        done(err, null);
        return;
    }
};

exports.updateKeywords = function(keywords, entityId, entityType, done) {
    try {
        var client = solr.createClient();
        client.autoCommit = true;
        this.keyword.find({where : {entityId: entityId, entityType: entityType}})
            .complete(function(err, keyword) {
                if (keywords.title) {
                    keyword.title = keywords.title;
                }
                if (keywords.description) {
                    keyword.description = keywords.description;
                }
                if (keywords.keywords) {
                    keyword.keywords = keywords.keywords;
                }
                keyword.save()
                    .complete(function(err, result) {
                        var doc = {
                            id : result.id
                            , entityId : entityId
                            , entityType : entityType
                            , s_name : result.title
                            , s_description : result.description
                            , s_keywords : result.keywords
                        };
                        client.add(doc, function(err, obj) {
                            if (err) {
                                logger.error(err, doc, "keywords_db");
                                done(err, null);
                                return;
                            }
                            logger.debug(null, obj, "keywords_db");
                            done(null, doc);
                            return;
                        });
                    });
            });
    } catch (err) {
        done(err, null);
        return;
    }
};

exports.removeKeywords = function(entityId, entityType, done) {
    try {
        var client = solr.createClient();
        client.autoCommit = true;
        this.keyword.find({where : {entityId: entityId, entityType: entityType}})
            .complete(function(err, result) {
                if (err) {
                    logger.error(err, null, "keywords_db_remove");
                    return done(err, null);
                }
                if (result) {
                    result.destroy()
                        .complete(function(err, del) {
                            if (err) {
                                logger.error(err, null, "keywords_db");
                                return done(err, null);
                            }

                            client.delete('id', result.id, function(err, obj) {
                                if (err) {
                                    logger.debug(null, err, "");
                                    return done(err, null);
                                }
                                return done(null, obj);
                            });
                        });
                } else {
                    return done(null, null);
                }
            });


    } catch (err) {
        logger.error(err, null, "keywords_db");
        done(err, null);
        return;
    }
};
