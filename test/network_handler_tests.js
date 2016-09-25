var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var network_handler = require(LABPROJECT_LIB + "/handlers/network_handler");
var command = require(LABPROJECT_LIB + "/common/command");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('network_handler Object:', function(){

	describe('handles functions', function(){

		it('should handle expected functions', function(){
      network_handler.handles('create_tap_device').should.equal(true);
      network_handler.handles('remove_tap_device').should.equal(true);
      network_handler.handles('allocate_interface_group').should.equal(true);
      network_handler.handles('deallocate_interface_group').should.equal(true);
      network_handler.handles('nothing').should.equal(false);
		});

	});

	describe('create and delete tap devices', function(){

    var device_name = "test1.0";

    it('should show interface does not exist', function(done){
      command.run("sudo", ["ip", "addr", "show", device_name], function(error, stdout, stderr) {
  			(error == null).should.equal(false);
        done();
  		});
		});

    it('should indicate the interface does not exist', function(done){
      network_handler.handle('interface_exists', {"devicename": device_name}, function(error, result){
        (error == null).should.equal(true);
        result.should.equal(false);
        done();
      });
    });

		it('should create a tap device', function(done){
      network_handler.handle('create_tap_device', {"devicename": device_name}, function(error, result){
				(error == null).should.equal(true);
        command.run("sudo", ["ip", "addr", "show", device_name], function(error, stdout, stderr) {
    			(error == null).should.equal(true);
          done();
    		});
			});

		});

    it('should indicate the interface exists', function(done){
      network_handler.handle('interface_exists', {"devicename": device_name}, function(error, result){
        (error == null).should.equal(true);
        result.should.equal(true);
        done();
      });
    });

    it('should remove a tap device', function(done){
      network_handler.handle('remove_tap_device', {"devicename": device_name}, function(error, result){
				(error == null).should.equal(true);
        command.run("sudo", ["ip", "addr", "show", device_name], function(error, stdout, stderr) {
    			(error == null).should.equal(false);
          done();
    		});
			});
		});

	});

  describe('create and delete interface groups', function(){

    var group_number = 10;

    it('should not create an invalid group', function(done){
      network_handler.handle('allocate_interface_group', {"group_num": "blaa"}, function(error, result){
        (error == null).should.equal(false);
        error.should.equal("Invalid group number");
        command.run("sudo", ["ip", "addr", "show", "lpifblaa"], function(error, stdout, stderr) {
          (error == null).should.equal(false);
          done();
        });
      });
		});

    it('should not create a group with an invalid group number', function(done){
      network_handler.handle('allocate_interface_group', {"group_num": 999999999}, function(error, result){
        (error == null).should.equal(false);
        error.should.equal("Invalid group number");
        command.run("sudo", ["ip", "addr", "show", "lpifblaa"], function(error, stdout, stderr) {
          (error == null).should.equal(false);
          done();
        });
      });
		});

    it('should create a group', function(done){
      network_handler.handle('allocate_interface_group', {"group_num": group_number}, function(error, result){
        (error == null).should.equal(true);
        command.run("sudo", ["ip", "addr", "show", "lpif" + group_number], function(error, stdout, stderr) {
          (error == null).should.equal(true);
          done();
        });
      });
		});

    it('should remove a group', function(done){
      network_handler.handle('deallocate_interface_group', {"group_num": group_number}, function(error, result){
        (error == null).should.equal(true);
        command.run("sudo", ["ip", "addr", "show", "lpif" + group_number], function(error, stdout, stderr) {
          (error == null).should.equal(false);
          done();
        });
      });
    });

    it('should not remove an invalid group', function(done){
      network_handler.handle('deallocate_interface_group', {"group_num": "blaa"}, function(error, result){
        (error == null).should.equal(false);
        error.should.equal("Invalid group number");
        done();
      });
		});

    it('should not remove a group with an invalid group number', function(done){
      network_handler.handle('deallocate_interface_group', {"group_num": 999999999}, function(error, result){
        (error == null).should.equal(false);
        error.should.equal("Invalid group number");
        done();
      });
		});

	});

})
