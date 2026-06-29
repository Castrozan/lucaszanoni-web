LOCALHOST_COCKPIT_INDEX_PAGE_HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Local Cockpit</title>
<link rel="stylesheet" href="/xterm.css" />
<style>
  :root {
    --base: #1e1e2e; --mantle: #181825; --surface: #313244;
    --text: #cdd6f4; --subtext: #a6adc8; --blue: #89b4fa; --green: #a6e3a1;
  }
  html, body {
    margin: 0; height: 100%; background: var(--base); color: var(--text);
    font-family: Menlo, Monaco, monospace;
  }
  #session-list-view {
    box-sizing: border-box; height: 100%; padding: 16px; overflow-y: auto;
  }
  #session-list-view.hidden, #terminal-view.hidden { display: none; }
  .cockpit-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .cockpit-header h1 { font-size: 18px; margin: 0; color: var(--blue); }
  button.cockpit-control {
    background: var(--surface); color: var(--text); border: none;
    border-radius: 6px; padding: 8px 14px; cursor: pointer; font-size: 13px;
  }
  button.cockpit-control:hover { background: var(--blue); color: var(--mantle); }
  .session-row {
    background: var(--mantle); border: 1px solid var(--surface);
    border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; cursor: pointer;
  }
  .session-row:hover { border-color: var(--blue); }
  .session-name { font-size: 15px; color: var(--text); font-weight: 600; }
  .session-windows { font-size: 12px; color: var(--subtext); margin-top: 6px; }
  .agent-badge {
    display: inline-block; background: var(--green); color: var(--mantle);
    border-radius: 4px; padding: 0 6px; margin-left: 6px; font-size: 11px;
  }
  #empty-hint { color: var(--subtext); font-size: 14px; }
  #empty-hint.hidden { display: none; }
  #terminal-view {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    background: var(--base);
  }
  #terminal-view .cockpit-header {
    padding: 10px 14px; margin: 0; border-bottom: 1px solid var(--surface);
  }
  #active-session-name { color: var(--subtext); font-size: 13px; }
  #terminal { flex: 1; padding: 8px; box-sizing: border-box; min-height: 0; }
</style>
</head>
"""

LOCALHOST_COCKPIT_INDEX_PAGE_BODY = """<body>
<div id="session-list-view">
  <div class="cockpit-header">
    <h1>Local Cockpit</h1>
    <button id="refresh-sessions" class="cockpit-control">Refresh</button>
  </div>
  <div id="empty-hint" class="hidden">No tmux sessions yet. Start one and refresh.</div>
  <div id="session-list"></div>
</div>
<div id="terminal-view" class="hidden">
  <div class="cockpit-header">
    <button id="back-to-sessions" class="cockpit-control">Back to sessions</button>
    <span id="active-session-name"></span>
  </div>
  <div id="terminal"></div>
</div>
<script src="/xterm.js"></script>
"""
