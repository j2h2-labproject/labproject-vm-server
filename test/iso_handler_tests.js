var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var iso_handler = require(LABPROJECT_LIB + "/handlers/iso_handler");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('iso_handler Object:', function(){
	
	describe('handles function', function(){
	  
		it('should handle expected functions', function(){
			iso_handler.handles('list').should.be.true; 
			iso_handler.handles('download_http').should.be.true;
		});
		
	});
	
	describe('list_isos function', function(){
	  
		beforeEach(function(done) {
			fs.readdir(config.iso_path, function(error, list) {
				if (error) {
					fs.mkdirSync(config.iso_path, 0o770)
				} 
				
				fs.writeFileSync(config.iso_path + "/test1.iso", "hi");
				fs.writeFileSync(config.iso_path + "/test2.iso", "hi");
				fs.writeFileSync(config.iso_path + "/hidden", "hi");
				done();
			});
		});
		
		afterEach(function() {
			fs.unlink(config.iso_path + "/test1.iso");
			fs.unlink(config.iso_path + "/test2.iso");
			fs.unlink(config.iso_path + "/hidden");
		});
		
// Begin tests

		it('should return a list of ISOs (via handle function)', function(done){
			iso_handler.handle('list', {}, function(error, list){
				(error == null).should.be.true;
				list.should.containDeep(['test1', 'test2']);
				list.should.not.containDeep(['hidden']);
				
				done();
			});
		});
		
	  });
	  
})

