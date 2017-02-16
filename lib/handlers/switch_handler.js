var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var command = require(LABPROJECT_LIB + "/common/command");
var logging = require(LABPROJECT_LIB + "/common/logging");

var foreach = require(LABPROJECT_LIB + "/common/loop").foreach;

/*
To Add:
STP functions

*/

var logger = null;

module.exports = {
	set_logger: function(set_logger) {
		logger = set_logger;
	},
	handle: function(command, params, callback) {
		switch (command) {
			case "switch_exists":
				switch_exists(params['switch_id'], callback);
				break;
			case "switch_status":
				switch_status(params['switch_id'], callback);
				break;
			case "create_switch":
				create_switch(params['switch_id'], callback);
				break;
			case "delete_switch":
				delete_switch(params['switch_id'], callback);
				break;
			case "list_ports":
				list_ports(params['switch_id'], callback);
				break;
			case "connect_port":
				connect_port(params['switch_id'], params['ports'], callback);
				break;
			case "disconnect_port":
				disconnect_port(params['switch_id'], params['ports'], callback);
				break;
			case "get_port_data":
				get_port_data(params['port'], callback);
				break;
			case "patch_ports":
				patch_ports(params['peer1_port'], params['peer2_port'], callback);
				break;
			default:
				on_done("Function not implemented", null);
				break;
		}
	},
	handles: function(command) {
		valid_commands = ['switch_exists', 'switch_status', 'create_switch', 'delete_switch', 'list_ports', 'get_port_data', 'connect_port', 'disconnect_port', 'set_port_mode', 'clear_port', 'set_trunks']
		return valid_commands.indexOf(command) !== -1;
	}
}

function switch_exists(switch_id, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else {
		command.run('sudo',["ovs-vsctl", "br-exists", switch_id], function(error, stdout, stderr){
			if (error) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		});
	}
}

function create_switch(switch_id, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else {
		command.run('sudo',["ovs-vsctl", "add-br", switch_id], function(error, stdout, stderr){
			if (!error)	{
				command.run('sudo', ["ovs-vsctl", "set", "bridge", switch_id, "stp_enable=true"], function(error, stdout, stderr){
					if (!error)	{
							callback(null, true);
					} else {
						logger.log('error', error);
						callback("Could not create switch. An error occured while enabling STP", null);
					}
				});
			} else {
				logger.log('error', error);
				callback("Could not create switch. An error occured while creating the switch", null);
			}
		});
	}
}

function delete_switch(switch_id, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else {
		command.run('sudo',["ovs-vsctl","del-br", switch_id], function(error, stdout, stderr){
			if (!error)
			{
				callback(null, true);
			}else{
				callback("Could not remove switch. An error occured", null);
				logger.log('error', error);
			}
		});
	}
}

function switch_status(switch_id, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else {
		switch_exists(switch_exist, function(error, result) {
			if (error) {
				callback(error, null);
			} else {
				if (result === true) {

				} else {
					callback("Switch does not exist", null);
				}
			}
		});
	}
}

function connect_port(switch_id, ports, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else if (ports === undefined || !Array.isArray(ports)) {
		callback("Invalid ports", null);
	} else {
		foreach(ports,
			function(loc, port, pass_data, next) {
				command.run('sudo',["ovs-vsctl","add-port", switch_id, port, "tag=1", "vlan_mode=access"], function(error, stdout, stderr){
					if (!error && stderr[0] == '') {
						next(null, true);
					} else {
						disconnect_port(switch_id, ports, function() {
							next("Could not add port " + port + " to switch " + switch_id + ". An error occured", null);
						});
					}
				});
			}, 
			callback);
	}
}

function disconnect_port(switch_id, ports, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else if (ports === undefined || !Array.isArray(ports)) {
		callback("Invalid ports", null);
	} else {
		foreach(ports,
			function(loc, port, pass_data, next) {
				command.run('sudo',["ovs-vsctl","del-port", switch_id, port], function(error, stdout, stderr){
					if (!error) {
						next(null, true);
					} else {
						next("Could not remove port " + port + " from switch " + switch_id + ". An error occured", null);
					}
				});
			}, 
			callback);
	}
}

function list_ports(switch_id, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else {
		command.run('sudo',["ovs-vsctl", "list-ports", switch_id], function(error, stdout, stderr){
				if (!error)
				{
					return_list = [];
					for (var i = 0; i < stdout.length; i++) {
						if (stdout[i] != '') {
							return_list.push(stdout[i]);
						}
					}
					callback(null, return_list);
				}else{
					//~ logger.log('error', error);
					callback("Could not list ports on switch " + switch_id + ". An error occured", null);
				}
		});
	}
}

