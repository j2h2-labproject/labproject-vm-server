var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var fs = require("fs");

var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');
var command = require(LABPROJECT_LIB + "/common/command");
var foreach = require(LABPROJECT_LIB + "/common/loop").foreach;
var interfaces = require(LABPROJECT_LIB + "/util/interfaces");
var config = require(LABPROJECT_BASE + "/config");


var d_config = null;

module.exports = {
  configure: function(driver_config, callback) {
    var error = null;
    var result = null;
    if (driver_config.hypervisor !== undefined) {
      if (driver_config.hypervisor === "vbox") {
        result = true;
        d_config = driver_config;
      } else {
        error = new Error("Hypervisor not supported");
      }
    } else {
      error = new Error("Hypervisor not set");
    }
    callback(error, result);
  },
  vm_exists: function(uuid, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    VBoxManage(['list', 'vms'], function(error, stdout) {
      if (!error) {
        for (var i=0; i < stdout.length; i++) {
          if (stdout[i].indexOf(uuid) != -1) {
            callback(null, true);
            return;
          }
        }
        callback(null, false);
      } else {
        callback("Failed to get VM state", null);
      }
    });
  },
	create_vm: function(vm_config, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }


    var name = vm_config.name;
    var uuid = vm_config.uuid;

    command.run("VBoxManage", ['createvm', '--name', name, '--uuid', uuid, '--register'], function(error, stdout, stderr){
  		if (!error) {


        var config_array = [
          '--memory', String(vm_config.mem_size),
          '--cpus', String(vm_config.cpu_count),
          '--pae', 'on',
          '--mouse', 'usbtablet'
        ];

        var command_array = ['modifyvm', uuid].concat(config_array);
        console.log(command_array);
        command.run("VBoxManage", command_array, function(error, stdout, stderr){
      		if (!error) {
            setup_drives(uuid, vm_config.hd_list, vm_config.cdrom_list, function(d_error, result) {
              if (!d_error) {
                add_interfaces(uuid, 0, vm_config.interface_list, function(i_error, result) {
                  if (!i_error) {
                    callback(null, true);
                  } else {
                    callback(i_error, null);
                  }
                });
              } else {
                callback(d_error, null);
              }
            });

      		} else {
            console.log(error);
      			callback("Could not create VM", null);
      		}
      	});

  		} else {
        console.log(error);
  			callback("Could not create VM", null);
  		}
  	});

  },
  update_vm: function(uuid, vm_config, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    config_array = [];

    if (vm_config.hasOwnProperty("mem_size")) {
      config_array = config_array.concat(['--memory', String(vm_config.mem_size)]);
    }

    if (vm_config.hasOwnProperty("cpu_count")) {
      config_array = config_array.concat(['--cpus', String(vm_config.cpu_count)]);
    }

    function update_lists() {
      update_drives(uuid, vm_config.hd_list, vm_config.cdrom_list, function(d_error, result) {
        if (!d_error) {
          update_interfaces(uuid, 0, vm_config.interface_list, function(i_error, result) {
            if (!i_error) {
              callback(null, true);
            } else {
              callback(i_error, null);
            }
          });
        } else {
          callback(d_error, null);
        }
      });
    }

    if (config_array.length > 0) {
      var command_array = ['modifyvm', uuid].concat(config_array);
      command.run("VBoxManage", command_array, function(error, stdout, stderr){
        if (!error) {
          update_lists();

        } else {
          console.log(error);
          callback("Could not update VM", null);
        }
      });
    } else {
      update_lists();
    }




  },
  delete_vm: function(uuid, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    command.run("VBoxManage", ['unregistervm', uuid, '--delete'], function(error, stdout, stderr){
      if (!error) {
        callback(null, true);
      } else {
        callback("Could not delete VM", null);
      }
    });

  },
  start_vm: function(uuid, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }
    create_host_interfaces(uuid, function(i_error, result) {
      if (!i_error) {
        command.run("VBoxManage", ['startvm', uuid], function(error, stdout, stderr){
          if (!error) {
            callback(null, true);
          } else {
            callback("Failed to start VM", null);
          }
        });
      } else {
        callback(i_error, null);
      }
    });
  },
  stop_vm: function(uuid, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }
    delete_host_interfaces(uuid, function(i_error, result) {
      if (!i_error) {
        command.run("VBoxManage", ['controlvm', uuid, 'poweroff'], function(error, stdout, stderr){
          if (!error) {
            callback(null, true);
          } else {
            callback("Failed to stop VM", null);
          }
        });
      } else {
        callback(i_error, null);
      }
    });

  },
  clone_vm: function(uuid, new_uuid, new_name, config, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    command.run("VBoxManage", ['clonevm', uuid, '--name', new_name, '--uuid', new_uuid, '--register'], function(error, stdout, stderr){
      console.log(error);
      if (!error) {
        reconfigure_cloned_hds(new_uuid, function(m_error, result) {
          callback(null, result);
        });

      } else {
        callback("Failed to clone VM", null);
      }
    });
  },
  vm_is_running: function(uuid, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    is_running(uuid, callback);
  },
  make_vm_snapshot: function(uuid, name, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    command.run("VBoxManage", ['snapshot', uuid, 'take', name], function(error, stdout, stderr){
      if (!error) {
        callback(null, true);
      } else {
        callback("Failed to create snapshot", null);
      }
    });
  },
  restore_vm_snapshot: function(uuid, name, callback) {
    if (config === null) {
      callback("Driver not configured", null);
      return;
    }

  },
  list_vm_snapshots: function(uuid, callback) {

  },
  delete_vm_snapshot: function(uuid, name, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }
    //
    command.run("VBoxManage", ['snapshot', uuid, 'delete', name], function(error, stdout, stderr){
      if (!error) {
        callback(null, true);
      } else {
        callback("Failed to delete snapshot", null);
      }
    });
    //
  },

};

