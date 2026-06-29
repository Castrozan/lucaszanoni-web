LOCALHOST_COCKPIT_INDEX_HTML = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Local Cockpit</title>
<link rel="stylesheet" href="/xterm.css" />
<style>
  html, body { margin: 0; height: 100%; background: #0b0e14; }
  #terminal { position: absolute; inset: 0; padding: 8px; box-sizing: border-box; }
</style>
</head>
<body>
<div id="terminal"></div>
<script src="/xterm.js"></script>
<script>
  const terminal = new Terminal({
    cursorBlink: true,
    fontFamily: "Menlo, Monaco, monospace",
    fontSize: 13,
    theme: { background: "#0b0e14" }
  });
  const fitAddon = new FitAddon.FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(document.getElementById("terminal"));
  fitAddon.fit();

  const textEncoder = new TextEncoder();
  const attachSocket = new WebSocket("ws://" + location.host + "/attach");
  attachSocket.binaryType = "arraybuffer";

  function sendTerminalWindowSize() {
    fitAddon.fit();
    attachSocket.send(JSON.stringify({
      type: "resize",
      columns: terminal.cols,
      rows: terminal.rows
    }));
  }

  attachSocket.onopen = function () {
    sendTerminalWindowSize();
    terminal.focus();
  };
  attachSocket.onmessage = function (messageEvent) {
    terminal.write(new Uint8Array(messageEvent.data));
  };
  attachSocket.onclose = function () {
    terminal.write("\\r\\n[connection closed]\\r\\n");
  };

  terminal.onData(function (terminalInput) {
    attachSocket.send(textEncoder.encode(terminalInput));
  });
  window.addEventListener("resize", function () {
    if (attachSocket.readyState === WebSocket.OPEN) {
      sendTerminalWindowSize();
    }
  });
</script>
</body>
</html>
"""
