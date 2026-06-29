import asyncio

from .frame_protocol import (
    FINAL_FRAGMENT_BIT,
    MASK_BIT,
    NORMAL_CLOSURE_STATUS_CODE,
    OPCODE_BINARY,
    OPCODE_CONNECTION_CLOSE,
    OPCODE_CONTINUATION,
    OPCODE_FIELD_MASK,
    OPCODE_PING,
    OPCODE_PONG,
    OPCODE_TEXT,
    PAYLOAD_LENGTH_FIELD_MASK,
    SEVEN_BIT_LENGTH_INDICATES_SIXTEEN_BIT,
    SEVEN_BIT_LENGTH_INDICATES_SIXTY_FOUR_BIT,
    SIXTEEN_BIT_LENGTH_CEILING,
)


class ConnectionClosed(Exception):
    pass


class WebSocketServerConnection:
    def __init__(self, stream_reader, stream_writer, handshake_request):
        self._stream_reader = stream_reader
        self._stream_writer = stream_writer
        self.request = handshake_request
        self._connection_is_closed = False

    async def send(self, outgoing_message):
        if isinstance(outgoing_message, str):
            await self._write_websocket_frame(
                OPCODE_TEXT, outgoing_message.encode("utf-8")
            )
            return
        await self._write_websocket_frame(OPCODE_BINARY, bytes(outgoing_message))

    def __aiter__(self):
        return self._iterate_incoming_messages()

    async def _iterate_incoming_messages(self):
        while True:
            try:
                yield await self.receive()
            except ConnectionClosed:
                return

    async def receive(self):
        if self._connection_is_closed:
            raise ConnectionClosed()
        accumulated_payload_fragments = []
        reassembled_message_opcode = None
        while True:
            try:
                (
                    is_final_fragment,
                    frame_opcode,
                    frame_payload,
                ) = await self._read_websocket_frame()
            except (
                asyncio.IncompleteReadError,
                ConnectionResetError,
                BrokenPipeError,
                OSError,
            ):
                self._connection_is_closed = True
                raise ConnectionClosed()
            if frame_opcode == OPCODE_CONNECTION_CLOSE:
                await self._acknowledge_peer_initiated_close(frame_payload)
                raise ConnectionClosed()
            if frame_opcode == OPCODE_PING:
                await self._write_websocket_frame(OPCODE_PONG, frame_payload)
                continue
            if frame_opcode == OPCODE_PONG:
                continue
            if frame_opcode == OPCODE_CONTINUATION:
                accumulated_payload_fragments.append(frame_payload)
            else:
                reassembled_message_opcode = frame_opcode
                accumulated_payload_fragments.append(frame_payload)
            if is_final_fragment:
                complete_payload = b"".join(accumulated_payload_fragments)
                if reassembled_message_opcode == OPCODE_TEXT:
                    return complete_payload.decode("utf-8")
                return complete_payload

    async def close(self, code=NORMAL_CLOSURE_STATUS_CODE, reason=""):
        if self._connection_is_closed:
            return
        close_frame_payload = code.to_bytes(2, "big") + reason.encode("utf-8")
        try:
            await self._write_websocket_frame(
                OPCODE_CONNECTION_CLOSE, close_frame_payload
            )
        except ConnectionClosed:
            pass
        self._connection_is_closed = True
        await self._close_underlying_transport()

    async def _acknowledge_peer_initiated_close(self, peer_close_payload):
        if not self._connection_is_closed:
            echoed_close_payload = (
                peer_close_payload[:2]
                if len(peer_close_payload) >= 2
                else NORMAL_CLOSURE_STATUS_CODE.to_bytes(2, "big")
            )
            try:
                await self._write_websocket_frame(
                    OPCODE_CONNECTION_CLOSE, echoed_close_payload
                )
            except ConnectionClosed:
                pass
        self._connection_is_closed = True
        await self._close_underlying_transport()

    async def _close_underlying_transport(self):
        try:
            self._stream_writer.close()
            await self._stream_writer.wait_closed()
        except OSError:
            pass

    async def _read_websocket_frame(self):
        first_two_header_bytes = await self._stream_reader.readexactly(2)
        first_header_byte = first_two_header_bytes[0]
        second_header_byte = first_two_header_bytes[1]
        is_final_fragment = bool(first_header_byte & FINAL_FRAGMENT_BIT)
        frame_opcode = first_header_byte & OPCODE_FIELD_MASK
        payload_is_masked = bool(second_header_byte & MASK_BIT)
        payload_length = second_header_byte & PAYLOAD_LENGTH_FIELD_MASK
        if payload_length == SEVEN_BIT_LENGTH_INDICATES_SIXTEEN_BIT:
            payload_length = int.from_bytes(
                await self._stream_reader.readexactly(2), "big"
            )
        elif payload_length == SEVEN_BIT_LENGTH_INDICATES_SIXTY_FOUR_BIT:
            payload_length = int.from_bytes(
                await self._stream_reader.readexactly(8), "big"
            )
        masking_key = b""
        if payload_is_masked:
            masking_key = await self._stream_reader.readexactly(4)
        frame_payload = (
            await self._stream_reader.readexactly(payload_length)
            if payload_length
            else b""
        )
        if payload_is_masked:
            frame_payload = bytes(
                payload_byte ^ masking_key[byte_index % 4]
                for byte_index, payload_byte in enumerate(frame_payload)
            )
        return is_final_fragment, frame_opcode, frame_payload

    async def _write_websocket_frame(self, frame_opcode, frame_payload):
        if self._connection_is_closed:
            raise ConnectionClosed()
        frame_bytes = bytearray()
        frame_bytes.append(FINAL_FRAGMENT_BIT | frame_opcode)
        payload_length = len(frame_payload)
        if payload_length < SEVEN_BIT_LENGTH_INDICATES_SIXTEEN_BIT:
            frame_bytes.append(payload_length)
        elif payload_length < SIXTEEN_BIT_LENGTH_CEILING:
            frame_bytes.append(SEVEN_BIT_LENGTH_INDICATES_SIXTEEN_BIT)
            frame_bytes += payload_length.to_bytes(2, "big")
        else:
            frame_bytes.append(SEVEN_BIT_LENGTH_INDICATES_SIXTY_FOUR_BIT)
            frame_bytes += payload_length.to_bytes(8, "big")
        self._stream_writer.write(bytes(frame_bytes) + frame_payload)
        try:
            await self._stream_writer.drain()
        except (ConnectionResetError, BrokenPipeError, OSError):
            self._connection_is_closed = True
            raise ConnectionClosed()
