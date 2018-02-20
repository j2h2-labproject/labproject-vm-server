/*
 * Handles requests for server information and status
 */
var os = require("os");
var diskusage = require('diskusage');


var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";
var VERSION = require(LABPROJECT_BASE + "/version").VERSION;

var component_util = require(LABPROJECT_LIB + "/util/component_util");

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
            case "debugdump":
                debugdump(callback);
                break;
            default:
                callback("Function not implemented", null);
                break;
        }
    },
    handles: function(command) {
        valid_commands = ['usage', 'systeminfo', 'debugdump']
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

function debugdump(callback) {
    var dump_data = {
        "server_version": VERSION,
        "node_version": process.version,
        "libvirt_version": null,
        "openvswitch_version": null
    }
    component_util.openvswitch_version(function(error, s_version){
        if (error) {
            callback(error, null);
            return;
        }
        dump_data.openvswitch_version = s_version;
        component_util.libvirt_version(function(error, l_version) {
            if (error) {
                callback(error, null);
                return;
            }
            dump_data.libvirt_version = l_version;
            callback(null, dump_data);
        });
    });
}
