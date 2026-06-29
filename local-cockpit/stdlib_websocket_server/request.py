from dataclasses import dataclass

HEADER_TERMINATOR = b"\r\n\r\n"


class CaseInsensitiveHeaders:
    def __init__(self, header_name_value_pairs):
        self._header_name_value_pairs = list(header_name_value_pairs)
        self._lowercase_name_to_value = {}
        for header_name, header_value in self._header_name_value_pairs:
            self._lowercase_name_to_value[header_name.lower()] = header_value

    def get(self, header_name, default_value=None):
        return self._lowercase_name_to_value.get(header_name.lower(), default_value)

    def __getitem__(self, header_name):
        return self._lowercase_name_to_value[header_name.lower()]

    def __contains__(self, header_name):
        return header_name.lower() in self._lowercase_name_to_value

    def items(self):
        return list(self._header_name_value_pairs)


@dataclass
class WebSocketHandshakeRequest:
    method: str
    path: str
    headers: CaseInsensitiveHeaders


def parse_handshake_request(raw_request_head):
    decoded_request_head = raw_request_head.decode("latin-1")
    request_head_lines = decoded_request_head.split("\r\n")
    request_line_tokens = request_head_lines[0].split(" ")
    if len(request_line_tokens) < 2:
        return None
    request_method = request_line_tokens[0]
    request_target = request_line_tokens[1]
    header_name_value_pairs = []
    for header_line in request_head_lines[1:]:
        if not header_line:
            continue
        header_name, _, header_value = header_line.partition(":")
        header_name_value_pairs.append((header_name.strip(), header_value.strip()))
    return WebSocketHandshakeRequest(
        method=request_method,
        path=request_target,
        headers=CaseInsensitiveHeaders(header_name_value_pairs),
    )
