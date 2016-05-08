var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var fs = require("fs");

var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var string_util = require(LABPROJECT_LIB + "/common/string");
var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");
var sanitize = require(LABPROJECT_LIB + '/common/sanitize');
var command = require(LABPROJECT_LIB + "/common/command");
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
    command.run("VBoxManage", ['list', 'vms'], function(error, stdout, stderr){
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
          '--description', vm_config.description,
          '--cpus', String(vm_config.cpu_count),
          '--pae', 'on',
          '--mouse', 'usbtablet'
        ];

        var command_array = ['modifyvm', uuid].concat(config_array);

        command.run("VBoxManage", command_array, function(error, stdout, stderr){
      		if (!error) {
            add_drives(uuid, vm_config.hd_list, vm_config.cdrom_list, function(d_error, result) {
              if (!d_error) {
                callback(null, true);
              } else {
                callback(d_error, null);
              }
            });

      		} else {
      			callback("Could not create VM", null);
      		}
      	});

  		} else {
  			callback("Could not create VM", null);
  		}
  	});

  },
  update_vm: function(config, callback) {
    if (d_config === null) {
      callback("Driver not configured", null);
      return;
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

    command.run("VBoxManage", ['startvm', uuid], function(error, stdout, stderr){
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

    command.run("VBoxManage", ['controlvm', uuid, 'poweroff'], function(error, stdout, stderr){
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

    command.run("VBoxManage", ['clonevm', uuid, '--name', new_name, '--uuid', new_uuid, '--register'], function(error, stdout, stderr){
      console.log(error);
      if (!error) {
        move_cloned_hds(new_uuid, function(m_error, result) {
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
    // callback = wrap_callback(callback, hypervisor);
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
  }
};

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

function add_drives(uuid, hd_list, cd_list, callback) {
  var controller_list = ['ide', 'sata'];
  add_controllers(uuid, 0, controller_list, function(c_error, result) {
    if (!c_error) {
      attach_hds(uuid, 0, hd_list, function(h_error, result) {
        if (!h_error) {
          attach_cds(uuid, 0, cd_list, function(d_error, result) {
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

function add_controllers(uuid, location, controller_list, callback) {
  if (location >= controller_list.length) {
    callback(null, true);
  } else {
    var controller_type = null;
    var controller = controller_list[location];

    command.run("VBoxManage", ['storagectl', uuid, '--name', controller.toUpperCase(), '--add', controller], function(error, stdout, stderr){
  		if (!error) {
  			add_controllers(uuid, location+1, controller_list, callback);
  		} else {
  			callback(error, null);
  		}
  	});
  }
}

// {
function attach_hds(uuid, location, hd_list, callback) {
  if (location >= hd_list.length) {
    callback(null, true);
  } else {
    var controller = hd_list[location].bus;
    var path = hd_list[location].path;

    var config_array = [
      '--storagectl', controller.toUpperCase(),
      '--device', '0',
      '--port', String(location),
      '--type', 'hdd',
      '--medium', path
    ];

    var command_array = ['storageattach', uuid].concat(config_array);

    command.run("VBoxManage", command_array, function(error, stdout, stderr){
      if (!error) {
        attach_hds(uuid, location+1, hd_list, callback);
      } else {
        callback(error, null);
      }
    });
  }
}

function attach_cds(uuid, location, cd_list, callback) {
  if (location >= cd_list.length) {
    callback(null, true);
  } else {
    var controller = cd_list[location].bus;
    var path = cd_list[location].path;

    var config_array = [
      '--storagectl', controller.toUpperCase(),
      '--device', '0',
      '--port', String(location),
      '--type', 'dvddrive',
      '--medium', path
    ];

    var command_array = ['storageattach', uuid].concat(config_array);

    command.run("VBoxManage", command_array, function(error, stdout, stderr){
      if (!error) {
        attach_cds(uuid, location+1, cd_list, callback);
      } else {
        callback(error, null);
      }
    });
  }
}

function eject_disk(uuid, controller, drive_num, callback) {

  var config_array = [
    '--storagectl', controller.toUpperCase(),
    '--device', '0',
    '--port', String(drive_num),
    '--medium', 'emptydrive'
  ];

  var command_array = ['storageattach', uuid].concat(config_array);

  command.run("VBoxManage", command_array, function(error, stdout, stderr){
    if (!error) {
      callback(null, true);
    } else {
      callback(error, null);
    }
  });
}

function move_cloned_hd(uuid, location, disk_list, return_list, callback) {
  if (location >= disk_list.length) {
    callback(null, return_list);
  } else {

    var file_split = disk_list[location].path.split("/");
    var filename = file_split[file_split.length - 1];

    var new_path = config.pool_path + "/" + filename;
    var old_path = disk_list[location].path;
    console.log(new_path);
    console.log(old_path);

    var controller_split = disk_list[location].key.split("-");

    controller = controller_split[0].toLowerCase();
    port = parseInt(controller_split[1]);
    device = controller_split[2];

    eject_disk(uuid, controller, port, function(e_error, result) {
      if (!e_error) {

      	command.run("VBoxManage", ["closemedium", 'disk', old_path], function(u_error, stdout, stderr) {

          if (!u_error) {
            fs.rename(old_path, new_path, function (m_error) {

              if (!m_error) {

                var config_array = [
                  '--storagectl', controller.toUpperCase(),
                  '--device', device,
                  '--port', String(port),
                  '--type', 'hdd',
                  '--medium', new_path
                ];

                return_list.push(new_path);

                var command_array = ['storageattach', uuid].concat(config_array);

                command.run("VBoxManage", command_array, function(error, stdout, stderr){
                  if (!error) {
                    move_cloned_hd(uuid, location+1, disk_list, return_list, callback);
                  } else {
                    callback(error, null);
                  }
                });
              }
            });
          } else {
            callback(u_error, null);
          }

      	});


      } else {
        callback(e_error, null);
      }
    });

  }
}

function move_cloned_hds(uuid, callback) {
   get_vminfo(uuid, function(error, config_data) {

     var disk_list = [];

     for (var key in config_data) {
       drive_pattern = /^(IDE|SATA)-[0-9]+-[0-9]+/;
       if (drive_pattern.test(key) && config_data[key].indexOf(".iso") == -1 && config_data[key] != "none") {
         disk_list.push({key: key, path: config_data[key]});
       }
     }
     move_cloned_hd(uuid, 0, disk_list, [], function(m_error, result) {
       callback(m_error, result);
     });
   });

}

function get_vminfo(uuid, callback) {
  command.run("VBoxManage", ['showvminfo', uuid, '--machinereadable'], function(error, stdout, stderr){
		if (!error) {
      config_map = {};
      for (var i = 0; i < stdout.length; i++) {
        config_split = stdout[i].split("=");
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
