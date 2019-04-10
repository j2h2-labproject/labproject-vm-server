var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var vm_handler = require(LABPROJECT_LIB + "/handlers/vm_handler");
var command = require(LABPROJECT_LIB + "/common/command");
var string_util = require(LABPROJECT_LIB + "/common/string");
var interfaces = require(LABPROJECT_LIB + "/util/interfaces");

var LABPROJECT_COMMON_BASE = process.cwd();

const TEST_INTERFACE = 'mocha0';
const HD_PATH = config.pool_path + "/test.vdi";
const CD_URL = "http://distro.ibiblio.org/tinycorelinux/9.x/x86/release/Core-current.iso";
const CD_PATH = "/tmp/core.iso";

if (config.driver == 'vbox') {
    describe('(vbox) vm_handler Object:', function(){

        before(function(done) {
            this.timeout(15000);
            var vm_setup = function() {
                command.run("qemu-img", ["create", "-f", "vdi", HD_PATH, "512M"], function(error, stdout, stderr) {
                    if (error) {
                        (null != null).should.equal(true);
                    }
                    interfaces.create_tap_interface(TEST_INTERFACE, function(c_error, result) {
                        if (c_error) {
                            (c_error === null).should.equal(true);
                        } 
                        done();
                    });
                });
            };

            if (!fs.existsSync(CD_PATH)) {
                command.run("wget", ["-O", CD_PATH, CD_URL], function(down_error, stdout, stderr) {
                    if (down_error) {
                        (down_error === null).should.equal(true);
                    }
                    vm_setup();
                });
            } else {
                vm_setup();
            }
        });

        after(function(done) {
            interfaces.remove_tap_interface(TEST_INTERFACE, function(i_error, result) {
                if (i_error) {
                    (i_error === null).should.equal(true);
                } 
                done();
            });
            // command.run("VBoxManage", ["closemedium", 'disk', config.pool_path + "/test.vdi"], function(error, stdout, stderr) {
        
            //     if (error) {
            //         (null != null).should.equal(true);
            //     }
            //     fs.unlink(config.pool_path + "/test.vdi");
            //     done();
            // });
        });


        describe('handles function', function(){

            it('should handle expected functions', function(){
                vm_handler.handles('vm_exists').should.be.true;
                vm_handler.handles('create_vm').should.be.true;
                vm_handler.handles('delete_vm').should.be.true;
                vm_handler.handles('download_http').should.be.false;
            });

        });

        describe('vm_exists function', function(){

            it('cause error on not setting param', function(done){
                vm_handler.handle('vm_exists', {}, function(error, result){
                    (error == null).should.equal(false);
                    error.should.equal("Invalid UUID");

                    done();
                });
            });

            it('should return false on invalid uuid', function(done){
                vm_handler.handle('vm_exists', {uuid: "1234"}, function(error, result){
                    (error == null).should.equal(false);
                    error.should.equal("Invalid UUID");
                    (result == null).should.equal(true);

                    done();
                });
            });

            //
            it('should return false on uuid that should not exist', function(done){
                vm_handler.handle('vm_exists', {uuid: "11111111-c3c9-11e5-a991-0800274cfb79"}, function(error, result){
                    (error == null).should.equal(true);
                    result.should.be.false;

                    done();
                });
            });

          });

        var test_uuid = "";

        describe('create_vm function', function(){

            it('should cause error on blank config object', function(done){
                vm_handler.handle('create_vm', {}, function(error, result){
                    (error === null).should.equal(false);
                    error.should.equal("Invalid config");

                    done();
                });
            });

            // it('cause error on invalid xml', function(done){
            //     vm_handler.handle('create_vm', {xmlconfig: "asdfadsfasdf"}, function(error, result){
            //         (error === null).should.equal(false);
            //         error.should.equal("Could not create VM");
            //
            //         done();
            //     });
            // });


            it('should successfully create a VM', function(done){

                var vm_config = {
                    "hypervisor": "vbox",
                    "name": "test_vm",
                    'description' : 'test',
                    "uuid": "fc30a230-0707-11e6-a735-496252aee5c8",
                    "mem_size": 512,
                    "cpu_count": 1,
                    "platform": "x64",
                    "hd_list": [{"path": HD_PATH, 'bus': 'sata'}],
                    "cd_list": [{"path": CD_PATH, 'bus': 'ide'}],
                    "interface_list": [{"interface": TEST_INTERFACE, "connected": true}],
                    "features": {
                        "acpi": true,
                        "apic": true,
                        "pae": true
                    },
                    "display": "local"
                };

                this.timeout(15000);
                vm_handler.handle('create_vm', {config: vm_config}, function(error, result){
                    (error === null).should.equal(true);
                    result.should.equal(true);
                    test_uuid = vm_config.uuid;

                    done();
                });
            });

          });



      describe('vm_exists function (with VM)', function(){

            it('return true querying existing vm', function(done){
                vm_handler.handle('vm_exists', {uuid: test_uuid}, function(error, result){
                    (error == null).should.equal(true);
                    result.should.equal(true);

                    done();
                });
            });

      });


        describe('clone_vm function', function(){

            it('should clone the virtual machine', function(done){
                vm_handler.handle('clone_vm', {uuid: test_uuid, new_name: 'test_vm_clone', new_uuid: "fc30a230-0707-11e6-a735-496252aee111"}, function(error, result){
                    (error === null).should.equal(true);
                    result.length.should.equal(1);
                    done();
                });
            });

            it('should delete the cloned virtual machine', function(done){
                vm_handler.handle('delete_vm', {uuid: "fc30a230-0707-11e6-a735-496252aee111"}, function(error, result){
                    (error === null).should.equal(true);
                    done();
                });
            });

        });


        describe('start_vm', function(){

            it('should successfully start the VM', function(done){
                this.timeout(15000);
                vm_handler.handle('start_vm', {uuid: test_uuid}, function(error, result){
                    console.log(error);
                    (error == null).should.equal(true);
                    result.should.equal(true);
                    setTimeout(function(){
                        done();
                    }, 7000);
                });
            });

      });

            describe('vm_is_running', function(){

                it('should indicate the vm is running', function(done){

                    vm_handler.handle('vm_is_running', {uuid: test_uuid}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);

                        done();

                    });
                });

          });

            describe('make_vm_snapshot', function(){

                it('creates a snapshot of the VM', function(done){
                    vm_handler.handle('make_vm_snapshot', {uuid: test_uuid, snapshot_name: "test_snapshot"}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);

                        done();
                    });
                });

                it('creates a second snapshot of the VM', function(done){
                    vm_handler.handle('make_vm_snapshot', {uuid: test_uuid, snapshot_name: "test_snapshot_2"}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);

                        done();
                    });
                });

            });


            describe('stop_vm', function(){

                it('should successfully stop the VM', function(done){
                    this.timeout(7000);
                    vm_handler.handle('stop_vm', {uuid: test_uuid}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);
                        setTimeout(function(){
                            done();
                        }, 3000);
                    });
                });

            });

            describe('update_vm', function(){

                it('should successfully update the VM', function(done){
                    this.timeout(7000);
                    vm_handler.handle('update_vm', {uuid: test_uuid, config: {
                        "interface_list": [{"interface": null}],
                        "cd_list": [{"path": null, "bus": "ide"}],
                        "mem_size": 256
                    }}, function(error, result){
                        console.log(error);
                        (error == null).should.equal(true);
                        result.should.equal(true);
                        setTimeout(function(){
                            done();
                        }, 3000);
                    });
                });

            });

            describe('delete_vm_snapshot function', function(){

                it('deletes a snapshot of the VM', function(done){
                    vm_handler.handle('delete_vm_snapshot', {uuid: test_uuid, snapshot_name: "test_snapshot"}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);

                        done();
                    });
                });

                it('deletes the second snapshot of the VM', function(done){
                    vm_handler.handle('delete_vm_snapshot', {uuid: test_uuid, snapshot_name: "test_snapshot_2"}, function(error, result){
                        (error == null).should.equal(true);
                        result.should.equal(true);

                        done();
                    });
                });

            });


          describe('delete_vm function', function(){

            it('cause error on not setting uuid', function(done){
                vm_handler.handle('delete_vm', {}, function(error, result){
                    (error === null).should.equal(false);
                    error.should.equal("Invalid UUID");

                    done();
                });
            });

            it('successfully delete a VM', function(done){
                vm_handler.handle('delete_vm', {uuid: test_uuid}, function(error, result){
                    (error === null).should.equal(true);
                    result.should.equal(true);

                    done();
                });
            });

          });

    });
}
