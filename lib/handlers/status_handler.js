/*
 * Handles requests for server information and status
 */
var os = require("os");

module.exports = {
	handle: function(command, params, callback) {
		switch (command) {
			case "status":
				callback(null, status());
				break;
			case "usage":
				callback(null, usage());
				break;
		}
	},
	handles: function(command) {
		console.log(command);
		valid_commands = ['status', 'usage', 'disk', 'systeminfo']
		return valid_commands.indexOf(command) !== -1;
	},
	status: status,
	usage: usage
}

function status() {
	return {
		"uptime": os.uptime(),
		"system": os.platform(),
		"release": os.release(),
		"hostname": os.hostname()
	};
}

function usage() {
	return {
		"total": os.totalmem(),
		"free": os.freemem(),
		"load_avg": os.loadavg(),
		"cpu_data": os.cpus()
	}
}
