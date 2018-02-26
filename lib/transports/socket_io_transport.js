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

        socket.on('server_request', function(req_data, response) {

            console.log(req_data);

            if (req_data != null && req_data.clientkey && req_data.payload) {
                // Authenticate the request
                if (req_data.clientkey == clientkey) {
                    on_data(null, logger, client_address, req_data.payload, function(result_data) {

                        var return_data = {
                            clientkey: clientkey,
                            error: null,
                            payload: result_data,
                        };

                        response(return_data);

                    });
                } else {

                    error_response = {
                        clientkey: null,
                        error: "SOCKET_IO_TRANSPORT_AUTH_FAILED",
                        payload: null
                    }

                    response(return_data);
                }

            } else {

                error_response = {
                    clientkey: null,
                    error: "SOCKET_IO_TRANSPORT_INVALID_REQUEST",
                    payload: null
                }

                response(return_data);
            }
        });
}
