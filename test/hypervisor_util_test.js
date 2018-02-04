var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = LABPROJECT_BASE + "/lib";
var hypervisor_util = require(LABPROJECT_LIB + '/util/hypervisor_util');

var should = require("should");
var fs = require("fs");

describe('hypervisor_util Object:', function(){


    describe('is_available', function(){

        available_count = 0;

        it('check KVM', function(done){

            hypervisor_util.is_available('qemu', function(error, result) {
                if (result == false) {
                    console.log("KVM is not installed");
                } else if (result == true) {
                    available_count += 1;
                } else {
                    should.fail("Result should be true or false");
                }
                done();
            });


        });

        it('check VirtualBox', function(done){

            hypervisor_util.is_available('vbox', function(error, result) {
                if (result == false) {
                    console.log("VirtualBox is not installed");
                } else if (result == true) {
                    available_count += 1;
                } else {
                    should.fail("Result should be true or false");
                }
                done();

            });

        });

        it('Has a hypervisor installed', function(){

            (available_count > 0).should.be.true;

        });


    });

    describe('is_libvirt_running', function(){

        it('check if libvirt is running', function(done){

            hypervisor_util.is_libvirt_running(function(error, result) {
                if (result == false) {
                    should.fail("Libvirt should be running for the tests");
                } else if (result == true) {

                } else {
                    should.fail("Result should be true or false");
                }
                done();
            });


        });


    });


});
