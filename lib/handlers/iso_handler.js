/*
 * Handles ISO requests on VM server
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var logger = null;

module.exports = {
  set_logger: function(input_logger) {
		logger = input_logger;
	},
  handle: function(operation, params, callback) {
		switch (operation) {
			case "list":
				list_isos(callback);
				break;
			default:
				callback("Invalid operation", null);
		}
	},
	handles: function(operation) {
		valid_operations = ['list', 'download_http']
		return valid_operations.indexOf(operation) !== -1;
	},
	list_isos: list_isos

}

/*
 * Returns a list of ISOs in the config.iso_path directory.
 * Only .iso files are returned without the file suffix.
 */
function list_isos(callback) {

	fs.readdir(config.iso_path, function(error, list) {
		if (error) {
			callback("Could not list ISO directory", null);
		} else {

			return_list = []

			for (key in list) {
				iso_item = list[key];
				if (iso_item.indexOf(".iso")!==-1) {
					return_list.push(iso_item.replace(".iso", ""));
				}
			}
			callback(null, return_list);
		}


	});
}

/*
 * Downloads an ISO via HTTP
 */
function download_http(url, callback) {

}
