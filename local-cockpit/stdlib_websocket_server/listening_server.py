import asyncio
import inspect
from http import HTTPStatus

from .connection import ConnectionClosed, WebSocketServerConnection
from .handshake import build_handshake_acceptance_response_bytes
from .request import HEADER_TERMINATOR, parse_handshake_request
from .response import Response, build_http_response_bytes


class WebSocketListeningServer:
    def __init__(self, connection_handler, host, port, process_request):
        self._connection_handler = connection_handler
        self._host = host
        self._port = port
        self._process_request = process_request
        self._asyncio_server = None

    async def __aenter__(self):
        self._asyncio_server = await asyncio.start_server(
            self._handle_accepted_client_stream, self._host, self._port
        )
        return self

    async def __aexit__(self, exception_type, exception_value, exception_traceback):
        self._asyncio_server.close()
        await self._asyncio_server.wait_closed()

    async def _handle_accepted_client_stream(self, stream_reader, stream_writer):
        try:
            await self._route_incoming_connection(stream_reader, stream_writer)
        except (
            ConnectionClosed,
            asyncio.IncompleteReadError,
            ConnectionResetError,
            BrokenPipeError,
        ):
            pass
        finally:
            try:
                stream_writer.close()
            except OSError:
                pass

    async def _route_incoming_connection(self, stream_reader, stream_writer):
        handshake_request = await self._read_handshake_request(stream_reader)
        if handshake_request is None:
            await self._write_plain_status_response(
                stream_writer, HTTPStatus.BAD_REQUEST
            )
            return
        connection = WebSocketServerConnection(
            stream_reader, stream_writer, handshake_request
        )
        if self._process_request is not None:
            process_request_result = self._process_request(
                connection, handshake_request
            )
            if inspect.isawaitable(process_request_result):
                process_request_result = await process_request_result
            if process_request_result is not None:
                stream_writer.write(build_http_response_bytes(process_request_result))
                await stream_writer.drain()
                return
        if handshake_request.headers.get("Sec-WebSocket-Key") is None:
            await self._write_plain_status_response(
                stream_writer, HTTPStatus.BAD_REQUEST
            )
            return
        client_websocket_key = handshake_request.headers["Sec-WebSocket-Key"]
        stream_writer.write(
            build_handshake_acceptance_response_bytes(client_websocket_key)
        )
        await stream_writer.drain()
        await self._connection_handler(connection)
        await connection.close()

    async def _read_handshake_request(self, stream_reader):
        try:
            raw_request_head = await stream_reader.readuntil(HEADER_TERMINATOR)
        except (asyncio.IncompleteReadError, asyncio.LimitOverrunError):
            return None
        return parse_handshake_request(raw_request_head)

    async def _write_plain_status_response(self, stream_writer, http_status):
        stream_writer.write(
            build_http_response_bytes(
                Response(int(http_status), http_status.phrase, [], b"")
            )
        )
        await stream_writer.drain()


def serve(connection_handler, host, port, *, process_request=None):
    return WebSocketListeningServer(connection_handler, host, port, process_request)
