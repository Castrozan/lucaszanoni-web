import base64
import os
import pathlib

LOCAL_COCKPIT_DIRECTORY = pathlib.Path(__file__).resolve().parent
DEFAULT_BRIDGE_SCRIPTS_DIRECTORY = pathlib.Path(
    "/Users/lucas.zanoni/.dotfiles/nixos/modules/cockpit-session-bridge/scripts/cockpit_session_bridge"
)
STDLIB_WEBSOCKET_SERVER_PACKAGE_NAME = "stdlib_websocket_server"
GENERATED_ASSETS_MODULE_NAME = "local_cockpit_assets.py"
BUNDLER_MODULE_NAME = "build_single_file_launcher.py"
DISTRIBUTION_DIRECTORY = LOCAL_COCKPIT_DIRECTORY / "dist"
DISTRIBUTION_BUNDLE_PATH = DISTRIBUTION_DIRECTORY / "local-cockpit.py"


def resolve_bridge_scripts_directory():
    configured_directory = os.environ.get("COCKPIT_BRIDGE_SCRIPTS_DIR")
    if configured_directory:
        return pathlib.Path(configured_directory)
    return DEFAULT_BRIDGE_SCRIPTS_DIRECTORY


def collect_bridge_module_sources(bridge_scripts_directory):
    collected_sources = {}
    for bridge_module_path in sorted(bridge_scripts_directory.glob("*.py")):
        if bridge_module_path.name == "__main__.py":
            continue
        collected_sources[bridge_module_path.name] = bridge_module_path.read_bytes()
    return collected_sources


def collect_stdlib_websocket_server_package_sources():
    package_directory = LOCAL_COCKPIT_DIRECTORY / STDLIB_WEBSOCKET_SERVER_PACKAGE_NAME
    collected_sources = {}
    for package_module_path in sorted(package_directory.glob("*.py")):
        relative_posix_path = (
            f"{STDLIB_WEBSOCKET_SERVER_PACKAGE_NAME}/{package_module_path.name}"
        )
        collected_sources[relative_posix_path] = package_module_path.read_bytes()
    return collected_sources


def collect_entry_module_sources():
    collected_sources = {}
    for entry_module_path in sorted(LOCAL_COCKPIT_DIRECTORY.glob("*.py")):
        if entry_module_path.name in (
            BUNDLER_MODULE_NAME,
            GENERATED_ASSETS_MODULE_NAME,
        ):
            continue
        collected_sources[entry_module_path.name] = entry_module_path.read_bytes()
    return collected_sources


def read_vendored_asset_bytes(asset_file_name):
    return (LOCAL_COCKPIT_DIRECTORY / "vendor" / asset_file_name).read_bytes()


def generate_local_cockpit_assets_source(xterm_css_bytes, xterm_js_bytes):
    encoded_css = base64.b64encode(xterm_css_bytes).decode("ascii")
    encoded_javascript = base64.b64encode(xterm_js_bytes).decode("ascii")
    generated_source_lines = [
        "import base64",
        "",
        f'XTERM_CSS_BYTES = base64.b64decode("{encoded_css}")',
        f'XTERM_JS_BYTES = base64.b64decode("{encoded_javascript}")',
        "",
    ]
    return "\n".join(generated_source_lines).encode("utf-8")


def build_websockets_shim_sources():
    return {
        "websockets/__init__.py": b"",
        "websockets/exceptions.py": (
            b"from stdlib_websocket_server import ConnectionClosed\n"
        ),
    }


def collect_all_embedded_sources():
    embedded_sources = {}
    embedded_sources.update(
        collect_bridge_module_sources(resolve_bridge_scripts_directory())
    )
    embedded_sources.update(collect_stdlib_websocket_server_package_sources())
    embedded_sources.update(collect_entry_module_sources())
    embedded_sources[GENERATED_ASSETS_MODULE_NAME] = (
        generate_local_cockpit_assets_source(
            read_vendored_asset_bytes("xterm.css"),
            read_vendored_asset_bytes("xterm.js"),
        )
    )
    embedded_sources.update(build_websockets_shim_sources())
    return embedded_sources


def encode_embedded_sources_for_literal(embedded_sources):
    return {
        relative_posix_path: base64.b64encode(source_bytes).decode("ascii")
        for relative_posix_path, source_bytes in embedded_sources.items()
    }


def render_bundle_source(embedded_sources):
    encoded_sources = encode_embedded_sources_for_literal(embedded_sources)
    bundle_source_lines = [
        "import atexit",
        "import base64",
        "import pathlib",
        "import sys",
        "import tempfile",
        "",
        f"EMBEDDED_SOURCES = {encoded_sources!r}",
        "",
        "",
        "def materialize_embedded_sources_into_temporary_directory():",
        "    extraction_directory = tempfile.TemporaryDirectory(prefix='local-cockpit-')",
        "    extraction_root = pathlib.Path(extraction_directory.name)",
        "    for relative_posix_path, encoded_source in EMBEDDED_SOURCES.items():",
        "        destination_path = extraction_root / relative_posix_path",
        "        destination_path.parent.mkdir(parents=True, exist_ok=True)",
        "        destination_path.write_bytes(base64.b64decode(encoded_source))",
        "    return extraction_directory",
        "",
        "",
        "def run_bundled_localhost_cockpit_entry():",
        "    extraction_directory = materialize_embedded_sources_into_temporary_directory()",
        "    atexit.register(extraction_directory.cleanup)",
        "    sys.path.insert(0, extraction_directory.name)",
        "    import localhost_cockpit_entry",
        "    localhost_cockpit_entry.main()",
        "",
        "",
        "if __name__ == '__main__':",
        "    run_bundled_localhost_cockpit_entry()",
        "",
    ]
    return "\n".join(bundle_source_lines)


def write_distribution_bundle():
    DISTRIBUTION_DIRECTORY.mkdir(parents=True, exist_ok=True)
    DISTRIBUTION_BUNDLE_PATH.write_text(
        render_bundle_source(collect_all_embedded_sources()), encoding="utf-8"
    )
    return DISTRIBUTION_BUNDLE_PATH


def main():
    written_bundle_path = write_distribution_bundle()
    print(f"wrote single-file launcher to {written_bundle_path}")


if __name__ == "__main__":
    main()
