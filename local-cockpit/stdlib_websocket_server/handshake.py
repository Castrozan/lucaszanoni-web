import base64
import hashlib

WEBSOCKET_ACCEPT_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def compute_websocket_accept_value(client_websocket_key):
    accept_value_source = (client_websocket_key + WEBSOCKET_ACCEPT_MAGIC_GUID).encode(
        "ascii"
    )
    return base64.b64encode(hashlib.sha1(accept_value_source).digest()).decode("ascii")


def build_handshake_acceptance_response_bytes(client_websocket_key):
    computed_accept_value = compute_websocket_accept_value(client_websocket_key)
    handshake_response_lines = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        f"Sec-WebSocket-Accept: {computed_accept_value}",
        "",
        "",
    ]
    return "\r\n".join(handshake_response_lines).encode("latin-1")
