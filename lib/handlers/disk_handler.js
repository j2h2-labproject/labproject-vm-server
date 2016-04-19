/*
 * Handles requests for hard drive images
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");

var os = require("os");
var libvirt = require("node-libvirt");
var diskusage = require("diskusage");

module.exports = {
	/*
	 * Handles requests
	 */
	handle: function(command, params, callback) {

		hypervisor_util.get_hypervisor('qemu', function(error, hypervisor) {
			if (!error) {

				var on_done = function(error, result) {
					hypervisor_util.disconnect_hypervisor(hypervisor);
					callback(error, result);
				}

				connect_pool(hypervisor, function(p_error, pool) {

					if (p_error) {
						callback(p_error, null);
						return;
					}

					try {
						switch (command) {
							case "get_disk_space":
								get_disk_space(on_done);
								break;
							case "disk_exists":
								disk_exists(pool, params['diskname'], on_done);
								break;
							case "create_disk":
								create_disk(pool, params['xmlconfig'], on_done);
								break;
							case "remove_disk":
								remove_disk(pool, params['diskname'], on_done);
								break;
							case "disk_info":
								disk_info(pool, params['diskname'], on_done);
								break;
							default:
								on_done("Function not implemented", null);
								break;
						}
					} catch (err) {
						console.log(err);
						callback("Parameters not set", null);
					}
				});




			} else {
				callback(error, null);
			}

		});

	},
	handles: function(command) {
		valid_commands = ['get_disk_space', 'disk_exists', 'create_disk', 'clone_disk', 'remove_disk', 'resize_disk', 'disk_info']
		return valid_commands.indexOf(command) !== -1;
	}
}


function convert_to_mb(value) {
	if (value == 0) {
		return 0;
	} else {
		div = value / 1024 / 1024;
		if (div < 1) {
			return 1;
		} else {
			return Math.round(div);
		}
	}
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



function connect_pool(hypervisor, callback) {

	labproject_pool = 'labproject'

	hypervisor.lookupStoragePoolByName(labproject_pool, function(p_error, pool) {
		if (!p_error) {

			ensure_active(pool, function(s_error, status) {
				if (!s_error) {
					callback(null, pool);
				} else {
					callback(s_error, null);
				}
			});


		} else {

			var pool_xml = '<pool type="dir"><name>labproject</name><target><path>' + config.pool_path + '</path></target></pool>';

			hypervisor.defineStoragePool(pool_xml, function(c_error, pool) {
				if (!c_error) {
					ensure_active(pool, function(s_error, status) {
						if (!s_error) {
							callback(null, pool);
						} else {
							callback(s_error, null);
						}
					});
				} else {
					callback("Could not create pool", pool);
				}
			});

		}
	});
}

function ensure_active(pool, callback) {
	pool.isActive(function (error, is_active) {
		if (!error) {
			if (!is_active) {
				pool.start(function(s_error, started) {
					if (s_error) {
						callback("Error starting pool", null);
					} else if (started) {
						callback(null, true);
					} else {
						callback("Could not start pool", null);
					}
				});
			} else {
				callback(null, true);
			}
		} else {
			callback("Could not determine if the pool is active", null);
		}
	});
}

function disk_exists(pool, disk_name, callback) {
	if (disk_name === undefined) {
		callback("Disk name is not set", null);
	} else {
		get_volume(pool, disk_name, function(error, data) {
			if (error) {
				callback(null, false);
			} else {
				callback(null, true);
			}
		});
	}
}


function create_disk(pool, xml_config, callback) {
	if (xml_config === undefined) {
		callback("XML config not set", null);
	} else {

    // Replace storage location
    xml_config = xml_config.replace("{STORAGE_POOL}", config.pool_path);

		pool.createVolume(xml_config, function(error, volume) {
			if (!error) {
				callback(null, true);
			} else {
				callback("Failed to create disk", null);
			}
		});
	}
}

function clone_disk(hypervisor, pool, disk_name, clone_xml_config) {

}

function remove_disk(pool, disk_name, callback) {

	if (disk_name === undefined) {
		callback("Disk name is not set", null);
	} else {
		get_volume(pool, disk_name, function(error, volume) {
			if (!error) {
				volume.remove(function(d_error, result) {
					if (!d_error && result == true) {
						callback(null, true);
					} else {
						callback("Failed to remove disk", null);
					}
				});
			} else {
				callback(error, null);
			}
		 });
	}
}

function disk_info(pool, disk_name, callback) {
	if (disk_name === undefined) {
		callback("Disk name is not set", null);
	} else {
		get_volume(pool, disk_name, function(error, volume) {
			if (!error) {

				volume.getInfo(function(v_error, data) {
					data.capacity = convert_to_mb(data.capacity);
					data.allocation = convert_to_mb(data.allocation);
					console.log(data);
					callback(null, data);
				});

			} else {
				callback("Disk not found", null);
			}
		});
	}
}

function get_volume(pool, disk_name, callback) {
	pool.lookupStorageVolumeByName(disk_name, function(error, volume) {
		callback(error, volume);
	});
}
