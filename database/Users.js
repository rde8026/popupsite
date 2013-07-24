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
    , webError = require('../errors/WebError')
    , connection = require('./db_conn')
    , headers = require('../routes/util/Headers')
    , roles = require('./Roles')
    , textMappings = require('../mappings/TextMappings')
    , entities = require('./EntityType');


exports.user = connection.Connection.define('user', {
        id : { type : Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false }
        , email : { type : Sequelize.STRING, unique : true, allowNull : false }
        , password : { type : Sequelize.STRING, allowNull : false }
        , firstName : { type : Sequelize.STRING, allowNull : false }
        , lastName : { type : Sequelize.STRING, allowNull : false }
    },
    {
        charset : 'latin1'
    },
    {
        instanceMethods: {
            hasRole : function(roleName) {
                var isValid = false;
                this.roles.forEach(function(role, index) {
                    if (role.name == roleName) {
                        isValid = true;
                    }
                }, this);
                return isValid;
            }
        }
    }
);


exports.createUser = function(json, roleTypes, done) {
    try {
        var self = this;
        var pwd = connection.genPassword(json.password);

        self.user.build({email : json.email, password : pwd, firstName : json.firstName, lastName : json.lastName})
            .save()
            .complete(function(err, user) {

                if (err) {
                    return done(err, null);
                }

                roles.role.findAll({where : {name : roleTypes}})
                    .complete(function(err, roles) {
                        if (err) {
                            user.destroy()
                                .complete(function(err, res) {
                                    return done(null, null);
                                });
                        }
                        user.setRoles(roles)
                            .complete(function(err, assco) {
                                if (err) {
                                    return done(err, null);
                                }
                                getUserRoles(user, done);
                            });
                    });
            });

    } catch (err) {
        logger.error(err, null, "users_db");
        done(err, null);
    }
};

exports.updateUser = function(id, firstName, lastName, password, done) {
    try {
        this.user.find({where : {id : id}})
            .complete(function(err, user) {
                if (err) {
                    logger.error(err, {firstName : firstName, lastName : lastName}, "update_user_db");
                    return done(err, null);
                }
                user.firstName = firstName;
                user.lastName = lastName;
                if (password) {
                    user.password = connection.genPassword(password);
                }
                user.save()
                    .complete(function(err, updated) {
                        if (err) {
                            logger.error(err, {firstName : firstName, lastName : lastName}, "update_user_db");
                            return done(err, null);
                        }
                        return done(null, updated);
                    });
            });
    } catch (err) {
        logger.error(err, {firstName : firstName, lastName : lastName}, "update_user_db");
        return done(err, null);
    }
};

exports.addRoleToUser = function(id, roleType, done) {
    try {
        var that = this;
        roles.getRoleByType(roleType, function(err, role) {
            that.user.find(id)
                .complete(function(err, user) {
                    if (err) {
                        logger.error(err, null, "users_db");
                        done(err, null);
                        return;
                    }
                    user.addRole(role)
                        .complete(function(err, r) {
                            if (err) {
                                logger.error(err, null, "users_db");
                                done(err, null);
                            }
                            done(null, user);
                        });
                });
        });

    } catch (err) {
        logger.error(err, null, "users_db");
        done(err, null);
    }
};

exports.removeRollFromUser = function(user, roleType, done) {
    var self = this;
    try {
        user.getRoles()
            .complete(function(err, roles) {
                if (err) {
                    logger.error(err, null, "removeRoleFromUserGetRoles");
                    return done(err, null);
                }
                var properRoles = [];
                roles.forEach(function(role, index) {
                    if (role.name != roleType) {
                        properRoles.push(role);
                    }
                }, this);
                user.setRoles(properRoles)
                    .complete(function(err, results) {
                        if (err) {
                            logger.error(err, null, "removeRoleQuery");
                            return done(err, false);
                        }
                        return done(null, false);
                    });
            });
    } catch (err) {
        logger.error(err, null, "removeRoleFromUser");
        return done(err, null);
    }
};

exports.findUserById = function(id, done) {
    try {
        this.user.find({where : {id : id}, include: ['Roles']})
            .complete(function(err, user) {
                if (err) {
                    logger.error(err, null, "users_db");
                    return done(err, null);
                }
                return done(null, user);
            });

    } catch (err) {
        logger.error(err, null, "users_db");
        return done(err, null);
    }
};

exports.findFullUser = function(id, done) {
    try {
        this.user.find({where : {id : id}, include: ['Roles','ArtisanProfile']})
            .complete(function(err, user) {
                if (err) {
                    logger.error(err, null, "users_db");
                    return done(err, null);
                }
                return done(null, user);
            });

    } catch (err) {
        logger.error(err, null, "users_db");
        done(err, null);
    }
};

exports.verifyOldPassword = function(oldPassword, user, done) {
    if (!oldPassword || !user) {
        done(new error.ApiError(textMappings.message.USER_UPDATE_PASSWORD_MISSING_DATA), "user_db");
    }
    if (connection.comparePwd(oldPassword, user.password)) {
        done(null, true);
    } else {
        done(null, false);
    }
};

exports.loginUser = function(email, password, done) {
    try {
        this.user.find({where : {email : email}, include: ['Roles']})
            .complete(function(err, user) {
                if (err) {
                    logger.error(err, {email : email}, "users_db");
                    return done(err, null);
                }
                if (user) {
                    if (connection.comparePwd(password, user.password)) {
                        var d = {
                            id : user.id
                            , email : user.email
                            , firstName : user.firstName
                            , lastName : user.lastName
                            , roles : user.roles
                        };
                        return done(null, d);
                    } else {
                        return  done(new webError.WebError("User not found", null, headers.head.NOT_FOUND), null);
                    }
                } else {
                    return done(new webError.WebError("User not found", null, headers.head.NOT_FOUND), null);
                }
            });
    } catch (err) {
        logger.error(err, {email : email}, "users_db");
        return done(err, null);
    }
};

function getUserRoles(user, done) {
    var u = sanitizeUser(user);
    user.getRoles()
        .complete(function(err, roles) {
            if (err) {
                logger.error(err, null, "users_db");
                done(err, null);
                return;
            }
            var rs = [];
            roles.forEach(function(role, index) {
                rs.push(sanitizeRole(role));
            }, this);

            u.roles = rs;
            done(null, u);
        });
}

function sanitizeUser(user) {
    var u = {};
    u.id = user.id;
    u.password = user.password;
    u.email = user.email;
    u.firstName = user.firstName;
    u.lastName = user.lastName;
    return u;
}

function sanitizeRole(role) {
    var r = {};
    r.name = role.name;
    return r;
}

function addUserRoles(user, rs, done) {
    var r = rs.shift();
    var self = this;
    if (typeof r == 'undefined') {
        done(null, user);
    } else {
        roles.getRoleByType(r, function(err, role) {
            user.addRole(role)
                .success(function(res) {
                    addUserRoles(user, rs, done);
                })
                .error(function(err) {
                    return done(err, null);
                });
        });
    }
}