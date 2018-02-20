/*
 * Module: hypervisor_util
 * 
 * Does common hypervisor checks and hypervisor management
 * 
 */
 
var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";
 
var execute = require('child_process');
var fs = require("fs");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var libvirt = require("libvirt");

module.exports = {
    // Test if a hypervisor is available
    is_available: function(hypervisor_string, callback) {
        
        var check_path;
        
        if (hypervisor_string == "vbox") {
            check_path = "/dev/vboxdrv";
        } else if (hypervisor_string == "qemu") {
            check_path = "/dev/kvm";
        } else {
            callback("Invalid hypervisor", null);
        }
        
        fs.stat(check_path, function(error, stat) {
            if(error == null) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        });
        
        
    },
    // Test if libvirt daemon is running
    is_libvirt_running: function(callback) {
        execute.exec("ps -ewwo args | grep libvirtd", function(err, resp)
            {
                if (err!=null) {
                    callback(err, null);
                    return;
                } else {
                    var lines = resp.split(/\n/);
                    var isrunning = false;

                    for(var i = 0;i < lines.length;i++)
                    {
                        var grep_test=/grep/;
                        var ps_test=/ps/;
                        
                        var teststring = lines[i].trim();

                        if (grep_test.test(teststring)==false && ps_test.test(teststring)==false && teststring.trim() != "")
                            {
                                callback(null, true);
                                return;
                            }
                    }
                    callback(null, false);
                }
                
                
            });
    },
    get_hypervisor: function(hypervisor_name, callback) {
        if (hypervisor_string.is_hypervisor(hypervisor_name)) {
            hv_string = hypervisor_string.get_connection_string(hypervisor_name);
        } else {
            callback("Invalid hypervisor", null);
        }
            
        hypervisor = new libvirt.Hypervisor(hv_string);
        
        hypervisor.connect(function(error){
            if (error) {
                callback("Could not connect to the hypervisor", null);
            } else {
                callback(null, hypervisor);
            }
        });
    },
    disconnect_hypervisor: function(hypervisor) {
        hypervisor.disconnect(function(error){
            
        });
    }
}
