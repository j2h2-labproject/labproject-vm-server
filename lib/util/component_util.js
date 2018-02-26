/*
 * Module: component_util
 * 
 * Does common component functions
 * 
 */
 
var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";
 
var fs = require("fs");
var libvirt = require("libvirt");
var command = require(LABPROJECT_LIB + "/common/command");

module.exports = {
    openvswitch_version: function(callback) {
        command.run("ovs-vsctl", ["--version"], function(error, stdout, stderr) {
            if (!error) {
                var top_line = stdout[0].split(" ");
                callback(null, top_line[top_line.length-1]);
            } else {
                callback("Failed to get ovs-vsctl command", null);
            }
        });
    },
    libvirt_version: function(callback) {
        command.run("libvirtd", ["--version"], function(error, stdout, stderr) {
            if (!error) {
                var top_line = stdout[0].split(" ");
                callback(null, top_line[top_line.length-1]);
            } else {
                callback("Failed to get libvirtd command", null);
            }
        });
    }
}