function set_port_mode(switch_id, port, mode, callback) {
	if (switch_id === undefined) {
		callback("No switch ID was set", null);
	} else if (port === undefined) {
		callback("No switch ID was set", null);
	} else if (mode === undefined) {
		callback("No mode was set", null);
	} else if (mode != "access" && mode != "trunk") {
		callback("Invalid mode", null);
	} else {

		ovs_command = []
		clear_function = null;

		if (mode == "access") {
			ovs_command = ["ovs-vsctl", "set", "port", port , "vlan_mode=access"];
			clear_function = clear_trunks;
		} else if (mode == "trunk") {
			ovs_command = ["ovs-vsctl", "set", "port", port , "vlan_mode=trunk"];
			clear_function = clear_vlans;
		}

		clear_function(switch_id, port, function(error, result) {
			if (!error) {
				command.run('sudo', ovs_command , function(error, stdout, stderr){
					if (!error) {
						callback(null, true);
					} else {
						logger.log('error', error);
						callback("Could not set port " + port + " on switch " + switch_id + " to mode " + mode + ". An error occured", null);
					}
				});
			} else {
				logger.log('error', error);
				callback("Could not set port " + port + " on switch " + switch_id + " to mode " + mode + ". An error occured while clearing original config", null);
			}
		});


	}
}

function clear_trunks(switch_id, port, callback) {
	command.run("sudo", ['ovs-vsctl', "clear", "port", host_port , "trunks"], function(error, stdout, stderr){
		if (!error) {
			callback(null, true);
		} else {
			callback(error, null);
		}
	});
}

function clear_vlans(switch_id, port, callback) {
	command.run("sudo", ['ovs-vsctl', "clear", "port", host_port , "tag"], function(error, stdout, stderr){
		if (!error) {
			callback(null, true);
		} else {
			callback(error, null);
		}
	});
}

function get_port_data(port, callback) {
	if (port === undefined) {
		callback("Port was not set", null);
	} else {
		command.run('sudo',["ovs-vsctl", "list", "port", port], function(error, stdout, stderr){
			if (!error)
			{
				return_map = {};
				for (var i = 0; i < stdout.length; i++) {
					if (stdout[i] != '') {

						get_items = ['tag', "trunks", "vlan_mode"]

						line_split = stdout[i].split(":");
						var key = line_split[0].trim();

						if (get_items.indexOf(key) != -1) {
							var value = line_split[1].trim();
							if (!isNaN(value)) {
								value = parseInt(value);
							}
							return_map[key] = value;
						}

					}
				}
				callback(null, return_map);
			}else{
				logger.log('error', error);
				callback("Could not get port data for port " + port + ". An error occured", null);
			}
		});
	}
}

function patch_ports(peer1_port, peer2_port, callback) {
	if (peer1_port === undefined || peer2_port === undefined) {
		callback("One or more peer values is undefined", null);
	} else {

		var ports = [peer1_port, peer2_port];

		// First set the interfaces to patch ports
		foreach(ports,
			function(loc, port, pass_data, next) {
				command.run('sudo',["ovs-vsctl", "set", "interface", port, "type=patch"], function(error, stdout, stderr){
					if (!error)
					{
						next(null, true);
					}else{
						next("Could not set ports to patch ports", null);
					}
				});
			},
			function(error, result) {
				if (!error) {
					// Setup the peers
					command.run('sudo',["ovs-vsctl", "set", "interface", peer1_port, ("options:peer=" + peer2_port) ], function(c1_error, stdout, stderr){
						if (!c1_error)
						{
							command.run('sudo',["ovs-vsctl", "set", "interface", peer2_port, ("options:peer=" + peer1_port) ], function(c2_error, stdout, stderr){
								if (!c2_error)
								{
									callback(null, true);
								}else{
									callback("Could not patch ports", null);
								}
							});
						}else{
							callback("Could not patch ports", null);
						}
					});
				} else {
					callback(error, result);
				}
			});

		
	}
}

