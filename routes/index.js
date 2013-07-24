
/*
 * GET home page.
 */

var fs = require('fs');

exports.index = function(req, res){
    /*fs.readFile(__dirname + '/public/index.html', 'utf8', function(err, text){
        res.send(text);
    });*/
    console.log("OK");
    res.json({blah : "blah"});
};