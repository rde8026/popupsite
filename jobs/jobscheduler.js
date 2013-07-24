/**
 * Created with JetBrains WebStorm.
 * User: ryaneldridge
 * Date: 2/10/13
 * Time: 9:48 PM
 * To change this template use File | Settings | File Templates.
 */


var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();
rule.minute = 6;

exports.geoCodeArtisanProfiles = function() {
    schedule.scheduleJob(rule, function() {
        console.log("********* I FIRED **********");
    });
};



