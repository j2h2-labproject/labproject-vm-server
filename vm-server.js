var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

config = require(LABPROJECT_BASE + "/config")
startup = require(LABPROJECT_LIB + "/startup")
logging = require(LABPROJECT_LIB + "/common/logging")
//~ startup = require

var logger = new logging.logger("VM_SERVER", "cli");

// Start the server
startup.start(config, logger, function(error, address, port) {
	if (!error) {
		logger.log("success", "Server has started at " + address + ":" + port, function(){});
	} else {
		logger.log("error", error.message, function(){});
		logger.log("error", "Server failed to start", function(){});
		process.exit(1);
	}


}, function(exitstatus) {
	if (exitstatus == null) {
		logger.log("notice", "Server has stopped", function(){})
	} else {
		logger.log("warning", "Server has stopped with an error", function(){})
	}

});
