var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var vm_handler = require(LABPROJECT_LIB + "/handlers/vm_handler");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('vm_handler Object:', function(){

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
				error.should.equal("No UUID set");

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

		it('cause error on not setting xml', function(done){
			vm_handler.handle('create_vm', {}, function(error, result){
				(error === null).should.equal(false);
				error.should.equal("XML config not set");

				done();
			});
		});

		it('cause error on invalid xml', function(done){
			vm_handler.handle('create_vm', {xmlconfig: "asdfadsfasdf"}, function(error, result){
				(error === null).should.equal(false);
				error.should.equal("Could not create VM");

				done();
			});
		});

		var encoded_xml = 'PGRvbWFpbiB0eXBlPSd2Ym94Jz4NCiAgPG5hbWU+dGVzdDwvbmFtZT4NCiAgPG1lbW9yeSB1bml0PSJNIj41MTI8L21lbW9yeT4NCiAgPHZjcHU+MTwvdmNwdT4NCiAgPG9zPg0KICAgIDx0eXBlIGFyY2g9Ing4Nl82NCI+aHZtPC90eXBlPg0KICA8L29zPg0KICA8Y2xvY2sgc3luYz0idXRjIi8+DQogIDxvbl9wb3dlcm9mZj5kZXN0cm95PC9vbl9wb3dlcm9mZj4NCiAgPG9uX3JlYm9vdD5yZXN0YXJ0PC9vbl9yZWJvb3Q+DQogIDxvbl9jcmFzaD5yZXN0YXJ0PC9vbl9jcmFzaD4NCiAgPG9uX2xvY2tmYWlsdXJlPnBvd2Vyb2ZmPC9vbl9sb2NrZmFpbHVyZT4NCiAgPGZlYXR1cmVzPg0KICAgIDxwYWUvPg0KICAgIDxhY3BpLz4NCiAgICA8YXBpYy8+DQogIDwvZmVhdHVyZXM+DQogIDxkZXZpY2VzPg0KICAgIDxpbnB1dCB0eXBlPSdtb3VzZScgYnVzPSd1c2InLz4NCiAgICA8aW5wdXQgdHlwZT0na2V5Ym9hcmQnIGJ1cz0ndXNiJy8+DQogICAgPGdyYXBoaWNzIHR5cGU9J2Rlc2t0b3AnLz4NCiAgPC9kZXZpY2VzPg0KPC9kb21haW4+'

		it('successfully create a VM', function(done){
			vm_handler.handle('create_vm', {xmlconfig: encoded_xml}, function(error, result){
				(error === null).should.equal(true);
				(result.uuid === undefined).should.equal(false);
				(result.xmlconfig === undefined).should.equal(false);

				test_uuid = result.uuid;

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


	  describe('delete_vm function', function(){

		it('cause error on not setting uuid', function(done){
			vm_handler.handle('delete_vm', {}, function(error, result){
				(error === null).should.equal(false);
				error.should.equal("No UUID set");

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

})
