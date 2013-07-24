/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/15/13
 * Time: 10:49 PM
 * To change this template use File | Settings | File Templates.
 */


exports.ApiError = function(msg, clazz) {
    this.clazz = clazz;
    this.msg = msg;
};

exports.ApiError = function(msg, clazz, status) {
    this.clazz = clazz;
    this.msg = msg;
    this.status = status;
};

this.ApiError.prototype = new Error();
this.ApiError.constructor = this.ApiError;