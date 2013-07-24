/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/28/13
 * Time: 8:23 PM
 */

var logger = require('../logger/Logger')
    , headers = require('./util/Headers')
    , textMappings = require('../mappings/TextMappings')
    , user_db = require('../database/Users')
    , roles = require('../database/Roles')

    , passport = require('passport');

exports.login = function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return res.json(headers.head.BAD_REQUEST, {errorMessage : err});
        }
        if (!user) {
            return res.json(headers.head.NOT_FOUND, {errorMessage : "No user found"});
        }
        req.logIn(user, function(err) {
            if (err) {
                return res.json(headers.head.BAD_REQUEST, {errorMessage : err});
            }
            return res.json(user);
        });
    })(req, res, next);
};

exports.ping = function(req, res) {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.json(499, {success : "NO"});
    }
};

exports.findLoggedInUser = function(req, res) {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        //TODO: Fix this so it makes sense for new users plus existing user and
        res.json(489, null);
    }
};

exports.userLogout = function(req, res) {
    req.logout();
    res.json({success : true});
};

exports.createUser = function(req, res) {

    try {
        var self = this;
        var email = req.body.email;
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var password = req.body.password;
        var confirm = req.body.confirm;

        if (password !== confirm) {
            res.json(headers.head.BAD_REQUEST, {errorMessage : textMappings.message.PASSWORD_DO_NOT_MATCH});
            return;
        }
        user_db.createUser({email : email, firstName : firstName, lastName : lastName, password : password}, [roles.roleTypes.CUSTOMER], function(err, user) {
            if (err) {
                var message;
                if (err.code) {
                    message = textMappings.sqlUserErrorMappings[err.code];
                }
                logger.error(null, err, "user_web");
                var m = (message) ? message : textMappings.message.GENERAL_ACCOUNT_CREATION_ERROR;
                res.json(headers.head.BAD_REQUEST, {errorMessage : m});
                return;
            }
            req.logIn(user, function(err) {
                if (err) {
                    res.json({user : user});
                    return;
                }
            });
            res.json({user : user});
            return;
        });
    } catch (err) {
        logger.error(null, err, "user_web");
        res.json(headers.head.BAD_REQUEST, {errorMessage : textMappings.message.GENERAL_ACCOUNT_CREATION_ERROR});
        return;
    }

};

exports.updateUser = function(req, res) {
    try {
        var userId = req.params.userId, firstName, lastName, password;
        if (req.body.firstName) {
            firstName = req.body.firstName;
        }
        if (req.body.lastName) {
            lastName = req.body.lastName;
        }
        if (req.body.password) {
            password = req.body.password;
        }
        user_db.updateUser(userId, firstName, lastName, password, function(err, user) {
            if (err) {
                return res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.UPDATE_USER_ERROR});
            }
            res.json(user);
        });
    } catch (err) {
        logger.error(err, req, "update_user_ws");
        res.json(headers.head.SERVER_ERROR, {errorMessage : textMappings.message.UPDATE_USER_ERROR});
    }
}