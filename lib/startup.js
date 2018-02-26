/*

startup.js

Prepares and starts the vm server

*/
var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var fs = require("fs");

var hypervisor_util = require(LABPROJECT_LIB + "/util/hypervisor_util");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");

module.exports = {
    // Ensure necessary processes are running, manage our permission, and start the server
    start: function(config, logger, onstart, onstop, callback) {

        if (hypervisor_string.is_hypervisor(config.hypervisor)) {
            logger.log("notice", "Hypervisor: " + config.hypervisor);

            hypervisor_util.is_libvirt_running(function(error, result) {

                if (error==null) {

                    if (result == false) {
                        onstart(new Error("Libvirt is not running. Ensure libvirtd is running before start."), null, null);
                        return;
                    }


                    var transport_name = config.transport.name;
                    var transport = null;

                    logger.log("notice", "Starting transport '" + transport_name + "'");

                    try {
                        transport = require(LABPROJECT_LIB + "/transports/" + transport_name);
                    } catch (error) {
                        onstart(new Error("Could not load transport '" + transport_name + "'. Error was: " + error.message), null, null);
                        return;
                    }

                    if (transport == null) {
                        onstart(new Error("Did not load a transport"), null, null);
                    } else {
                        transport.start_transport(
                        logger, // Set transport logger
                        function(error, address, port) { // Set function to run on transport start
                            logger.log("notice", "Transport '" + transport_name + "' listening on address " + address);
                            logger.log("notice", "Dropping privileges");

                            try {
                                process.setuid(config.uid);

                                if (process.getuid() == 0 ) {
                                    onstart(new Error("Privileges did not drop. Exiting."), null, null);
                                } else {
                                    logger.log("debug", "Running as " + config.uid);
                                }

                            } catch (error) {
                                console.log(error);
                                onstart(new Error("Could not drop privileges. Exiting."), null, null);
                            }

                            onstart(null, address, port);

                        },
                        main_handler, // Set function to run on receiving data from clients
                        function(error, status) { // Set function to run on closing
                            logger.log("notice", "Transport '" + transport_name + "' is closing");
                        },
                        config.transport.config
                        );
                    }

                } else {
                    logger.log("error", "Could not determine if libvirtd was running");
                    logger.log("error", error);
                }
            });


        } else {
            logger.log("error", "Invalid hypervisor '" + config.hypervisor + "'");
            onstop(new Error("Invalid hypervisor"));
            return;
        }
    }
}


// Handler to give to transports to manage incoming data
function main_handler(error, logger, client_addr, data, writeback) {
    logger.log('debug', "Data from " + client_addr);
    // console.log(data);

    if (data.hasOwnProperty("get")) {
        fs.readdir("./lib/handlers", function (error, listing) {
            handler_list = [];
            for (i in listing) {
                if (listing[i].endsWith('.js')) {
                    handler_name = listing[i].replace(".js", "");
                    handler = require(LABPROJECT_LIB + "/handlers/" + handler_name);
                    handler.set_logger(logger);

                    if (handler.handles(data['get'])) {
                        var command = data['get'];
                        delete data['get'];

                        logger.log('debug', "Using handler " + handler_name);
                        logger.log('debug', "Function: " + command);

                        handler.handle(command, data, function(error, result) {

                            var return_data = {
                                got: command
                            }

                            if (!error) {
                                return_data['data'] = result;
                                return_data['error'] = null;
                                logger.log('debug', "Returning " + result);
                            } else {
                                return_data['data'] = null;
                                return_data['error'] = error;
                                logger.log('error', "Returning " + error);
                            }


                            writeback(return_data);

                        });
                        return;
                    }

                }
            }

            error_message = {
                "got": data['get'],
                "error": "INVALID_FUNCTION"
            }

            logger.log('error', "Got an invalid function call");
            writeback(error_message);

        });
    } else {
        error_message = {
            "got": null,
            "error": "NO_FUNCTION"
        }

        writeback(error_message);
    }



}
