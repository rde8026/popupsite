/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/23/13
 * Time: 12:09 PM
 */

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy
    , logger = require('../logger/Logger')
    , user_db = require('../database/Users');

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        user_db.loginUser(email, password, function(err, user) {
            if (err) {
                logger.error(null, {err : err, email : email}, "webauthentication");
                return done(null, null);
            }
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    user_db.findUserById(id, function(err, user) {
        done(err, user);
    });
});