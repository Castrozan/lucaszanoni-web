import asyncio
import os
import signal
import struct
import fcntl
import termios
import pty
from http import HTTPStatus
from websockets.asyncio.server import serve
from websockets.http11 import Response
from websockets.datastructures import Headers

LISTEN_PORT = int(os.environ.get("LOCAL_COCKPIT_PORT", "7682"))
TMUX_EXECUTABLE = os.environ.get("LOCAL_COCKPIT_TMUX", "tmux")
TMUX_SESSION_NAME = os.environ.get("LOCAL_COCKPIT_SESSION", "cockpit-local")

INDEX_HTML = b"""<!doctype html>
<html><head><meta charset="utf-8"><title>Local Cockpit</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css">
<style>html,body{height:100%;margin:0;background:#1e1e2e}#terminal{height:100vh}</style>
</head><body><div id="terminal"></div>
<script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
<script>
  const term = new Terminal({ fontFamily: "monospace", cursorBlink: true,
    theme: { background: "#1e1e2e", foreground: "#cdd6f4" } });
  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("terminal"));
  fit.fit();
  const socket = new WebSocket("ws://" + location.host + "/attach");
  socket.binaryType = "arraybuffer";
  const encoder = new TextEncoder();
  socket.onmessage = (event) => term.write(new Uint8Array(event.data));
  term.onData((data) => { if (socket.readyState === 1) socket.send(encoder.encode(data)); });
  socket.onopen = () => term.focus();
  socket.onclose = () => term.write("\\r\\n[local cockpit session ended]\\r\\n");
  window.addEventListener("resize", () => fit.fit());
</script></body></html>
"""


def set_pseudoterminal_window_size(file_descriptor, rows, columns):
    fcntl.ioctl(
        file_descriptor, termios.TIOCSWINSZ, struct.pack("HHHH", rows, columns, 0, 0)
    )


async def attach_local_tmux_over_websocket(websocket_connection):
    master_file_descriptor, slave_file_descriptor = pty.openpty()
    set_pseudoterminal_window_size(master_file_descriptor, 40, 120)
    session_process = await asyncio.create_subprocess_exec(
        TMUX_EXECUTABLE,
        "new-session",
        "-A",
        "-s",
        TMUX_SESSION_NAME,
        stdin=slave_file_descriptor,
        stdout=slave_file_descriptor,
        stderr=slave_file_descriptor,
        start_new_session=True,
        env={**os.environ, "TERM": "xterm-256color"},
    )
    os.close(slave_file_descriptor)
    event_loop = asyncio.get_running_loop()

    async def stream_pseudoterminal_output_to_client():
        while True:
            try:
                output_bytes = await event_loop.run_in_executor(
                    None, os.read, master_file_descriptor, 65536
                )
            except OSError:
                break
            if not output_bytes:
                break
            try:
                await websocket_connection.send(output_bytes)
            except Exception:
                break

    async def stream_client_input_to_pseudoterminal():
        try:
            async for client_message in websocket_connection:
                if isinstance(client_message, (bytes, bytearray)):
                    os.write(master_file_descriptor, client_message)
        except Exception:
            pass

    output_task = asyncio.create_task(stream_pseudoterminal_output_to_client())
    input_task = asyncio.create_task(stream_client_input_to_pseudoterminal())
    session_wait_task = asyncio.create_task(session_process.wait())
    await asyncio.wait(
        {output_task, input_task, session_wait_task},
        return_when=asyncio.FIRST_COMPLETED,
    )
    for pending_task in (output_task, input_task, session_wait_task):
        pending_task.cancel()
    if session_process.returncode is None:
        try:
            session_process.send_signal(signal.SIGHUP)
        except ProcessLookupError:
            pass
    try:
        os.close(master_file_descriptor)
    except OSError:
        pass


def serve_index_for_non_attach_requests(server_connection, request):
    if request.path == "/attach":
        return None
    return Response(
        HTTPStatus.OK,
        "OK",
        Headers(
            [
                ("Content-Type", "text/html; charset=utf-8"),
                ("Content-Length", str(len(INDEX_HTML))),
            ]
        ),
        INDEX_HTML,
    )


async def run_local_cockpit():
    async with serve(
        attach_local_tmux_over_websocket,
        "127.0.0.1",
        LISTEN_PORT,
        process_request=serve_index_for_non_attach_requests,
    ):
        print(
            f"local cockpit: open http://127.0.0.1:{LISTEN_PORT}/ to drive your own tmux",
            flush=True,
        )
        await asyncio.Future()


if __name__ == "__main__":
    try:
        asyncio.run(run_local_cockpit())
    except KeyboardInterrupt:
        pass
