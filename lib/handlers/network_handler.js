/*
 * Handles requests for various network-related actions
 */
 
var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var string_util = require(LABPROJECT_LIB + "/common/string");
var sanitize = require(LABPROJECT_LIB + "/common/sanitize");
var command = require(LABPROJECT_LIB + "/common/command");

var os = require("os");

module.exports = {
	/*
	 * Handles requests
	 */ 
	handle: function(command, params, callback) {
		try {
			switch (command) {
				case "create_tap_device":
					create_tap_device(params['devicename'], callback);
					break;
				case "remove_tap_device":
					remove_tap_device(params['devicename'], callback);
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
		valid_commands = ['create_tap_device', "remove_tap_device"]
		return valid_commands.indexOf(command) !== -1;
	}
}


function create_tap_device(name, callback) {
	
	if (name === undefined) {
		callback("No device name set", null);
	} else {
		name = sanitize.simple_string(name);
	
		command.run("sudo", ["ip", "tuntap", "add", "dev", name, "mode", "tap"], function(error, stdout, stderr) {
			if (!error) {
				callback(null, true);
			} else {
				callback("Could not create tap device", null);
			}
			
		});
	}
}

function remove_tap_device(name, callback) {
	
	if (name === undefined) {
		callback("No device name set", null);
	} else {
		name = sanitize.simple_string(name);
	
		command.run("sudo", ["ip", "link", "delete", name], function(error, stdout, stderr) {
			if (!error) {
				callback(null, true);
			} else {
				callback("Could not remove tap device", null);
			}
			
		});
	}
}
