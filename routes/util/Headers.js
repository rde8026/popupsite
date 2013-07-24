/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 1/15/13
 * Time: 11:18 PM
 * To change this template use File | Settings | File Templates.
 */

exports.head = {
    BAD_REQUEST : 400
    , UNAUTHORIZED : 401
    , SERVER_ERROR : 500
    , OK : 200
    , FORBIDDEN : 403
    , METHOD_NOT_ALLOWED : 405
    , GONE : 410
    , NOT_IMPLEMENTED : 501
    , SERVICE_UNAVAILABLE : 503
    , NOT_FOUND : 404
};

exports.statusHeader = {
    BAD_REQUEST : ['Status-Code', 400]
};

exports.contentType = {
    PLAIN_TEXT : ['Content-Type', 'text/plain']
    , HTML : ['Content-Type', 'text/html']
    , JSON : ['Content-Type', 'application/json']
};