// Check if VM is running
function is_running(uuid, callback) {
  command.run("VBoxManage", ['list', 'runningvms'], function(error, stdout, stderr){
    if (!error) {
      for (var i=0; i < stdout.length; i++) {
        if (stdout[i].indexOf(uuid) != -1) {
          callback(null, true);
          return;
        }
      }
      callback(null, false);
    } else {
      callback("Failed to get VM state", null);
    }
  });
}

// Setup HD drives and CD drives
function setup_drives(uuid, hd_list, cd_list, callback) {

  // Setup controllers that drives will be attached to
  var controller_list = ['ide', 'sata'];
  add_controllers(uuid, controller_list, function(c_error, result) {
    if (!c_error) {
      // Setup the hard drives
      attach_hds(uuid, hd_list, function(h_error, result) {
        if (!h_error) {
          // Setup the CDRom drives
          attach_cds(uuid, cd_list, function(d_error, result) {
            if (!d_error) {
              callback(null, true);
            } else {
              callback(d_error, null);
            }
          });
        } else {
          callback(h_error, null);
        }
      });
    } else {
      callback(c_error, null);
    }
  });
}

// Setup the controllers (SATA, IDE) for drives to attach to
function add_controllers(uuid, controller_list, callback) {

  foreach(controller_list,
    function(loc, controller, pass_data, next) {
      command.run("VBoxManage", ['storagectl', uuid, '--name', controller.toUpperCase(), '--add', controller], function(error, stdout, stderr){
    		if (!error) {
    			next(null, true);
    		} else {
    			next(error, null);
    		}
    	});
    },
    callback);
}

function attach_hds(uuid, hd_list, callback) {
  foreach(hd_list,
    function(loc, hd, pass_data, next) {
      var controller = hd.bus;
      var path = hd.path;

      var config_array = [
        '--storagectl', controller.toUpperCase(),
        '--device', '0',
        '--port', String(loc),
        '--type', 'hdd',
        '--medium', path
      ];

      var command_array = ['storageattach', uuid].concat(config_array);

      VBoxManage(command_array, function(error, result) {
        if (!error) {
          next(null, true);
        } else {
          next(error, null);
        }
      });
    },
    callback);
}

function attach_cds(uuid, location, cd_list, callback) {
  foreach(cd_list,
    function (loc, cd, pass_data, next) {
      var controller = cd.bus;
      var path = cd.path;

      var config_array = [
        '--storagectl', controller.toUpperCase(),
        '--device', '0',
        '--port', String(location),
        '--type', 'dvddrive',
        '--medium', path
      ];

      var command_array = ['storageattach', uuid].concat(config_array);

      VBoxManage(command_array, function(error, result) {
        if (!error) {
          next(null, true);
        } else {
          next(error, null);
        }
      });

    },
    callback);
}

// Detach drive from controller. Drive is not deleted, just not connected to the VM.
function eject_disk(uuid, controller, drive_num, callback) {

  var config_array = [
    '--storagectl', controller.toUpperCase(),
    '--device', '0',
    '--port', String(drive_num),
    '--medium', 'emptydrive'
  ];

  VBoxStorage(uuid, config_array, function(error, result) {
    if (!error) {
      callback(null, true);
    } else {
      callback(error, null);
    }
  });
}

