from dataclasses import dataclass
from http import HTTPStatus


@dataclass
class Response:
    status_code: int
    reason: str
    headers: object
    body: bytes = b""


def build_http_response_bytes(response):
    response_body = response.body or b""
    response_status_code = int(response.status_code)
    response_reason = response.reason or resolve_default_reason_phrase(
        response_status_code
    )
    provided_header_pairs = iterate_response_header_pairs(response.headers)
    provided_header_names_lowercase = {
        header_name.lower() for header_name, _ in provided_header_pairs
    }
    response_lines = [f"HTTP/1.1 {response_status_code} {response_reason}"]
    for header_name, header_value in provided_header_pairs:
        response_lines.append(f"{header_name}: {header_value}")
    if "content-length" not in provided_header_names_lowercase:
        response_lines.append(f"Content-Length: {len(response_body)}")
    if "connection" not in provided_header_names_lowercase:
        response_lines.append("Connection: close")
    response_lines.append("")
    response_lines.append("")
    return "\r\n".join(response_lines).encode("latin-1") + response_body


def iterate_response_header_pairs(response_headers):
    if response_headers is None:
        return []
    if hasattr(response_headers, "items"):
        return list(response_headers.items())
    return list(response_headers)


def resolve_default_reason_phrase(status_code):
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return ""
