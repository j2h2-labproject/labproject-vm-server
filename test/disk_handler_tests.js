var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var disk_handler = require(LABPROJECT_LIB + "/handlers/disk_handler");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('disk_handler Object:', function(){

    describe('handles function', function(){

        before(function(done) {
            fs.mkdir(config.pool_path, function(error, result) {
                done();
            });
        });

        it('should handle expected functions', function(){
            //, 'list_snapshots', 'start', 'end', 'suspend', 'set_config', 'get_config', 'restore_snapshot', 'make_snapshot', 'console'
            disk_handler.handles('disk_exists').should.be.true;
            disk_handler.handles('create_disk').should.be.true;
            disk_handler.handles('vm_exists').should.be.false;
        });

    });

    describe('get_disk_space function', function(){

        it('should get disk space data', function(done){

            disk_handler.handle('get_disk_space', {}, function(error, result){
                (error === null).should.equal(true);
                result.available.should.not.equal(0);
                result.free.should.not.equal(0);
                done();
            });
        });

    });

    POOL_PATH = "/tmp/"
    DISK_NAME = "TEST_DISK";
    DISK_PATH = '{STORAGE_POOL}/' + DISK_NAME + '.vdi';

    describe('create_disk function', function(){

        it('cause error on not setting XML config', function(done){
            disk_handler.handle('create_disk', {}, function(error, result){
                (error == null).should.equal(false);
                error.should.equal("Parameters not set");
                done();
            });
        });

        it('should create a disk', function(done){

            disk_handler.handle('create_disk', {diskname: DISK_NAME, size: 1, format: 'vdi'}, function(error, result){
                (error === null).should.equal(true);
                result.should.equal(true);
                fs.stat(config.pool_path + "/" + DISK_NAME, function(error, stat) {
                    (error === null).should.equal(true);
                    done();
                });
                
            });
        });

    });

    describe('disk_exists function', function(){

        it('cause error on no drive name', function(done){
            disk_handler.handle('disk_exists', {}, function(error, result){
                (error === null).should.equal(false);
                error.should.equal("Disk name is not set");
                done();
            });
        });

        it('show an error for disk that does not exist', function(done){
            disk_handler.handle('disk_exists', {diskname: "not_here"}, function(error, result){
                (error == null).should.equal(true);
                result.should.be.false;
                done();
            });
        });

        it('return true for a disk that exists', function(done){
            disk_handler.handle('disk_exists', {diskname: DISK_NAME}, function(error, result){
                (error == null).should.equal(true);
                result.should.be.true;
                done();
            });
        });

    });

    describe('disk_info function', function(){

        it('cause error on no drive name', function(done){
            disk_handler.handle('disk_info', {}, function(error, result){
                (error === null).should.equal(false);
                error.should.equal("Disk name is not set");
                done();
            });
        });

        it('show an error for disk that does not exist', function(done){
            disk_handler.handle('disk_info', {diskname: "not_here"}, function(error, result){
                (error == null).should.equal(false);
                error.should.equal("Disk not found");
                done();
            });
        });

        it('return data for a disk that exists', function(done){
            disk_handler.handle('disk_info', {diskname: DISK_NAME}, function(error, result){
                (error == null).should.equal(true);
                done();
            });
        });

    });


    describe('remove_disk function', function(){

        it('cause error on no drive name', function(done){
            disk_handler.handle('remove_disk', {}, function(error, result){
                (error === null).should.equal(false);
                error.should.equal("Disk name is not set");
                done();
            });
        });

        it('should create a disk', function(done){
            disk_handler.handle('remove_disk', {diskname: DISK_NAME}, function(error, result){
                (error == null).should.equal(true);
                result.should.be.true;

                done();
            });
        });

    });

})
