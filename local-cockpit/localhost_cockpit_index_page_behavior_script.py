LOCALHOST_COCKPIT_INDEX_PAGE_SCRIPT = """<script>
  const sessionListView = document.getElementById("session-list-view");
  const terminalView = document.getElementById("terminal-view");
  const sessionListContainer = document.getElementById("session-list");
  const emptyHint = document.getElementById("empty-hint");
  const activeSessionLabel = document.getElementById("active-session-name");
  const textEncoder = new TextEncoder();

  let lifecycleControlPath = "/cockpit/lifecycle";
  let activeTerminal = null;
  let activeFitAddon = null;
  let activeAttachSocket = null;
  let activeWindowResizeHandler = null;

  function renderSessionRows(sessions) {
    sessionListContainer.innerHTML = "";
    emptyHint.classList.toggle("hidden", sessions.length > 0);
    for (const session of sessions) {
      sessionListContainer.appendChild(buildSessionRow(session));
    }
  }

  function buildSessionRow(session) {
    const row = document.createElement("div");
    row.className = "session-row";
    const name = document.createElement("div");
    name.className = "session-name";
    name.textContent = session.sessionName;
    row.appendChild(name);
    const windows = document.createElement("div");
    windows.className = "session-windows";
    windows.appendChild(buildWindowSummary(session.windows || []));
    row.appendChild(windows);
    row.addEventListener("click", function () {
      openSessionTerminal(session.sessionName);
    });
    return row;
  }

  function buildWindowSummary(windows) {
    const summary = document.createDocumentFragment();
    const windowCount = windows.length;
    summary.appendChild(document.createTextNode(
      windowCount + (windowCount === 1 ? " window" : " windows")
    ));
    for (const tmuxWindow of windows) {
      if (tmuxWindow.windowTitle) {
        summary.appendChild(document.createTextNode(" \\u00b7 " + tmuxWindow.windowTitle));
      }
      if (tmuxWindow.agentDriver) {
        const badge = document.createElement("span");
        badge.className = "agent-badge";
        badge.textContent = tmuxWindow.agentDriver;
        summary.appendChild(badge);
      }
    }
    return summary;
  }

  function loadSessions() {
    const lifecycleSocket = new WebSocket("ws://" + location.host + lifecycleControlPath);
    lifecycleSocket.onopen = function () {
      lifecycleSocket.send(JSON.stringify({ operation: "list-sessions" }));
    };
    lifecycleSocket.onmessage = function (messageEvent) {
      const lifecycleReply = JSON.parse(messageEvent.data);
      if (lifecycleReply.operation === "list-sessions") {
        renderSessionRows(lifecycleReply.sessions || []);
      }
      lifecycleSocket.close();
    };
    lifecycleSocket.onerror = function () {
      renderSessionRows([]);
    };
  }

  function sendTerminalWindowSize() {
    activeFitAddon.fit();
    activeAttachSocket.send(JSON.stringify({
      type: "resize", columns: activeTerminal.cols, rows: activeTerminal.rows
    }));
  }

  function openSessionTerminal(sessionName) {
    activeSessionLabel.textContent = sessionName;
    sessionListView.classList.add("hidden");
    terminalView.classList.remove("hidden");
    activeTerminal = new Terminal({
      cursorBlink: true, fontFamily: "Menlo, Monaco, monospace", fontSize: 13,
      theme: { background: "#1e1e2e", foreground: "#cdd6f4" }
    });
    activeFitAddon = new FitAddon.FitAddon();
    activeTerminal.loadAddon(activeFitAddon);
    activeTerminal.open(document.getElementById("terminal"));
    activeFitAddon.fit();
    activeAttachSocket = new WebSocket(
      "ws://" + location.host + "/attach?sessionName=" + encodeURIComponent(sessionName)
    );
    activeAttachSocket.binaryType = "arraybuffer";
    activeAttachSocket.onopen = function () {
      sendTerminalWindowSize();
      activeTerminal.focus();
    };
    activeAttachSocket.onmessage = function (messageEvent) {
      activeTerminal.write(new Uint8Array(messageEvent.data));
    };
    activeAttachSocket.onclose = function () {
      if (activeTerminal) {
        activeTerminal.write("\\r\\n[connection closed]\\r\\n");
      }
    };
    activeTerminal.onData(function (terminalInput) {
      activeAttachSocket.send(textEncoder.encode(terminalInput));
    });
    activeWindowResizeHandler = function () {
      if (activeAttachSocket && activeAttachSocket.readyState === WebSocket.OPEN) {
        sendTerminalWindowSize();
      }
    };
    window.addEventListener("resize", activeWindowResizeHandler);
  }

  function returnToSessionList() {
    if (activeWindowResizeHandler) {
      window.removeEventListener("resize", activeWindowResizeHandler);
      activeWindowResizeHandler = null;
    }
    if (activeAttachSocket) {
      activeAttachSocket.onclose = null;
      activeAttachSocket.close();
      activeAttachSocket = null;
    }
    if (activeTerminal) {
      activeTerminal.dispose();
      activeTerminal = null;
    }
    activeFitAddon = null;
    terminalView.classList.add("hidden");
    sessionListView.classList.remove("hidden");
    loadSessions();
  }

  document.getElementById("refresh-sessions").addEventListener("click", loadSessions);
  document.getElementById("back-to-sessions").addEventListener("click", returnToSessionList);

  fetch("/config").then(function (response) {
    return response.json();
  }).then(function (cockpitConfig) {
    if (cockpitConfig && cockpitConfig.lifecycleControlPath) {
      lifecycleControlPath = cockpitConfig.lifecycleControlPath;
    }
    loadSessions();
  }).catch(function () {
    loadSessions();
  });
</script>
</body>
</html>
"""
