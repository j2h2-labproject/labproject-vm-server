var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var should = require("should");
var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var status_handler = require(LABPROJECT_LIB + "/handlers/status_handler");

var LABPROJECT_COMMON_BASE = process.cwd();


describe('status_handler Object:', function(){

    describe('handles function', function(){

        it('should handle expected functions', function(){
            //, 'list_snapshots', 'start', 'end', 'suspend', 'set_config', 'get_config', 'restore_snapshot', 'make_snapshot', 'console'
            status_handler.handles('systeminfo').should.be.true;
            status_handler.handles('usage').should.be.true;
            status_handler.handles('resources').should.be.true;
            status_handler.handles('debugdump').should.be.true;
            status_handler.handles('vm_exists').should.be.false;
        });

    });

    describe('systeminfo function', function(){

        it('should get system info', function(done){

            status_handler.handle('systeminfo', {}, function(error, result){
                (error === null).should.equal(true);
                console.log(result);
                done();
            });
        });

    });

    describe('usage function', function(){
        it('should get usage info', function(done){
            status_handler.handle('usage', {}, function(error, result){
                (error === null).should.equal(true);
                console.log(result);
                done();
            });
        });
    });

    describe('debugdump function', function(){
        it('should get debugdump info', function(done){
            status_handler.handle('debugdump', {}, function(error, result){
                console.log(error);
                (error === null).should.equal(true);
                console.log(result);
                done();
            });
        });
    });

    describe('resources function', function(){

        it('should get system resources', function(done){
            status_handler.handle('resources', {}, function(error, result){
                (error === null).should.equal(true);
                console.log(result);
                done();
            });
        });

    });

})
