/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/28/13
 * Time: 6:43 PM
 */

var _ = require('underscore')._;

exports.verifyAuthentication = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.json(401, {errorMessage : "user not authenticated"});
};

exports.hasAllRoles = function(roles) {
    return function(req, res, next) {
        var isMemberOf = false;
        req.user.getRoles()
            .complete(function(err, userRoles) {
                var names = mapRolesToRawNames(userRoles);
                if (err) {
                    return res.json(403, {errorMessage : "Forbidden"});
                }
                roles.forEach(function(role, index){
                    isMemberOf = _.contains(names, role);
                } , this);
                if (isMemberOf) {
                    return next();
                } else {
                    return res.json(403, {errorMessage : "Forbidden"});
                }
            });
    };
};

function mapRolesToRawNames(userRoles) {
    var names = [];
    userRoles.forEach(function(r, index) {
        names.push(r.name);
    }, this);
    return names;
}