// When a VM is cloned, the disks are created in a seperate directory. They need to be moved.
function reconfigure_cloned_hds(uuid, callback) {
   get_vminfo(uuid, function(error, config_data) {

     var disk_list = [];

     for (var key in config_data) {
       drive_pattern = /^(IDE|SATA)-[0-9]+-[0-9]+/;
       if (drive_pattern.test(key) && config_data[key].indexOf(".iso") == -1 && config_data[key] != "none") {
         disk_list.push({key: key, path: config_data[key]});
       }
     }
     move_cloned_hds(uuid, disk_list, function(m_error, result) {
       callback(m_error, result);
     });
   });

}

function move_cloned_hds(uuid, disk_list, callback) {

  foreach(disk_list,
    function(loc, cloned_disk, return_list, next) {

      if (return_list === null) {
        return_list = [];
      }

      // Get the filename from the path
      var file_split = cloned_disk.path.split("/");
      var filename = file_split[file_split.length - 1];

      // Set the old and new paths
      var new_path = config.pool_path + "/" + filename;
      var old_path = cloned_disk.path;
      console.log(new_path);
      console.log(old_path);

      // Extract bus, port and device from string
      var controller_split = cloned_disk.key.split("-");

      controller = controller_split[0].toLowerCase();
      port = parseInt(controller_split[1]);
      device = controller_split[2];

      // Eject the disk from the old location
      eject_disk(uuid, controller, port, function(e_error, result) {
        if (!e_error) {

        	command.run("VBoxManage", ["closemedium", 'disk', old_path], function(u_error, stdout, stderr) {
            if (!u_error) {
              // Move the old file to the new file
              fs.rename(old_path, new_path, function (m_error) {

                // Reattach the drive now at the new location
                if (!m_error) {
                  var config_array = [
                    '--storagectl', controller.toUpperCase(),
                    '--device', device,
                    '--port', String(port),
                    '--type', 'hdd',
                    '--medium', new_path
                  ];

                  return_list.push(new_path);

                  VBoxStorage(uuid, config_array, function(error, result) {
                    if (!error) {
                      next(null, return_list);
                    } else {
                      next(error, null);
                    }
                  });
                }
              });
            } else {
              next(u_error, null);
            }

        	});


        } else {
          next(e_error, null);
        }
      });
    },
    callback);
}

