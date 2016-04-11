var net = require("net");

module.exports = {
	start_transport: function (logger, on_start, on_data, on_end, config) {
		
		var server = net.createServer(function (socket) {
			tcp_handle(socket,  on_data, logger, config.clientkey);
		});

		server.on('close', function(){
			on_end(0);
		});
		
		server.listen(config.port, function() {
			on_start(null, server.address());
		});
		
	}
}

/*
 * {
 * key: "",
 * payload: 
 * }
 * 
 * 
 */
function tcp_handle(socket, on_data, logger, clientkey) {
		logger.log("notice", "Connection from " + socket.remoteAddress);
		
		socket.on('end', function() {
			logger.log("notice", "Disconnected from " + socket.remoteAddress);
		});
		
		socket.on('data', function(data) {
			data_string = data.toString();
			
			try {
				parsed = JSON.parse(data_string);
				
				if (parsed['key'] == clientkey) {
					on_data(null, socket.remoteAddress, parsed.payload, function(data) {
						var return_data = {
							key: clientkey,
							payload: data
						};
						writeJSON(socket, return_data);
					});
				} else {
					error_message = {
						"key": null,
						"error": "Invalid key",
					}
					
					writeJSON(socket, error_message);
					
				}
			
				
			} catch (e) {
				logger.log("error", "Invalid message from " + socket.remoteAddress);
			}
			
		});
	
		socket.write('LabProject VM-Server\n');
}

function writeJSON(socket, input) {
	socket.write(JSON.stringify(input));
}
