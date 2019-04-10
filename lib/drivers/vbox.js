var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var fs = require("fs");

var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/util/hypervisor_util");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');
var command = require(LABPROJECT_LIB + "/common/command");
var foreach = require(LABPROJECT_LIB + "/common/loop").foreach;
var interfaces = require(LABPROJECT_LIB + "/util/interfaces");
var config = require(LABPROJECT_BASE + "/config");

var d_config = null;

var logging = require(LABPROJECT_LIB + "/common/logging");
var logger = new logging.logger("VBOX", "cli");

module.exports = {
    // Configure the driver
    configure: function(driver_config, callback) {
        var error = null;
        if (driver_config.hypervisor !== undefined) {
            if (driver_config.hypervisor === "vbox") {
                d_config = driver_config;
            } else {
                error = "Hypervisor not supported";
            }
        } else {
            error = "Hypervisor not set";
        }
        VBoxManage(['--version'], function(error, data) {
            callback(error, data[0].trim());
        });
        
    },
    // Get hypervisor info, like emulated hardware
    vm_host_info: function(callback) {
        var return_data = {
            "hypervisor": "vbox",
            "hardware": {
                "network_interface": {
                    "Am79C970A": {"label": "AMD PCNet PCI II"},
                    "Am79C973": {"label": "AMD PCNet FAST III", "recommend_tag": ["linux_2.x", "win_xp", "win_2000", "32bit"]},
                    "82540EM": {"label": "Intel PRO/1000 MT Desktop", "recommend_tag": ["win_10", "win_8", "win_7", "64bit"]},
                    "82543GC": {"label": "Intel PRO/1000 T Server"},
                    "82545EM": {"label": "Intel PRO/1000 MT Server"},
                    "virtio": {"label": "Virtio"}
                }
            },
        }
        callback(null, return_data);
    },
    // Check if the VM exists
    vm_exists: function(uuid, callback) {
        if (d_config === null) {
            callback("Driver not configured", null);
            return;
        }

        // List all VirtualBox VMs and look for the target UUID
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
                callback("Failed to get list vbox VMs", null);
            }
        });
    },
  // Create a VM
    create_vm: function(vm_config, callback) {
        if (d_config === null) {
            callback("Driver not configured", null);
            return;
        }

        var name = vm_config.name;
        var uuid = vm_config.uuid;

        // Create the base VM
        VBoxManage(['createvm', '--name', name, '--uuid', uuid, '--register'], function(error, stdout, stderr){
            if (error) {
                console.log(error);
                callback("Could not create VM", null);
                return;
            }
            
            var config_array = [
                '--memory', String(vm_config.mem_size),
                '--cpus', String(vm_config.cpu_count),
                '--pae', 'on',
                '--mouse', 'usbtablet'
            ];

            // Set cpu and memory, with a few other basic configs
            VBoxModify(uuid, config_array, function(base_error, stdout, stderr){
                if (base_error) {
                    callback("Could not set VM resources", null);
                    return;
                }
                
                // Set drives
                setup_drives(uuid, vm_config.hd_list, vm_config.cd_list, function(d_error, result) {
                    // Set interfaces
                    console.log(vm_config.interface_list);
                    set_interfaces(uuid, vm_config.interface_list, function(i_error, result) {
                        if (!i_error) {
                            callback(null, true);
                        } else {
                            callback(i_error, null);
                        }
                    });
                });
            });
        });
    },
  // Update an existing VM
    update_vm: function(uuid, vm_config, callback) {
        if (d_config === null) {
        callback("Driver not configured", null);
        return;
        }

        is_running(uuid, function(error, result) {
        if (!error && result === true) {
            callback("VM is running", null);
        } else if (!error && result === false){
            config_array = [];

            if (vm_config.hasOwnProperty("mem_size")) {
            config_array = config_array.concat(['--memory', String(vm_config.mem_size)]);
            }

            if (vm_config.hasOwnProperty("cpu_count")) {
            config_array = config_array.concat(['--cpus', String(vm_config.cpu_count)]);
            }

            function update_lists() {
            update_drives(uuid, vm_config.hd_list, vm_config.cd_list, function(d_error, result) {
                if (!d_error) {
                set_interfaces(uuid, vm_config.interface_list, function(i_error, result) {
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

            // Check for modifications to memory and cpu
            if (config_array.length > 0) {
            VBoxModify(uuid, config_array, function(error, stdout, stderr){
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

        } else {
            callback(error, null);
        }
        });

        
    },
    delete_vm: function(uuid, callback) {
        if (d_config === null) {
            callback("Driver not configured", null);
            return;
        }
        console.log("delete_vm called")
        VBoxManage(['unregistervm', uuid, '--delete'], function(error, stdout, stderr){
            if (!error) {
                console.log("okay");
                callback(null, true);
            } else {
                if (error.message.indexOf("") != -1) {
                    console.log("wait")
                    setTimeout(function(){
                        console.log("hi there")
                        module.exports.delete_vm(uuid, callback);
                    }, 2000);
                } else {
                    callback("Could not delete VM: " + error.message, null);
                }
            }
        });

    },
    start_vm: function(uuid, callback) {
        if (d_config === null) {
            callback("Driver not configured", null);
            return;
        }
        
        VBoxManage(['startvm', uuid], function(error, stdout, stderr){
            if (!error) {
                callback(null, true);
            } else {
                callback("Failed to start VM", null);
            }
        });
        
    },
    stop_vm: function(uuid, callback) {
        if (d_config === null) {
            callback("Driver not configured", null);
            return;
        }

        VBoxManage(['controlvm', uuid, 'poweroff'], function(error, stdout, stderr){
            if (!error) {
            callback(null, true);
            } else {
            callback("Failed to stop VM", null);
            }
        });
    },
  clone_vm: function(uuid, new_uuid, new_name, config, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
    }

    VBoxManage(['clonevm', uuid, '--name', new_name, '--uuid', new_uuid, '--register'], function(error, stdout, stderr){
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

    VBoxManage(['snapshot', uuid, 'take', name], function(error, stdout, stderr){
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
    VBoxManage(['snapshot', uuid, 'delete', name], function(error, stdout, stderr){
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
  VBoxManage(['list', 'runningvms'], function(error, stdout, stderr){
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

function set_interfaces(uuid, interface_list, callback) {
    console.log("interfaces: ", interface_list);
    foreach(interface_list, function(loc, interface, pass_data, next) {
        logger.log("debug", "Configuring interface " + loc);
        // Do not update interface if we have a blank object
        if (interface && Object.keys(interface).length === 0) {
            logger.log("debug", "No interface changes");
            next(null, true);
        } else {
            logger.log("debug", "Updating interface");
            var config_array = [];

            if (interface === null) {
                logger.log("debug", "Interface removed");
                config_array = [
                    '--nic' + (loc + 1), 'none',
                ];
            } else if (interface.interface == "" || interface.interface === null || interface.connected === false) {
                logger.log("debug", "Interface disconnected");
                config_array = [
                    '--nic' + (loc + 1), 'null',
                ];
            } else {
                logger.log("debug", "Interface set to " + interface.interface);
                config_array = [
                    '--nic' + (loc + 1), 'bridged',
                    '--bridgeadapter' + (loc + 1), interface.interface
                ];
            }
            VBoxModify(uuid, config_array, function(error, result) {
                if (!error) {
                    next(null, true);
                } else {
                    next(error, null);
                }
            });
        }
    }, callback);
}

// Set the HD drives config
function set_hd(uuid, hd_list, callback) {
    foreach(hd_list, function(loc, hd, pass_data, next) {

        // Do not update drive
        if (hd && Object.keys(hd).length === 0) {
            next(null, true);
        } else {

            var controller = hd.bus;
            var path = hd.path;
        
            var config_array = [
                '--device', '0',
                '--port', String(loc),
                '--type', 'hdd',
                '--storagectl', controller.toUpperCase(),
            ]

            if (hd === null) {
                config_array = config_array.concat([
                    '--medium', 'none'
                ]);
            } else {
                var path = hd.path;
                config_array = config_array.concat([
                    '--medium', path
                ]);
            }

            VBoxStorage(uuid, config_array, function(error, result) {
                if (!error) {
                    next(null, true);
                } else {
                    next(error, null);
                }
            });
        }
    }, callback);
}

// Set the CD drives config
function set_cd(uuid, cd_list, callback) {
    foreach(cd_list, function (loc, cd, pass_data, next) {

        if (cd && Object.keys(cd).length === 0) {
            next(null, true);
        } else {
            var controller = cd.bus;
            var path = cd.path;

            var config_array = [
                '--storagectl', controller.toUpperCase(),
                '--device', '0',
                '--port', String(loc),
                '--type', 'dvddrive',
            ];

            if (path === null) {
                config_array = config_array.concat(['--medium', 'none']);
            } else {
                var path = cd.path;
                config_array = config_array.concat(['--medium', path]);
            }

            console.log(config_array);

            VBoxStorage(uuid, config_array, function(error, result) {
                if (!error) {
                    next(null, true);
                } else {
                    next(error, null);
                }
            }); 
        }
    }, callback);
}

// Setup HD drives and CD drives
function setup_drives(uuid, hd_list, cd_list, callback) {

    // Setup controllers that drives will be attached to
    var controller_list = ['ide', 'sata'];
    add_controllers(uuid, controller_list, function(c_error, result) {
        if (c_error) {
            callback(c_error, true);
            return;
        }
        set_hd(uuid, hd_list, function(hd_error, result) {
            if (hd_error) {
                callback(hd_error, result);
                return;
            }
            set_cd(uuid, cd_list, function(cd_error, result){
                if (cd_error) {
                    callback(cd_error, result);
                    return;
                }
                callback(cd_error, result);
            });
        });
    });
}

// Setup HD drives and CD drives
function update_drives(uuid, hd_list, cd_list, callback) {

    if (hd_list === undefined || hd_list === null) {
        hd_list = [];
    }

    if (cd_list === undefined || cd_list === null) {
        cd_list = [];
    }

    set_hd(uuid, hd_list, function(hd_error, result) {
        if (hd_error) {
            callback(hd_error, result);
            return;
        }
        set_cd(uuid, cd_list, function(cd_error, result){
            if (cd_error) {
                callback(cd_error, result);
                return;
            }
            callback(cd_error, result);
        });
    });

}

// Setup the controllers (SATA, IDE) for drives to attach to
function add_controllers(uuid, controller_list, callback) {

  foreach(controller_list,
    function(loc, controller, pass_data, next) {
      VBoxManage(['storagectl', uuid, '--name', controller.toUpperCase(), '--add', controller], function(error, stdout, stderr){
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

            VBoxManage(["closemedium", 'disk', old_path], function(u_error, stdout, stderr) {
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

      var config_array = [
        '--nic' + (loc + 1), 'bridged',
        '--bridgeadapter' + (loc + 1), interface_item.interface
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

// VBoxManage helper functions

function VBoxStorage(uuid, config_array, callback) {
  var command_array = ['storageattach', uuid].concat(config_array);
  VBoxManage(command_array, function(error, data) {
    callback(error, data);
  });
}

function VBoxModify(uuid, config_array, callback) {
  var command_array = ['modifyvm', uuid].concat(config_array);
  VBoxManage(command_array, function(error, data) {
    callback(error, data);
  });
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