// Get raw VirtualBox VM info in a dictionary form
function get_vminfo(uuid, callback) {

  VBoxManage(['showvminfo', uuid, '--machinereadable'], function(error, data) {
    if (!error) {
      config_map = {};
      for (var i = 0; i < data.length; i++) {
        config_split = data[i].split("=");
        if (config_split.length > 1) {
          config_map[config_split[0].replace(/"/g, "")] = config_split[1].replace(/"/g, "");
        }
      }
      callback(null, config_map);
    } else {
      callback(error, null);
    }
  });

}

function add_interfaces(uuid, interface_list, callback) {

  foreach(interface_list,
    function(loc, interface_item, pass_data, next) {
      var current = interface_list[location];

      var config_array = [
        '--nic' + (location + 1), 'bridged',
        '--bridgeadapter' + (location + 1), current.interface
      ];

      VBoxModify(uuid, config_array, function(error, result) {
        if (!error) {
          next(null, true);
        } else {
          next(error, null);
        }
      });

    },
    callback);

}

// Create the configured interfaces on the server
function create_interfaces(interface_list, callback) {

  foreach( interface_list,
    function(loc, interface_item, pass_data, next) {
      interfaces.create_tap_interface(interface_item, function(c_error, result) {
        if (!c_error||c_error.message == "Device already exists") {
          next(null, true);
        } else {
          next("Could not create interface " + interface_list[location], null);
        }
      });
    },
    callback);

}

function create_host_interfaces(uuid, callback) {
  get_vminfo(uuid, function(error, config_data) {

    var interface_list = [];

    for (var key in config_data) {
      if (key.startsWith("bridgeadapter")) {
        interface_list.push(config_data[key]);
      }
    }

    create_interfaces(interface_list, function(i_error, result) {
      callback(i_error, result);
    });
  });
}

function delete_interfaces(interface_list, callback) {

  foreach(interface_list,
    function(loc, interface_name, pass_data, next) {
      interfaces.remove_tap_interface(interface_name, function(d_error, result) {
        if (!d_error) {
          next(null, true);
        } else {
          next("Could not remove interface " + interface_list[location], null);
        }
      });
    },
    callback);
}

function delete_host_interfaces(uuid, callback) {
  get_vminfo(uuid, function(error, config_data) {

    var interface_list = [];

    for (var key in config_data) {
      if (key.startsWith("bridgeadapter")) {
        interface_list.push(config_data[key]);
      }
    }

    delete_interfaces(0, interface_list, function(d_error, result) {
      callback(d_error, result);
    });
  });
}

// Update functions

function update_drives(uuid, hd_list, cdrom_list, callback) {
  update_hd(uuid, hd_list, function(error, result) {
    if (!error) {
      update_cd(uuid, cd_list, function(error, result) {
        if (!error) {
          callback(null, true);
        } else {
          callback(error, result);
        }
      });
    } else {
      callback(error, result);
    }
  }
}

function update_hd(uuid, drive_updates, callback) {

  foreach(drive_updates,
    function(loc, hd, pass_data, next) {

      if (drive_config && Object.keys(drive_config).length === 0) {
        next(null, true);
      } else {
        var controller = hd.bus;

        var config_array = [
          '--storagectl', controller.toUpperCase(),
          '--device', '0',
          '--type', 'hdd',
          '--port', String(loc),
        ];

        if (drive_config === null) {
          config_array = config_array.concat(['--medium', 'none']);
        } else {
          var path = hd.path;
          config_array = config_array.concat(['--medium', path]);
        }

        VBoxStorage(uuid, command_array, function(error, result) {
          if (!error) {
            next(null, true);
          } else {
            next(error, null);
          }
        });
      }
    },
    callback
  );
}

function update_cd(uuid, drive_updates, callback) {

  foreach(drive_updates,
    function(loc, cd, pass_data, next) {

      if (drive_config && Object.keys(drive_config).length === 0) {
        next(null, true);
      } else {
        var controller = cd.bus;

        var config_array = [
          '--storagectl', controller.toUpperCase(),
          '--device', '0',
          '--type', 'dvddrive',
          '--port', String(loc),
        ];

        if (drive_config === null) {
          config_array = config_array.concat(['--medium', 'none']);
        } else {
          var path = cd.path;
          config_array = config_array.concat(['--medium', path]);
        }
        VBoxStorage(uuid, command_array, function(error, result) {
          if (!error) {
            next(null, true);
          } else {
            next(error, null);
          }
        });
      }
    },
    callback
  );
}

function update_interfaces(uuid, interface_updates, callback) {
  foreach(interface_updates,
    function(loc, iface_config, pass_data, next) {
      if (iface_config && Object.keys(iface_config).length === 0) {
        next(null, true);
      } else if (iface_config == null) {
        config_array = [
          '--nic' + (location + 1), 'none'
        ];

        interfaces.remove_tap_interface(current.interface, function(c_error, result) {
          if (!c_error||c_error.message == "Device already exists") {
            VBoxModify(uuid, config_array, function(error, data) {
              if (!error) {
                next(null, true);
              } else {
                next(error, null);
              }
            }
          } else {
            next("Could not remove interface " + current.interface, null);
          }
        });

      } else {

        config_array = [
          '--nic' + (location + 1), 'bridged',
          '--bridgeadapter' + (location + 1), current.interface
        ];

        interfaces.create_tap_interface(current.interface, function(c_error, result) {
          if (!c_error||c_error.message == "Device already exists") {
            VBoxModify(uuid, config_array, function(error, data) {
              if (!error) {
                next(null, true);
              } else {
                next(error, null);
              }
            }
          } else {
            next("Could not create interface " + current.interface, null);
          }
        });

        var config_array = [];
        if (iface_config === null) {

        } else {

        }



      }
    },
    callback);
}

// VBoxManage helper functions

function VBoxStorage(uuid, config_array, callback) {
  var command_array = ['storageattach', uuid].concat(config_array);
  VBoxManage(command_array, function(error, data) {
    callback(error, data);
  }
}

function VBoxModify(uuid, config_array, callback) {
  var command_array = ['modifyvm', uuid].concat(config_array);
  VBoxManage(command_array, function(error, data) {
    callback(error, data);
  }
}

function VBoxManage(commands, callback) {
  command.run("VBoxManage", commands, function(error, stdout, stderr){
    if (!error) {
      callback(null, stdout);
    } else {
      callback(error, null);
    }
  });
}
