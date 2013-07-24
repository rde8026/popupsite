/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/23/13
 * Time: 5:44 AM
 * To change this template use File | Settings | File Templates.
 */

var Sequelize = require('sequelize')
    , logger = require('../logger/Logger')
    , error = require('../errors/ApiError')
    , connection = require('./db_conn')
    , headers = require('../routes/util/Headers')
    , keys = require('./Keywords')
    , images = require('./Images')
    , entities = require('./EntityType');


exports.role = connection.Connection.define('role', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , name : { type : Sequelize.STRING, unique : true, allowNull : false }
    },
    {
        charset : 'latin1'
    }
);


exports.roleTypes = {
    CUSTOMER : "CUSTOMER_ROLE"
    , MERCHANT : "MERCHANT_ROLE"
    , ARTISAN : "ARTISAN_ROLE"
    , ADMIN : "ADMIN_ROLE"
    , EMPLOYEE : "EMPLOYEE_ROLE"
};

exports.initRoles = function(done) {
    try {
        var array = [];
        for (var key in this.roleTypes) {
            array.push(this.roleTypes[key]);
        }
        checkRole(array, [], function(err, roles) {
            done(true);
        });
    } catch (err) {
        throw err;
    }
};

exports.getRoleByType = function(roleType, done) {
    this.role.find({where : {name : roleType}})
        .complete(function(err, role) {
            if (err) {
                done(err, null);
                return;
            }
            done(null, role);
            return;
        });
};

function checkRole(roles, sofar, done) {
    var Roles = require('./Roles');
    var r = roles.shift();
    if (typeof r == 'undefined' || !r) {
        done(null, sofar)
    } else {
        Roles.role.find({where : {name : r}})
            .complete(function(err, result) {
                if (err) {
                    throw err;
                } else if (!result) {
                    Roles.role.build({name : r})
                        .save()
                        .complete(function(err, result) {
                            if (err) {
                                throw err;
                            } else {
                                sofar.push(result);
                                checkRole(roles, sofar, done);
                            }
                        });
                } else {
                    sofar.push(result);
                    checkRole(roles, sofar, done);
                }
            });
    }
}