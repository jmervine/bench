var path = require('path');

module.exports = {
    debug: function(message) {
        if (process.env.DEBUG) {
            console.log('[DEBUG]: ' + message);
        }
    },

    debug_as_json: function(message) {
        if (process.env.DEBUG) {
            console.log('[DEBUG]: start json object ');
            console.log(JSON.stringify(obj, null, 2));
            console.log('[DEBUG]: end json object ');
        }
    },

    json: function(obj) {
        return JSON.stringify(obj, null, 4);
    },

    url: function(settings) {
        return 'http://'+path.join(settings.host, settings.path);
    },

};
