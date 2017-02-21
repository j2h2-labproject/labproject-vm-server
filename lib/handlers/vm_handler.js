/*
 * Handles requests for virtual machine management
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');

var logger = null;

var os = require("os");

module.exports = {
	set_logger: function(input_logger) {
		logger = input_logger;
	},
	/*
	 * Handles requests
	 */
	handle: function(command, params, callback) {

		// Load driver
		var driver = null;

		try {
			driver = require(LABPROJECT_LIB + "/drivers/" + config.driver);
		} catch (e) {
			console.log(e);
			callback("Failed to load driver " + config.driver, null);
			return;
		}

		if (driver === null) {
			callback("No driver loaded", null);
			return;
		}

		driver.configure(config.driver_config, function(error, status) {
			switch (command) {
				case "vm_exists":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.vm_exists(params['uuid'], callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "create_vm":
					if (is_valid_config(params['config'])) {
						var vm_config = insert_variables(params['config']);
						driver.create_vm(vm_config, callback);
					} else {
						callback("Invalid config", null);
					}
					break;
				case "delete_vm":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.delete_vm(params['uuid'], callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "clone_vm":
					if (!params.uuid || ! string_util.is_uuid(params.uuid)) {
						callback("Invalid UUID", null);
					} else if (!params.new_uuid || ! string_util.is_uuid(params.new_uuid)) {
						callback("Invalid new UUID", null);
					} else if (!params.new_name) {
						callback("Invalid new name", null);
					} else {
						var new_name = sanitize.simple_string(params.new_name);
						driver.clone_vm(params.uuid, params.new_uuid, new_name, {}, callback);
					}
					break;
				case "start_vm":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.start_vm(params['uuid'], callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "update_vm":
					if (params['uuid'] && string_util.is_uuid(params['uuid']) && is_valid_config(params['config'])) {
						var vm_config = insert_variables(params['config']);
						driver.update_vm(params['uuid'], vm_config, callback);
					} else {
						callback("Invalid config", null);
					}
					break;
				case "stop_vm":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.stop_vm(params['uuid'], callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "vm_is_running":
					if (params['uuid']  && string_util.is_uuid(params['uuid'])) {
						driver.vm_is_running(params['uuid'], callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "make_vm_snapshot":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						if (!params['snapshot_name']) {
							callback("Snapshot name not set");
						} else {
							driver.make_vm_snapshot(params['uuid'], sanitize.simple_string(params['snapshot_name']), callback);
						}
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "restore_vm_snapshot":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.restore_vm_snapshot(params['uuid'], sanitize.simple_string(params['snapshot_name']), callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				case "delete_vm_snapshot":
					if (params['uuid'] && string_util.is_uuid(params['uuid'])) {
						driver.delete_vm_snapshot(params['uuid'], sanitize.simple_string(params['snapshot_name']), callback);
					} else {
						callback("Invalid UUID", null);
					}
					break;
				default:
					callback("Function not implemented", null);
					break;
			}
		});





	},
	handles: function(command) {
		valid_commands = ['vm_exists', 'create_vm', 'delete_vm', 'list_snapshots', 'start_vm', 'stop_vm', 'vm_is_running', 'suspend_vm', 'update_vm', 'get_vm_config', 'restore_vm_snapshot', 'make_vm_snapshot', 'delete_vm_snapshot', 'vm_console', 'attach_vm_drive', 'detach_vm_drive']
		return valid_commands.indexOf(command) !== -1;
	}
}

function is_valid_config(config_obj) {
	if (config_obj == undefined || config_obj === null) {
		return false;
	} else {
		var required_params = ['hypervisor', 'name', 'uuid', 'mem_size', 'cpu_count'];
		return true;
	}
}

function insert_variables(input) {

	var temp = JSON.stringify(input);

  	interface_list = os.networkInterfaces();

	selected_address = null;

	if (interface_list.hasOwnProperty(config.external_interface)) {
		var interface = interface_list[config.external_interface];
		for (var i = 0; i < interface.length && selected_address === null; i++) {
		if (interface[i].family =="IPv4" && interface[i].internal == false) {
			selected_address = interface[i].address;
		}
		}
	}

	temp = temp.replace("{SERVER_IP}", selected_address);
	temp = temp.replace("{ISO_POOL}", config.iso_path);
	temp = temp.replace("{STORAGE_POOL}", config.pool_path);
	return JSON.parse(temp);
}