var ovs = {
	add_port: function(sw_id, host_port, callback){
		if (switch_util.valid_host_interface(host_port))
			{
				command.run('sudo ovs-vsctl',["add-port", sw_id, host_port], function(stdout, stderr){
					if (! (stdout instanceof callback_error))
						{
							callback(true);
						}else{
							callback(stdout);
						}
				});
			}else{
				callback(new callback_error(error_type.INVALID_SWITCH_SETTING, "Invalid host port"));
			}
	},
	remove_port: function(sw_id, host_port, callback){
		if (switch_util.valid_host_interface(host_port))
			{
				command.run('ovs-vsctl',["del-port", sw_id, host_port], function(stdout, stderr){
					if (! (stdout instanceof callback_error))
						{
							callback(true);
						}else{
							callback(stdout);
						}
				});
			}else{
				callback(new callback_error(error_type.INVALID_SWITCH_SETTING, "Invalid host port"));
			}
	},
	set_port_access: function(host_port, callback){
		//ovs-vsctl set port <port name> tag=<VLAN ID>

		if (switch_util.valid_host_interface(host_port))
			{
				// Clear the allow ports on trunk
				ovs.clear_trunks(host_port, function(result){
					if (!(result instanceof callback_error))
						{
							command.run('ovs-vsctl',["set", "port", host_port , "vlan_mode=access"], function(stdout, stderr){
								if (! (stdout instanceof callback_error))
									{
										callback(true);
									}else{
										callback(stdout);
									}
							});
						}else{
							callback(result);
						}
				});

			}else{
				// TODO: Add return error
				callback();
			}


	},
	set_port_trunk: function(host_port, callback){
			if (switch_util.valid_host_interface(host_port))
			{
				// Clear the allow ports on trunk
				ovs.clear_vlan(host_port, function(result){
					if (!(result instanceof callback_error))
						{
							command.run('ovs-vsctl',["set", "port", host_port , "vlan_mode=trunk"], function(stdout, stderr){
								if (! (stdout instanceof callback_error))
									{
										callback(true);
									}else{
										callback(stdout);
									}
							});
						}else{
							callback(result);
						}
				});

			}else{
				// TODO: Add return error
				callback();
			}
	},
	clear_trunks: function(host_port, callback){
		if (switch_util.valid_host_interface(host_port))
			{
				command.run('ovs-vsctl',["clear", "port", host_port , "trunks"], function(stdout, stderr){
					if (! (stdout instanceof callback_error))
						{
							callback(true);
						}else{
							callback(stdout);
						}
				});
			}else{
				// TODO: Add return error
				callback();
			}
	},
	clear_vlan: function(host_port, callback){
		if (switch_util.valid_host_interface(host_port))
			{
				command.run('ovs-vsctl',["clear", "port", host_port , "tag"], function(stdout, stderr){
					if (! (stdout instanceof callback_error))
						{
							callback(true);
						}else{
							callback(stdout);
						}
				});
			}else{
				// TODO: Add return error
				callback();
			}
	},
	set_port_vlan: function(host_port, vlan, callback){
		if (switch_util.valid_host_interface(host_port))
			{
				ovs.set_port_access(host_port, function(result){
					if (!(result instanceof callback_error))
						{
							command.run('ovs-vsctl',["set", "port", host_port , "tag=" + vlan], function(stdout, stderr){
								if (! (stdout instanceof callback_error))
									{




										callback(true);
									}else{
										callback(stdout);
									}
							});
						}else{
							callback(result);
						}
				});
			}else{
				// TODO: Add return error
				callback();
			}

	},
	set_trunk_vlans: function(sw_port, vlan_list, callback){
		if (node_util.isArray(vlan_list))
			{
				var vlan_string = "1"
				for (var i in vlan_list)
					{
						if (switch_util.valid_vlan(vlan_list[i]))
							{
								vlan_string += "," + vlan_list[i]
							}
					}

				command.run('ovs-vsctl',["set", "port", host_port, "trunks=" + vlan_string], function(stdout, stderr){
					if (! (stdout instanceof callback_error))
						{
							callback(true);
						}else{
							callback(stdout);
						}
				});

			}
	},
	enable_switch: function(sw_id, callback){
		command.run('ovs-vsctl',["add-br", sw_id], function(stdout, stderr){
			if (!(stdout instanceof callback_error))
				{
					callback(true);
				}else{
					callback(stdout);
				}
		});
	},
	disable_switch: function(sw_id, callback){
		//ovs-vsctl del-br

		command.run('ovs-vsctl',["del-br", sw_id], function(stdout, stderr){
				if (!(stdout instanceof callback_error))
				{
					callback(true);
				}else{
					callback(stdout);
				}
		});

	},
	is_port_enabled: function(sw_id, port_id, callback){
		if (switch_util.valid_host_interface(port_id))
			{
				if (port_id === null || port_id == "")
					{
						callback(false);
						return;
					}

				command.run('ovs-vsctl',["iface-to-br", port_id], function(stdout, stderr){
					if (stdout instanceof callback_error)
						{

							callback(false);


						}else{
							var check_sw_id = stdout[0];
							// Check if the port is enabled on another switch
							if (check_sw_id != sw_id)
								{
									callback(new callback_error(error_type.SWITCH_ERROR, "Port is already in use", {"switch": check_sw_id}));
								}else{
									callback(true);
								}
						}
				});
			}else{
				callback(false);
			}
	},
	is_switch_enabled: function(sw_id, callback){
		command.run('ovs-vsctl',["list-br"], function(stdout, stderr){
			if (!(stdout instanceof callback_error))
				{
					for (var i in stdout)
						{
							if (stdout[i] == sw_id)
								{
									callback(true);
									return;
								}
						}

					callback(false);

				}else{
					callback(stdout);
				}
		});
	}
};
