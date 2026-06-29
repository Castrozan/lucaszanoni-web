import asyncio
import base64
import hashlib
import os
import pathlib
import socket
import sys

LOCAL_COCKPIT_DIRECTORY = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LOCAL_COCKPIT_DIRECTORY))

from stdlib_websocket_server import Response, serve

WEBSOCKET_ACCEPT_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
INDEX_HTML_BODY = b"<!doctype html><html><body>Local Cockpit</body></html>"
TEXT_MESSAGE_TO_ECHO = "hello stdlib websocket"
BINARY_MESSAGE_TO_ECHO = b"\x00\x01\x02\xfffinal byte run"

OPCODE_TEXT = 0x1
OPCODE_BINARY = 0x2
OPCODE_CONNECTION_CLOSE = 0x8
FINAL_FRAGMENT_BIT = 0x80
MASK_BIT = 0x80
NORMAL_CLOSURE_STATUS_CODE = 1000


def find_free_loopback_port():
    probe_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe_socket.bind(("127.0.0.1", 0))
    chosen_port = probe_socket.getsockname()[1]
    probe_socket.close()
    return chosen_port


async def echo_every_message_back(connection):
    async for incoming_message in connection:
        await connection.send(incoming_message)


def respond_with_index_or_upgrade(connection, handshake_request):
    if handshake_request.path == "/ws":
        return None
    return Response(
        200,
        "OK",
        [("Content-Type", "text/html; charset=utf-8")],
        INDEX_HTML_BODY,
    )


def compute_expected_accept_value(client_websocket_key):
    accept_value_source = (client_websocket_key + WEBSOCKET_ACCEPT_MAGIC_GUID).encode(
        "ascii"
    )
    return base64.b64encode(hashlib.sha1(accept_value_source).digest()).decode("ascii")


def build_masked_client_frame(frame_opcode, frame_payload):
    frame_bytes = bytearray()
    frame_bytes.append(FINAL_FRAGMENT_BIT | frame_opcode)
    payload_length = len(frame_payload)
    if payload_length < 126:
        frame_bytes.append(MASK_BIT | payload_length)
    elif payload_length < 65536:
        frame_bytes.append(MASK_BIT | 126)
        frame_bytes += payload_length.to_bytes(2, "big")
    else:
        frame_bytes.append(MASK_BIT | 127)
        frame_bytes += payload_length.to_bytes(8, "big")
    masking_key = os.urandom(4)
    frame_bytes += masking_key
    masked_payload = bytes(
        payload_byte ^ masking_key[byte_index % 4]
        for byte_index, payload_byte in enumerate(frame_payload)
    )
    return bytes(frame_bytes) + masked_payload


async def read_unmasked_server_frame(stream_reader):
    first_two_header_bytes = await stream_reader.readexactly(2)
    frame_opcode = first_two_header_bytes[0] & 0x0F
    payload_length = first_two_header_bytes[1] & 0x7F
    if payload_length == 126:
        payload_length = int.from_bytes(await stream_reader.readexactly(2), "big")
    elif payload_length == 127:
        payload_length = int.from_bytes(await stream_reader.readexactly(8), "big")
    frame_payload = (
        await stream_reader.readexactly(payload_length) if payload_length else b""
    )
    return frame_opcode, frame_payload


async def perform_websocket_handshake(stream_reader, stream_writer):
    client_websocket_key = base64.b64encode(os.urandom(16)).decode("ascii")
    handshake_request_lines = [
        "GET /ws HTTP/1.1",
        "Host: 127.0.0.1",
        "Upgrade: websocket",
        "Connection: Upgrade",
        f"Sec-WebSocket-Key: {client_websocket_key}",
        "Sec-WebSocket-Version: 13",
        "",
        "",
    ]
    stream_writer.write("\r\n".join(handshake_request_lines).encode("latin-1"))
    await stream_writer.drain()
    raw_response_head = await stream_reader.readuntil(b"\r\n\r\n")
    decoded_response_head = raw_response_head.decode("latin-1")
    response_head_lines = decoded_response_head.split("\r\n")
    assert "101" in response_head_lines[0], (
        f"unexpected status line: {response_head_lines[0]}"
    )
    returned_accept_value = None
    for response_header_line in response_head_lines[1:]:
        header_name, _, header_value = response_header_line.partition(":")
        if header_name.strip().lower() == "sec-websocket-accept":
            returned_accept_value = header_value.strip()
    assert returned_accept_value == compute_expected_accept_value(
        client_websocket_key
    ), "Sec-WebSocket-Accept did not match the RFC6455 computation"


async def assert_websocket_echo_round_trips(port):
    stream_reader, stream_writer = await asyncio.open_connection("127.0.0.1", port)
    try:
        await perform_websocket_handshake(stream_reader, stream_writer)

        stream_writer.write(
            build_masked_client_frame(OPCODE_TEXT, TEXT_MESSAGE_TO_ECHO.encode("utf-8"))
        )
        await stream_writer.drain()
        echoed_text_opcode, echoed_text_payload = await read_unmasked_server_frame(
            stream_reader
        )
        assert echoed_text_opcode == OPCODE_TEXT, "text echo returned a non-text opcode"
        assert echoed_text_payload.decode("utf-8") == TEXT_MESSAGE_TO_ECHO, (
            "text payload did not round-trip"
        )

        stream_writer.write(
            build_masked_client_frame(OPCODE_BINARY, BINARY_MESSAGE_TO_ECHO)
        )
        await stream_writer.drain()
        echoed_binary_opcode, echoed_binary_payload = await read_unmasked_server_frame(
            stream_reader
        )
        assert echoed_binary_opcode == OPCODE_BINARY, (
            "binary echo returned a non-binary opcode"
        )
        assert echoed_binary_payload == BINARY_MESSAGE_TO_ECHO, (
            "binary payload did not round-trip"
        )

        stream_writer.write(
            build_masked_client_frame(
                OPCODE_CONNECTION_CLOSE,
                NORMAL_CLOSURE_STATUS_CODE.to_bytes(2, "big"),
            )
        )
        await stream_writer.drain()
    finally:
        stream_writer.close()


async def assert_index_route_serves_html(port):
    stream_reader, stream_writer = await asyncio.open_connection("127.0.0.1", port)
    try:
        stream_writer.write(
            b"GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n"
        )
        await stream_writer.drain()
        raw_response = await stream_reader.read()
        response_head, _, response_body = raw_response.partition(b"\r\n\r\n")
        status_line = response_head.split(b"\r\n")[0]
        assert b"200" in status_line, f"GET / returned: {status_line!r}"
        assert b"text/html" in response_head.lower(), (
            "GET / did not advertise text/html"
        )
        assert response_body == INDEX_HTML_BODY, "GET / did not serve the index body"
    finally:
        stream_writer.close()


async def run_stdlib_websocket_server_contract_test():
    port = find_free_loopback_port()
    async with serve(
        echo_every_message_back,
        "127.0.0.1",
        port,
        process_request=respond_with_index_or_upgrade,
    ):
        await assert_index_route_serves_html(port)
        await assert_websocket_echo_round_trips(port)


def test_stdlib_websocket_server_serves_index_and_echoes_frames():
    asyncio.run(run_stdlib_websocket_server_contract_test())


if __name__ == "__main__":
    test_stdlib_websocket_server_serves_index_and_echoes_frames()
    print(
        "PASS: stdlib websocket server serves the index and echoes text and binary frames"
    )
