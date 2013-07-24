/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/15/13
 * Time: 1:42 PM
 */


var Sequelize = require('sequelize')
    , db_connection = require('./db_conn');

exports.rating = db_connection.Connection.define('rating', {
        id : {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        //, type : {type: Sequelize.STRING, notNull : true, notEmpty: true}
        , rating : {type : Sequelize.FLOAT, allowNull : false}
        , entityId : { type : Sequelize.INTEGER, allowNull : false }
        , entityType : { type : Sequelize.STRING, allowNull : false }
        //TODO: Add user to review
    },
    {
        underscored: true
        , paranoid: true
    }

);