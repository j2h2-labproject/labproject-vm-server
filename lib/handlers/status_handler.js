/*
 * Handles requests for server information and status
 */
var os = require("os");
var diskusage = require('diskusage');


var LABPROJECT_BASE = process.cwd();
var VERSION = require(LABPROJECT_BASE + "/version").VERSION;

var logger = null;

module.exports = {
    set_logger: function(input_logger) {
        logger = input_logger;
    },
    handle: function(command, params, callback) {
        switch (command) {
            case "systeminfo":
                callback(null, systeminfo());
                break;
            case "usage":
                callback(null, usage());
                break;
            default:
                callback("Function not implemented", null);
                break;
        }
    },
    handles: function(command) {
        valid_commands = ['usage', 'systeminfo']
        return valid_commands.indexOf(command) !== -1;
    },
    systeminfo: systeminfo,
    usage: usage
}

function systeminfo() {
    return {
        "version": VERSION,
        "uptime": os.uptime(),
        "system": os.platform(),
        "release": os.release(),
        "hostname": os.hostname()
    };
}

function usage() {
    return {
        "total": os.totalmem(),
        "free": os.freemem(),
        "load_avg": os.loadavg(),
        "cpu_data": os.cpus()
    }
}
