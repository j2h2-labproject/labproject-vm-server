/*
 * Handles ISO requests on VM server
 */

var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var fs = require("fs");
var config = require(LABPROJECT_BASE + "/config");

var downloader = require('download-file');

var logger = null;

module.exports = {
    set_logger: function(input_logger) {
        logger = input_logger;
    },
    handle: function(operation, params, callback) {
        switch (operation) {
            case "list_isos":
                list_isos(callback);
                break;
            case "download_http":
                download_http(params['url'], params['filename'], callback);
                break;
            case "iso_full_path":
                iso_full_path(params['filename'], callback);
                break;
            case "get_iso_size":
                get_iso_size(params['filename'], callback);
                break;
            case "delete_iso":
                delete_iso(params['filename'], callback);
                break;
            default:
                callback("Invalid operation", null);
        }
    },
    handles: function(operation) {
        valid_operations = ['list_isos', 'download_http', 'iso_full_path', "delete_iso", "get_iso_size"]
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
            return_list = [];
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
function download_http(url, filename, callback) {
    // Ensure we have our file extension
    if (filename.indexOf(".iso")==-1) {
        filename = filename + ".iso";
    }
    options = {
        directory: config.iso_path,
        filename: filename
    };
    try {
        downloader(url, options, function(error) {
            if (!error) {
                callback(null, true);
            } else {
                callback(error.message, null);
            }
        });
    } catch (err) {
        callback(err.message, null);
    }
}

/*
 * Gets the full path of the ISO
 */
function iso_full_path(filename, callback) {
    if (filename.indexOf(".iso")==-1) {
        filename = filename + ".iso";
    }
    var full_path = config.iso_path + "/" + filename;
    if (fs.existsSync(full_path)) {
        callback(null, full_path);
    } else {
        callback("ISO does not exist", null);
    }
}

function delete_iso(filename, callback) {
    try {
        iso_full_path(filename, function(error, full_path) {
            fs.unlink(full_path, function(fserror){
                if (!error){
                    callback(null, true);
                } else {
                    callback(fserror.message, null);
                }
            });
        });
    } catch (TypeError) {
        console.log("Invalid filename: ", filename);
        callback("Invalid filename", null);
    }
    
}

function get_iso_size(filename, callback) {
    iso_full_path(filename, function(error, full_path){
        if (!error) {
            fs.stat(full_path, function(error, stat){
                if (!error) {
                    callback(null, stat.size);
                } else {
                    callback(error.message, null);
                }
            });
        } else {
            callback(error, null);
        }
    });
}

