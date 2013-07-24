/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/22/13
 * Time: 11:13 AM
 */


exports.WebError = function(msg, obj) {
    this.msg = msg;
    this.obj = obj;
};

exports.WebError = function(msg, obj, status) {
    this.msg = msg;
    this.obj = obj;
    this.status = status;
};

/*this.WebError.prototype = new Error();
this.WebError.constructor = this.WebError;*/
