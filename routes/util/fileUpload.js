/**
 * Created with IntelliJ IDEA.
 * User: reldridge1
 * Date: 1/30/13
 * Time: 10:02 PM
 */

var fs = require('fs')
    , headers = require('./Headers')
    , config = require('../../config/config').env();

exports.supportTempPath = function(req, res) {
    var path = req.query['path'];
    var type = req.query['type'];

    if (path) {
        fs.readFile(__dirname + "/../../" + path, function(err, data) {
            if (err) {
                return res.send(404, "no data");
            }
            res.writeHead(200, {'Content-Type' : 'image/' + type});
            res.end(data, 'binary');
        });
    } else {
        res.send(404, "no data");
    }
};

exports.fileUpload = function(req, res) {
    if (req.files && req.files.files) {
        if (req.files.files.length > 0) {
            var path = req.files.files[0].path;
            var type = req.files.files[0].type;
            type = type.substr(type.indexOf('/') + 1, type.length);
            res.json({url : config.urlPrefix + '/images/temp/image?path=' + path + '&type=' + type, filePath : path});
        } else {
            res.json(headers.head.BAD_REQUEST, {errorMessage : "No file uploaded"});
        }
    } else {
        res.json(headers.head.BAD_REQUEST, {errorMessage : "No file uploaded"});
    }
};

exports.deleteTempFile = function(req, res) {
    var path = req.query['path'];
    if (path) {
        fs.unlink(path, function(err) {
            if (err) {
                logger.error(err, null, "deleteTempFile");
                return res.json(headers.head.SERVER_ERROR, {errorMessage : "Sorry we couldn't delete your file"});
            }
            return res.json({message : "File removed"});
        });
    }
};

exports.checkExtension = function(filePath) {
    var extension = filePath.substr(filePath.indexOf("."), filePath.length);
    if (extension.toLowerCase() == ".png" || extension.toLowerCase() == ".jpg") {
        return true;
    } else {
        return false;
    }
};