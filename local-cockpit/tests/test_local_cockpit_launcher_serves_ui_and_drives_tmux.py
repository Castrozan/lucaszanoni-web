import asyncio
import contextlib
import os
import pathlib
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

from websockets.asyncio.client import connect

LAUNCHER_PATH = pathlib.Path(__file__).resolve().parent.parent / "launcher.py"
ISOLATED_TMUX_SOCKET_NAME = "local-cockpit-s0-test"
ISOLATED_TMUX_SESSION_NAME = "local-cockpit-s0-test"
PSEUDOTERMINAL_ROUND_TRIP_MARKER = "S0CONTRACTPROOF"


def find_free_loopback_port():
    probe_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    probe_socket.bind(("127.0.0.1", 0))
    chosen_port = probe_socket.getsockname()[1]
    probe_socket.close()
    return chosen_port


def write_isolated_tmux_wrapper(directory):
    wrapper_path = pathlib.Path(directory) / "isolated-tmux"
    wrapper_path.write_text(
        f'#!/usr/bin/env bash\nexec tmux -L {ISOLATED_TMUX_SOCKET_NAME} "$@"\n'
    )
    wrapper_path.chmod(0o755)
    return wrapper_path


def wait_until_serving(base_http_url, timeout_seconds=15):
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        with contextlib.suppress(OSError):
            with urllib.request.urlopen(base_http_url + "/", timeout=1) as response:
                if response.status == 200:
                    return True
        time.sleep(0.2)
    return False


def assert_index_serves_user_interface(base_http_url):
    response = urllib.request.urlopen(base_http_url + "/", timeout=5)
    body = response.read().decode()
    assert response.status == 200, f"GET / returned status {response.status}"
    assert "text/html" in response.headers.get("Content-Type", ""), "GET / is not html"
    assert "Local Cockpit" in body, "GET / does not serve the cockpit UI"


async def assert_attach_streams_pseudoterminal_both_ways(base_websocket_url):
    async with connect(base_websocket_url + "/attach", max_size=None) as websocket:
        initial_output = await asyncio.wait_for(websocket.recv(), timeout=10)
        assert initial_output, "attach produced no initial PTY output"
        await websocket.send(f"echo {PSEUDOTERMINAL_ROUND_TRIP_MARKER}\n".encode())
        observed_output = bytearray()
        deadline = time.monotonic() + 10
        while PSEUDOTERMINAL_ROUND_TRIP_MARKER.encode() not in observed_output:
            if time.monotonic() > deadline:
                raise AssertionError("input never round-tripped back through the PTY")
            chunk = await asyncio.wait_for(websocket.recv(), timeout=10)
            observed_output += (
                chunk if isinstance(chunk, (bytes, bytearray)) else chunk.encode()
            )


async def run_launcher_contract_test():
    port = find_free_loopback_port()
    base_http_url = f"http://127.0.0.1:{port}"
    base_websocket_url = f"ws://127.0.0.1:{port}"
    with tempfile.TemporaryDirectory() as working_directory:
        tmux_wrapper_path = write_isolated_tmux_wrapper(working_directory)
        launcher_environment = {
            **os.environ,
            "LOCAL_COCKPIT_PORT": str(port),
            "LOCAL_COCKPIT_TMUX": str(tmux_wrapper_path),
            "LOCAL_COCKPIT_SESSION": ISOLATED_TMUX_SESSION_NAME,
        }
        launcher_process = subprocess.Popen(
            [sys.executable, str(LAUNCHER_PATH)],
            env=launcher_environment,
        )
        try:
            assert wait_until_serving(base_http_url), "launcher never started serving"
            assert_index_serves_user_interface(base_http_url)
            await assert_attach_streams_pseudoterminal_both_ways(base_websocket_url)
        finally:
            launcher_process.terminate()
            with contextlib.suppress(subprocess.TimeoutExpired):
                launcher_process.wait(timeout=5)
            launcher_process.kill()
            subprocess.run(
                [str(tmux_wrapper_path), "kill-server"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )


def test_local_cockpit_launcher_serves_ui_and_drives_tmux():
    asyncio.run(run_launcher_contract_test())


if __name__ == "__main__":
    test_local_cockpit_launcher_serves_ui_and_drives_tmux()
    print("PASS: local cockpit launcher serves the UI and drives tmux")
