import pathlib

VENDOR_DIRECTORY = pathlib.Path(__file__).resolve().parent / "vendor"
XTERM_CSS_BYTES = (VENDOR_DIRECTORY / "xterm.css").read_bytes()
XTERM_JS_BYTES = (VENDOR_DIRECTORY / "xterm.js").read_bytes()
