var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";


var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');

var xml_builder = require('xmlbuilder');

var config = null;

module.exports = {
  configure: function(driver_config, callback) {
    config = driver_config;
    callback(null, true);
  },
  vm_exists: function(uuid, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }

    get_domain(uuid, function(error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
      if (!error) {
        callback(null, true);
      } else if (error == "Domain does not exist") {
        callback(null, false);
      } else if (error){
        callback(error, null);
      }
    });


  },
	create_vm: function(vm_config, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    hypervisor_util.get_hypervisor(config.hypervisor, function(error, hypervisor) {

      if (!error) {
        callback = wrap_callback(callback, hypervisor);
        var xml_config = generate_xml(vm_config);
        hypervisor.defineDomain(xml_config, function(c_error, domain) {
          if (!c_error) {
            callback(null, true);
            // domain.toXml(function(x_error, new_config) {
            //   callback(null, true);
            // });

          } else {
            callback("Could not create VM", null);
          }
        });

      } else {
        callback("Could not get hypervisor", null);
      }
    });
  },
  update_vm: function(config, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    callback = wrap_callback(callback, hypervisor);
  },
  delete_vm: function(uuid, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }

    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
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
  },
  start_vm: function(uuid, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }

    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
    	if (!d_error) {
    		domain.start(function(s_error, status) {
    			if (!s_error) {
    				callback(null, true);
    			} else {
    				callback("Failed to start VM", null);
    			}
    		});
    	} else {
    		callback(d_error, null);
    	}
    });
  },
  stop_vm: function(uuid, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }

    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
			if (!d_error) {
				domain.destroy(function(s_error, status) {
					if (!s_error) {
						callback(null, true);
					} else {
						callback("Failed to stop VM", null);
					}
				});
			} else {
				callback(d_error, null);
			}
		});
  },
  vm_is_running: function(uuid, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
      if (!d_error) {
        domain.isActive(function(s_error, status) {
          if (!s_error) {
            callback(null, status);
          } else {
            callback("Failed to get VM state", null);
          }
        });
      } else {
        callback(d_error, null);
      }
    });
  },
  make_vm_snapshot: function(uuid, name, callback) {

    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
      if (!d_error) {

        domain.hasCurrentSnapshot(function(s_error, result) {

          var root = xml_builder.create('domainsnapshot',{},{},{headless:true});
          root.ele('name', {}, name);
          root.ele('creationTime', {}, 0);
          root.ele('state', {}, "running");
          
          if (s_error || result === false) {
            console.log("new")

          }

          var snapshot_config = root.end({ pretty: true});

          domain.takeSnapshot(snapshot_config, [0], function(s_error, status) {
            if (!s_error) {
              domain.toXml(function(x_error, new_config) {
                // console.log(new_config);
                callback(null, true);
              });

            } else {
              callback("Failed to create snapshot", null);
            }
          });

        });






      } else {
        callback(d_error, null);
      }
    });

  },
  restore_vm_snapshot: function(uuid, name, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    // callback = wrap_callback(callback, hypervisor);
  },
  list_vm_snapshots: function(uuid, callback) {

  },
  delete_vm_snapshot: function(uuid, name, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }
    //
    get_domain(uuid, function(d_error, hypervisor, domain) {
      callback = wrap_callback(callback, hypervisor);
      if (!d_error) {

        domain.deleteSnapshot(name, function(s_error, status) {
          if (!s_error) {
            callback(null, true);

          } else {
            callback("Failed to delete snapshot", null);
          }
        });
      } else {
        callback(d_error, null);
      }
    });
    //
  }
};

function get_domain(uuid, callback) {
  hypervisor_util.get_hypervisor(config.hypervisor, function(error, hypervisor) {
    if (!error) {
      hypervisor.lookupDomainByUUID(uuid, function(error, domain) {
        if (!error) {
          callback(null, hypervisor, domain);
        } else {
          callback("Domain does not exist", null, null);
        }
      });
    } else {
      callback("Could not get hypervisor", null, null);
    }
  });
}

function wrap_callback(callback, hypervisor) {
  var on_done = function(error, result) {
    if (hypervisor) {
      hypervisor_util.disconnect_hypervisor(hypervisor);
    }
    callback(error, result);
  };
  return on_done;
}

function generate_xml(config) {
  var root = xml_builder.create('domain',{},{},{headless:true});

	root.att('type', config.hypervisor);
	root.ele('name', {}, config.name);
	root.ele('uuid', {}, config.uuid);
	root.ele('description', {}, config.description);

	// Set the memory
	root.ele('memory', {'unit':'MiB'}, config.mem_size);
	root.ele('currentMemory', {'unit':'MiB'}, config.mem_size);

	// Set the number of cpus
	root.ele('vcpu', {'placement':'static'}, config.cpu_count);

	var os_ele = root.ele('os');

	os_ele.ele('type','hvm');

	// Set the boot order
	os_ele.ele('boot',{'dev':'cdrom'});
	os_ele.ele('boot',{'dev':'hd'});

	// Set the features section
	var features_ele = root.ele('features');

	if (config.features.acpi === true) {
		features_ele.ele('acpi');
	}
	if (config.features.apic === true)	{
		features_ele.ele('apic');
	}
	if (config.features.pae === true) {
		features_ele.ele('pae');
	}

	// Set reactions to shutdowns and restarts
	root.ele('on_poweroff',{},'destroy');
	root.ele('on_reboot',{},'restart');
	root.ele('on_crash',{},'restart');


	// Set the devices
	var device_ele = root.ele('devices');

	// Add the vm input method
	device_ele.ele('input',{'type':'tablet','bus':'usb'});

	// Set the display
	if (config.display == "local") {
		device_ele.ele('graphics',{'type':'desktop'});
	} else if (config.display == "vnc") {
		var vnc_ele = device_ele.ele('graphics',{'type':'vnc','autoport':'yes','sharePolicy':'force-shared'});
		vnc_ele.ele('input',{'type':'address', 'address':'{SERVER_IP}}'});
	} else if (config.display == "rdp") {
		device_ele.ele('graphics',{'type':'rdp','autoport':'yes','multiUser':'yes'});
	}

  var ide_count = 0;
  var sata_count = 0;

	// Add the disks
	for (var i = 0; i < config.hd_list.length; i++) {
		var current = config.hd_list[i];
    var target_name = "sd" +  String.fromCharCode(97 + i);

    // Need to check for valid bus type
		var hd_device_ele = device_ele.ele('disk',{'type':'file','snapshot':'external', 'device':'disk'});
		hd_device_ele.ele('source',{'file': current.path});
		hd_device_ele.ele('target',{'dev': target_name, 'bus': 'sata'});
	}

	// Add the cdrom drives
	for (var i = 0; i < config.cdrom_list.length; i++) {
		var current = config.cdrom_list[i];
    var target_name = "hd" +  String.fromCharCode(97 + i);

		var cd_device_ele = device_ele.ele('disk',{'type':'file','device':'cdrom'});
		cd_device_ele.ele('target',{'dev':target_name, 'bus':'ide'});
		cd_device_ele.ele('source',{'file': current.path});
		cd_device_ele.ele('readonly');
	}


	return root.end({ pretty: true});
}
