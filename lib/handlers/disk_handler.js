/*
 * Handles requests for hard drive images
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/util/hypervisor_util");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');
var command = require(LABPROJECT_LIB + "/common/command");

var os = require("os");
var fs = require("fs");
var diskusage = require("diskusage");

var logger = null;

module.exports = {
    set_logger: function(input_logger) {
        logger = input_logger;
    },
    /*
     * Handles requests
     */
    handle: function(command, params, callback) {
        try {
            switch (command) {
                case "get_disk_space":
                    get_disk_space(callback);
                    break;
                case "disk_exists":
                    disk_exists(params['diskpath'], callback);
                    break;
                case "create_disk":
                    create_disk(params['diskname'], params['size'], params['format'], callback);
                    break;
                case "remove_disk":
                    remove_disk(params['diskpath'], callback);
                    break;
                case "disk_info":
                    disk_info(params['diskpath'], callback);
                    break;
                default:
                    callback("Function not implemented", null);
                    break;
            }
        } catch (err) {
            console.log(err);
            callback("Parameters not set", null);
        }
    },
    handles: function(command) {
        valid_commands = ['get_disk_space', 'disk_exists', 'create_disk', 'clone_disk', 'remove_disk', 'resize_disk', 'disk_info']
        return valid_commands.indexOf(command) !== -1;
    }
}


function convert_to_mb(value) {
    var unit = "m";
    if (!Number.isInteger(value)) {
        value = value.toLowerCase();
        if (value.substring(value.length-1,value.length).match(/[a-z]/)) {
            unit = value.substring(value.length-1,value.length);
            value = parseInt(value.substring(0, value.length-1));
        } else {
            value = parseInt(value);
        }
    } 

    if (unit == "z") {
        value *= 1024 * 1024 * 1024;
    } else if (unit == "t") {
        value *= 1024 * 1024;
    } else if (unit == "g") {
        value *= 1024;
    } else if (unit == "k") {
        value /= 1024;
    } else if (unit == "b") {
        value /= (1024 * 1024) ;
    } 

    return value;
}


function get_disk_space(callback) {
    diskusage.check(config.pool_path, function(error, info) {

        if (!error) {

            DIV = 1024;

            for (item in info) {
                info[item] = convert_to_mb(info[item]);
            }

            console.log(info);

            callback(null, info);
        } else {
            callback("Could not get disk space statistics", null);
        }
    });
}

function disk_exists(disk_path, callback) {
    if (disk_path === undefined) {
        callback("Disk name is not set", null);
    } else {
        callback(null, fs.existsSync(disk_path));
    }
}


function create_disk(name, size, format, callback) {
    if (name === undefined || size === undefined || format === undefined) {
        callback("Config not set", null);
        return;
    } 

    console.log(name);
    console.log(size);

    name = sanitize.simple_string(name);

    if (!Number.isSafeInteger(size)) {
        callback("Invalid size", null);
        return;
    }
    if (!is_hd_type(format)) {
        callback("Invalid format", null);
        return;
    }

    var disk_path = config.pool_path + "/" + name + "." + format;
    
    if (fs.existsSync(disk_path)) {
        callback("Disk already exists", null); 
    } else {
        command.run("qemu-img", ["create", "-f", format, disk_path, size + "M"], function(error, stdout, stderr) {
            if (error) {
                callback("Failed to create disk: " + error.message, null);
            } else {
                callback(null, disk_path);
            }
        });
    }
}

function clone_disk(hypervisor, disk_path, clone_xml_config) {

}

function remove_disk(disk_path, callback) {

    if (disk_path === undefined) {
        callback("Disk name is not set", null);
    } else {
        command.run("rm", [disk_path], function(error, stdout, stderr) {
            console.log(error);
            if (error) {
                callback("Failed to remove disk", null);
            } else {
                callback(null, true);
            }
        });
    }
}

function disk_info(disk_path, callback) {
    if (disk_path === undefined) {
        callback("Disk name is not set", null);
    } else {
        if (!fs.existsSync(disk_path)) {
            callback("Disk not found", null);
            return;
        }
        command.run("qemu-img", ["info", disk_path], function(error, stdout, stderr) {
            if (error) {
                callback("Failed to get disk info", null);
            } else {
                var return_data = {
                    "format": "",
                    "capacity": 0,
                    "allocation": 0
                }
                for (var i=0 ; i<stdout.length; i++) {
                    var line = stdout[i].trim();
                    if (line != "") {
                        var line_split = line.split(":");
                        var key = line_split[0].trim();
                        var value = line_split[1].trim();
                        if (key == "virtual size") {
                            return_data['capacity'] = convert_to_mb(value.split(" ")[0]);
                        } else if (key == "file format") {
                            return_data['format'] = value;
                        } else if (key == "disk size") {
                            return_data['allocation'] = convert_to_mb(value);
                        }
                    }
                    
                }
                callback(null, return_data);
            }
        });
    }
}

function is_hd_type(value) {
    var valid_disks = ['raw','bochs','cloop','cow','dmg','iso','qcow','qcow2','qed','vmdk','vpc', 'vdi'];

    if (valid_disks.indexOf(value)!=-1) {
        return true;
    } else {
        return false;
    }
}