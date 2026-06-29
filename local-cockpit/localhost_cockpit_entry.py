import asyncio
import os

from local_cockpit_assets import XTERM_CSS_BYTES, XTERM_JS_BYTES
from localhost_cockpit_index_html import LOCALHOST_COCKPIT_INDEX_HTML
from server import handle_bridge_websocket_connection
from settings import CockpitSessionBridgeSettings, read_request_origin
from stdlib_websocket_server import Response, serve

LISTEN_ADDRESS = "127.0.0.1"
LISTEN_PORT = int(os.environ.get("LOCAL_COCKPIT_PORT", "7682"))
LOCAL_TMUX_EXECUTABLE_PATH = os.environ.get("LOCAL_COCKPIT_TMUX", "tmux")

LOCALHOST_COCKPIT_SETTINGS = CockpitSessionBridgeSettings(
    listen_address=LISTEN_ADDRESS,
    listen_port=LISTEN_PORT,
    session_command=["tmux", "new-session", "-A", "-s", "cockpit-local"],
    allowed_request_origin="",
    terminal_type="xterm-256color",
    cockpit_tmux_executable_path=LOCAL_TMUX_EXECUTABLE_PATH,
    cockpit_tmux_enumeration_socket_name="",
    cockpit_tmux_mutation_socket_name="cockpit",
    cockpit_tmux_remote_ssh_host="",
)

ALLOWED_LOOPBACK_ORIGINS = {
    f"http://localhost:{LISTEN_PORT}",
    f"http://127.0.0.1:{LISTEN_PORT}",
}

INDEX_HTML_BYTES = LOCALHOST_COCKPIT_INDEX_HTML.encode("utf-8")


async def attach_or_reject_loopback_websocket_connection(websocket_connection):
    request_origin = read_request_origin(websocket_connection)
    if request_origin not in ALLOWED_LOOPBACK_ORIGINS:
        await websocket_connection.close(1008, "origin not allowed")
        return
    await handle_bridge_websocket_connection(
        websocket_connection, LOCALHOST_COCKPIT_SETTINGS, asyncio.get_running_loop()
    )


def serve_vendor_asset_or_index_or_upgrade(websocket_connection, handshake_request):
    if handshake_request.headers.get("Upgrade", "").lower() == "websocket":
        return None
    if handshake_request.path == "/xterm.css":
        return Response(
            200,
            "OK",
            [("Content-Type", "text/css; charset=utf-8")],
            XTERM_CSS_BYTES,
        )
    if handshake_request.path == "/xterm.js":
        return Response(
            200,
            "OK",
            [("Content-Type", "application/javascript; charset=utf-8")],
            XTERM_JS_BYTES,
        )
    return Response(
        200,
        "OK",
        [("Content-Type", "text/html; charset=utf-8")],
        INDEX_HTML_BYTES,
    )


async def run_localhost_cockpit_server():
    async with serve(
        attach_or_reject_loopback_websocket_connection,
        LISTEN_ADDRESS,
        LISTEN_PORT,
        process_request=serve_vendor_asset_or_index_or_upgrade,
    ):
        await asyncio.Future()


def main():
    print(f"local cockpit listening on http://{LISTEN_ADDRESS}:{LISTEN_PORT}")
    asyncio.run(run_localhost_cockpit_server())


if __name__ == "__main__":
    main()
