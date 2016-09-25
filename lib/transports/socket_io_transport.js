var io = require('socket.io');

module.exports = {
	start_transport: function (logger, on_start, on_data, on_end, config) {


		try {

			var server = io.listen(config.port);

			server.on('connection', function (socket) {
				io_handle(socket, on_data, logger, config.clientkey);

			});

			server.on("error", function(error) {
				console.log(error);
			});

			on_start(null, "0.0.0.0", config.port);
		} catch (error) {
			console.log(error);

		}


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
function io_handle(socket, on_data, logger, clientkey) {

		var client_address = socket.request.connection.remoteAddress;

		logger.log("notice", "Client connection from " + client_address);

		socket.on('disconnect', function() {
			logger.log("notice", "Client from " + client_address + " disconnected");
		});

		socket.on('server_request', function(data) {

			console.log(data);

			if (data != null && data.clientkey && data.payload && data.transact_id) {

				if (data.clientkey == clientkey) {
					on_data(null, logger, client_address, data.payload, function(res_data) {

						var return_data = {
							clientkey: clientkey,
							error: null,
							transact_id: data.transact_id,
							payload: res_data,
						};

						socket.emit("server_response", return_data);

					});
				} else {

					error_response = {
						clientkey: null,
						error: "SOCKET_IO_TRANSPORT_AUTH_FAILED",
						transact_id: data.transact_id,
						payload: null
					}

					socket.emit("server_response", error_response);
				}

			} else {

				error_response = {
					clientkey: null,
					error: "SOCKET_IO_TRANSPORT_INVALID_REQUEST",
					transact_id: null,
					payload: null
				}

				socket.emit("server_response", error_response);
			}


		});


}
