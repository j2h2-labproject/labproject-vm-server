/*
 * Handles requests for various network-related actions
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var string_util = require(LABPROJECT_LIB + "/common/string");
var sanitize = require(LABPROJECT_LIB + "/common/sanitize");
var command = require(LABPROJECT_LIB + "/common/command");
var interface_util = require(LABPROJECT_LIB + "/util/interfaces");

var os = require("os");

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
				case "create_tap_interface":
					interface_util.create_tap_interface(params['interface'], callback);
					break;
				case "remove_tap_interface":
					interface_util.remove_tap_interface(params['interface'], callback);
					break;
				case "interface_exists":
					interface_exists(params['interface'], callback);
					break;
				case "allocate_interface_group":
					allocate_interface_group(params['group_num'], callback);
					break;
				case "deallocate_interface_group":
					deallocate_interface_group(params['group_num'], callback);
					break;
				default:
					callback("Function not implemented", null);
					break;
			}
		} catch (err) {
			callback("Parameters not set", null);
		}

	},
	handles: function(command) {
		valid_commands = ['create_tap_interface', "remove_tap_interface", "create_external_interface", "allocate_interface_group",
		"deallocate_interface_group", "interface_exists"];
		return valid_commands.indexOf(command) !== -1;
	}
}

function interface_exists(name, callback) {
	if (name === undefined) {
		callback("No interface name set", null);
	} else {
		name = sanitize.simple_string(name);

		command.run("sudo", ["ip", "addr", "show", name], function(error, stdout, stderr) {
			if (!error) {
				callback(null, true);
			} else {
				if (error.message.indexOf("does not exist") != -1) {
					callback(null, false);
				} else {
					callback(error, null);
				}

			}

		});
	}
}

// Each lab will request a group of interfaces identified by the group_num, lpifX. Interfaces for VMs will be lpifX.Y
function allocate_interface_group(group_num, callback) {
  if (group_num === undefined || isNaN(parseInt(group_num))) {
		callback("Invalid group number", null);
  } else {
    group_num = parseInt(group_num);
    if (group_num > 99999) {
      callback("Invalid group number", null);
    } else {
      interface_util.create_tap_interface("lpif" + group_num, function(error, result) {
        if (!error) {
          callback(null, true);
        } else {
          callback("Could not allocate group", null);
        }
      });
    }
  }
}

function deallocate_interface_group(group_num, callback) {
	if (group_num === undefined || isNaN(parseInt(group_num))) {
		callback("Invalid group number", null);
  } else {
    group_num = parseInt(group_num);
    if (group_num > 99999) {
      callback("Invalid group number", null);
    } else {
      interface_util.remove_tap_interface("lpif" + group_num, function(error, result) {
        if (!error) {
          callback(null, true);
        } else {
          callback("Could not allocate group", null);
        }
      });
    }
  }
}
