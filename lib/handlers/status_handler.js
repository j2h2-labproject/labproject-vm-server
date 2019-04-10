/*
 * Handles requests for server information and status
 */
var os = require("os");
var diskusage = require('diskusage');


var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";
var VERSION = require(LABPROJECT_BASE + "/version").VERSION;

var component_util = require(LABPROJECT_LIB + "/util/component_util");

var config = require(LABPROJECT_BASE + "/config");

var logger = null;
var pulse_on = false;

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
            case "resources":
                callback(null, resources());
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
        valid_commands = ['usage', 'systeminfo', 'debugdump', 'resources']
        return valid_commands.indexOf(command) !== -1;
    },
    start_pulse: start_pulse,
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

function resources() {
    var cpu_data = os.cpus();
    var raw_mem = os.totalmem();

    return {
        "cpu_count": cpu_data.length,
        "cpu_model": cpu_data[0].model,
        "total_mem": raw_mem - (raw_mem % 512)
    }
}

function debugdump(callback) {
    var dump_data = {
        "server_version": VERSION,
        "node_version": process.version,
        "libvirt_version": null,
        "openvswitch_version": null,
        "hypervisor": config.driver,
        "hypervisor_version": null
    }
    component_util.openvswitch_version(function(error, s_version){
        if (error) {
            callback(error, null);
            return;
        }
        dump_data.openvswitch_version = s_version;
        component_util.libvirt_version(function(error, l_version) {
            if (!error) {
                dump_data.libvirt_version = l_version;
            }
            

            var driver = null;

            try {
                driver = require(LABPROJECT_LIB + "/drivers/" + config.driver);
            } catch (e) {
                console.log(e);
                callback("Failed to load driver " + config.driver, null);
                return;
            }

            if (driver !== null) {
                driver.configure(config.driver_config, function(error, version) {
                    if (!error) {
                        dump_data.hypervisor_version = version;
                    }
                    callback(null, dump_data);
                });
            } else {
                callback(null, dump_data);
            }

            
        });
    });
}

function start_pulse(callee) {
    pulse_on = true;
    pulse(callee)
}

function pulse(callee) {
    setTimeout(function(){
        callee(null, usage());
        if (pulse_on) {
            pulse(callee);
        }
    }, 5000);
}