/*
interfaces.js

Utility functions for managing interfaces via 'ip' command.

*/
var LABPROJECT_BASE = process.cwd();
var LABPROJECT_LIB = process.cwd() + "/lib";

var sanitize = require(LABPROJECT_LIB + "/common/sanitize");
var command = require(LABPROJECT_LIB + "/common/command");

var os = require("os");

module.exports = {
  create_tap_interface: function(name, callback) {
    if (name === undefined) {
      callback("No device name set", null);
    } else {
      name = sanitize.simple_string(name);

      command.run("sudo", ["ip", "tuntap", "add", "dev", name, "mode", "tap"], function(error, stdout, stderr) {
        if (!error) {
          command.run("sudo", ["ip", "link", "set", "dev", name, "up"], function(error, stdout, stderr) {
            if (!error) {
              callback(null, true);
            } else {
              callback("Could not create tap device", null);
            }
          });
        } else if (error && error.message.indexOf("Device or resource busy") != -1) {
          callback("Device already exists", null);
        } else {
          callback("Could not create tap device", null);
        }

      });
    }
  },
  remove_tap_interface: function(name, callback) {
      if (name === undefined) {
          callback("No device name set", null);
      } else {
          name = sanitize.simple_string(name);

          command.run("sudo", ["ip", "link", "delete", name], function(error, stdout, stderr) {
              if (!error) {
                  callback(null, true);
              } else {
                  callback("Could not remove tap device", null);
              }

          });
      }
  }
};
