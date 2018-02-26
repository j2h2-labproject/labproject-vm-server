var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var iso_handler = require(LABPROJECT_LIB + "/handlers/iso_handler");

var LABPROJECT_COMMON_BASE = process.cwd();

const tinycore_url = "http://distro.ibiblio.org/tinycorelinux/8.x/x86/release/Core-current.iso";

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
            fs.unlinkSync(config.iso_path + "/test1.iso");
            fs.unlinkSync(config.iso_path + "/test2.iso");
            fs.unlinkSync(config.iso_path + "/hidden");
        });

// Begin tests

        it('should return a list of ISOs (via handle function)', function(done){
            iso_handler.handle('list_isos', {}, function(error, list){
                (error == null).should.be.true;
                list.should.containDeep(['test1', 'test2']);
                list.should.not.containDeep(['hidden']);

                done();
            });
        });

        it('should download tinycore', function(done){
            this.timeout(40000);
            iso_handler.handle('download_http', {"url": tinycore_url, "filename": "tinycore"}, function(error, result) {
                (error == null).should.be.true;
                (result === true).should.value.true;
                iso_handler.handle('list_isos', {}, function(error, list){
                    (error == null).should.be.true;
                    list.should.containDeep(['tinycore', 'test2']);
                    
                    done();
                });
            });
        });

        it('should get tinycore size', function(done){
            iso_handler.handle('get_iso_size', {"filename": "tinycore"}, function(error, size) {
                (error === null).should.be.true;
                (size > 5000000).should.value.true;
                done();
            });
        });

        it('should delete tinycore', function(done){
            this.timeout(40000);
            iso_handler.handle('delete_iso', {"filename": "tinycore"}, function(error, result) {
                (error == null).should.be.true;
                (size === true).should.value.true;
                iso_handler.handle('list_isos', {}, function(error, list){
                    (error == null).should.be.true;
                    list.should.not.containDeep(['tinycore']);
                    
                    done();
                });
            });
        });

      });
});
