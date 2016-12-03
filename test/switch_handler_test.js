var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var switch_handler = require(LABPROJECT_LIB + "/handlers/switch_handler");
var command = require(LABPROJECT_LIB + "/common/command");
var logging = require(LABPROJECT_LIB + "/common/logging")

var logger = new logging.logger("VM_SERVER", "cli");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('switch_handler Object:', function(){

	before(function() {
		switch_handler.set_logger(logger);
	});

	describe('handles function', function(){

		it('should handle expected functions', function(){

			op_list = ['switch_exists', 'switch_status', 'create_switch', 'delete_switch', 'list_ports', 'connect_port', 'disconnect_port']

			for (i = 0; i < op_list.length; i++) {
				switch_handler.handles(op_list[i]).should.be.true;
			}

		});

	});

	describe('switch_exists function', function(){

		it('cause error on not setting param', function(done){
			switch_handler.handle('switch_exists', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		//
		it('should return false on uuid that should not exist', function(done){
			switch_handler.handle('switch_exists', {switch_id: "11111111-c3c9-11e5-a991-0800274cfb79"}, function(error, result){
				(error == null).should.equal(true);
				result.should.be.false;

				done();
			});
		});

	});

	describe('create_switch function', function(){

		it('cause error on not setting param', function(done){
			switch_handler.handle('create_switch', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		//
		it('should return true when the switch is created, and the switch should now report as exists', function(done){
			switch_handler.handle('create_switch', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(true);
				result.should.be.true;

				switch_handler.handle('switch_exists', {switch_id: "test"}, function(error, result){
					(error == null).should.equal(true);
					result.should.be.true;

					done();
				});

			});
		});

	});

	describe('list_ports function (empty)', function(){

		it('cause error on not setting switch_id param', function(done){
			switch_handler.handle('list_ports', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		it('cause error on attempting to list non-existant switch', function(done){
			switch_handler.handle('list_ports', {switch_id: "nope"}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("Could not list ports on switch nope. An error occured");

				done();
			});
		});

		it('should return an empty list', function(done){
			switch_handler.handle('list_ports', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(true);
				result.should.be.instanceof.Array;
				result.length.should.equal(0);
				done();
			});
		});

	});

	describe('connect_port function', function(){

		before(function(done){
			command.run("sudo", ["ip", "tuntap", "add", "dev", "test0", "mode", "tap"], function(error, stdout, stderr) {
				if (error) {
					(null != null).should.equal(true);
				}
				command.run("sudo", ["ip", "tuntap", "add", "dev", "test1", "mode", "tap"], function(error, stdout, stderr) {
					if (error) {
						(null != null).should.equal(true);
					}
					done();
				});
			});
		});

		it('cause error on not setting param (switch id)', function(done){
			switch_handler.handle('connect_port', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		it('cause error on not setting param (port)', function(done){
			switch_handler.handle('connect_port', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("Invalid ports");

				done();
			});
		});

		it('should cause error on invalid port', function(done){
			switch_handler.handle('connect_port', {switch_id: "test", ports: ["test2"]}, function(error, result){
				(error == null).should.equal(false);

				done();
			});
		});

		it('should succeed adding port test0', function(done){
			switch_handler.handle('connect_port', {switch_id: "test", ports: ["test0"]}, function(error, result){
				(error == null).should.equal(true);
				(result == true).should.be.true;
				done();
			});
		});

		it('should succeed in adding port test1', function(done){
			switch_handler.handle('connect_port', {switch_id: "test", ports: ["test1"]}, function(error, result){
				(error == null).should.equal(true);
				(result == true).should.be.true;
				done();
			});
		});

	});

	describe('list_ports function', function(){

		it('should return a list with two ports', function(done){
			switch_handler.handle('list_ports', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(true);
				result.should.be.instanceof.Array;
				console.log(result);
				result.length.should.equal(2);
				done();
			});
		});

	});

	describe('get_port_data function', function(){

		it('should return error for invalid port', function(done){
			switch_handler.handle('get_port_data', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("Port was not set");
				done();
			});
		});

		it('should return an object of data', function(done){
			switch_handler.handle('get_port_data', {port: "test0"}, function(error, result){
				(error == null).should.equal(true);
				result['tag'].should.equal(1);
				result['vlan_mode'].should.equal("access");
				done();
			});
		});

	});

	describe('disconnect_port function', function(){

		// Delete the test ports
		after(function(done){
			command.run("sudo", ["ip", "link", "delete", "test0"], function(error, stdout, stderr) {
				if (error) {
					(null != null).should.equal(true);
				}
				command.run("sudo", ["ip", "link", "delete", "test1"], function(error, stdout, stderr) {
					if (error) {
						(null != null).should.equal(true);
					}
					done();
				});
			});
		});

		it('cause error on not setting param (switch id)', function(done){
			switch_handler.handle('disconnect_port', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		it('cause error on not setting param (port)', function(done){
			switch_handler.handle('disconnect_port', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("Invalid ports");

				done();
			});
		});
	});

	describe('delete_switch function', function(){

		it('cause error on not setting param', function(done){
			switch_handler.handle('delete_switch', {}, function(error, result){
				(error == null).should.equal(false);
				error.should.equal("No switch ID was set");

				done();
			});
		});

		//
		it('should return true when the switch is deleted, and the switch should now report as not existing', function(done){
			switch_handler.handle('delete_switch', {switch_id: "test"}, function(error, result){
				(error == null).should.equal(true);
				result.should.be.true;

				switch_handler.handle('switch_exists', {switch_id: "test"}, function(error, result){
					(error == null).should.equal(true);
					result.should.be.false;

					done();
				});

			});
		});

	});




});
