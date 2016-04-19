var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var config = require(LABPROJECT_BASE + "/config");
var fs = require("fs");

var hypervisor_util = require(LABPROJECT_LIB + "/hypervisor_util");
var hypervisor_string = require(LABPROJECT_LIB + "/common/hypervisor_string");
var logging = require(LABPROJECT_LIB + "/common/logging");


module.exports = {
	// Ensure necessary processes are running, manage our permission, and start the server
	start: function(config, onstart, onstop, callback) {

		logger = new logging.logger("INNER_SERVER", "cli");

		if (hypervisor_string.is_hypervisor(config.hypervisor)) {
			logger.log("notice", "Hypervisor: " + config.hypervisor);

			hypervisor_util.is_libvirt_running(function(error, result) {

				if (error==null) {

					if (result == false) {
						logger.log("error", "Libvirt is not running. Ensure libvirtd is running before start.");
						return;
					}


					var transport_name = config.transport.name;
					var transport = null;

					logger.log("notice", "Starting transport '" + transport_name + "'");

					try {
						transport = require(LABPROJECT_LIB + "/transports/" + transport_name);
					} catch (error) {
						logger.log("error", "Could not load transport '" + transport_name + "'");
						return;
					}

					if (transport == null) {
						logger.log("error", "Did not load a transport");
					} else {
						transport.start_transport(
						logger, // Set transport logger
						function(error, address) { // Set function to run on transport start
							logger.log("notice", "Transport '" + transport_name + "' listening on address " + address);

							logger.log("notice", "Dropping privileges");

							try {
								process.setuid(config.uid);

								if (process.getuid() == 0 ) {
									logger.log("error", "Privileges did not drop. Exiting.");
									process.exit(1);
								} else {
									logger.log("debug", "Running as " + config.uid);
								}

							} catch (error) {
								console.log(error);
								logger.log("error", "Could not drop privileges. Exiting.");
								process.exit(1);
							}


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



function main_handler(error, client_addr, data, writeback) {
	console.log("Data from " + client_addr);
	console.log(data);

	if (data.hasOwnProperty("get")) {
		fs.readdir("./lib/handlers", function (error, listing) {
			handler_list = [];
			for (i in listing) {
				if (listing[i].endsWith('.js')) {
					handler_name = listing[i].replace(".js", "");
					handler = require(LABPROJECT_LIB + "/handlers/" + handler_name);

					if (handler.handles(data['get'])) {
						var command = data['get'];
						delete data['get'];

						handler.handle(command, data, function(error, result) {

							var return_data = {
								got: command
							}

							if (!error) {
								return_data['data'] = result;
								return_data['error'] = null;
								writeback(return_data);
							} else {
								return_data['data'] = null;
								return_data['error'] = error;
								writeback(return_data);
							}
						});
						return;
					}

				}
			}

			error_message = {
				"got": data['get'],
				"error": "INVALID_FUNCTION"
			}

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
