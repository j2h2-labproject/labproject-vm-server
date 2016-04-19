/*
 * Handles requests virtual machines
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");

var os = require("os");



module.exports = {
	/*
	 * Handles requests
	 */
	handle: function(command, params, callback) {
		hypervisor_util.get_hypervisor(config.hypervisor, function(error, hypervisor) {
			if (!error) {

				var on_done = function(error, result) {
					hypervisor_util.disconnect_hypervisor(hypervisor);
					callback(error, result);
				}


				switch (command) {
					case "vm_exists":
						vm_exists(hypervisor, params['uuid'], on_done);
						break;
					case "create_vm":
						create_vm(hypervisor, params['xmlconfig'], on_done);
						break;
					case "delete_vm":
						delete_vm(hypervisor, params['uuid'], on_done);
						break;
					default:
						on_done("Function not implemented", null);
						break;
				}


			} else {
				callback(error, null);
			}
		});


	},
	handles: function(command) {
		valid_commands = ['vm_exists', 'create_vm', 'delete_vm', 'list_snapshots', 'start_vm', 'stop_vm', 'suspend_vm', 'set_vm_config', 'get_vm_config', 'restore_vm_snapshot', 'make_vm_snapshot', 'remove_vm_snapshot', 'vm_console', 'attach_vm_drive', 'detach_vm_drive']
		return valid_commands.indexOf(command) !== -1;
	}
}

function insert_variables(input) {
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

  input = input.replace("{SERVER_IP}", selected_address);
  input = input.replace("{ISO_POOL}", config.iso_path);
  return input;
}

function get_domain(hypervisor, uuid, callback) {
	if (uuid === undefined) {
		callback("No UUID set", null);
	} else if (!string_util.is_uuid(uuid)) {
		callback("Invalid UUID", null);
	} else {
		hypervisor.lookupDomainByUUID(uuid, function(error, domain) {
			if (!error) {
				callback(null, domain);
			} else {
				callback("Could not get domain", null);
			}
		});
	}
}

function vm_exists(hypervisor, uuid, callback) {
	get_domain(hypervisor, uuid, function(error, domain) {
		if (!error) {
			callback(null, true);
		} else if (error == "Could not get domain") {
			callback(null, false);
		} else if (error){
			callback(error, null);
		}
	});
}

function create_vm(hypervisor, xml_config, callback) {

	if (xml_config === undefined) {
		callback("XML config not set", null);
	} else {
    xml_config = insert_variables(string_util.base64_decode(xml_config));
		hypervisor.defineDomain(xml_config, function(c_error, domain) {
			if (!c_error) {

				domain.toXml(function(x_error, new_config) {

					if (!x_error) {

						domain.getUUID(function(u_error, uuid) {

							if (!u_error) {
								var return_data = {
									uuid: uuid,
									xmlconfig: string_util.base64_encode(new_config)
								};

								callback(null, return_data);
							} else {
								callback("Could not get uuid", null);
							}
						});

					} else {
						callback("Could not get XML config", null);
					}
				});


			} else {
				callback("Could not create VM", null);
			}
		});
	}


}

function delete_vm(hypervisor, uuid, callback) {
	if (uuid === undefined) {
		callback("No UUID set", null);
	} else {
		get_domain(hypervisor, uuid, function(d_error, domain) {
			if (!d_error) {
				domain.undefine(function(u_error, result) {
					if (!u_error && result == true) {
						callback(null, true);
					} else {
						callback("Could not undefine vm", null);
					}
				});
			} else {
				callback("Domain does not exist", null);
			}
		});
	}

}

function start_vm(hypervisor, uuid, callback) {

}

function stop_vm(hypervisor, uuid, callback) {

}
