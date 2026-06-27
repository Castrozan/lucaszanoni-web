type FakeWebSocketListener = (event: { data?: string }) => void;

interface FakeWebSocketListenerEntry {
  readonly listener: FakeWebSocketListener;
  readonly once: boolean;
}

export class FakeWebSocket {
  static readonly instances: FakeWebSocket[] = [];

  readonly url: string;
  readonly sentPayloads: string[] = [];
  closed = false;
  private readonly listenersByType = new Map<
    string,
    FakeWebSocketListenerEntry[]
  >();

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  static reset(): void {
    FakeWebSocket.instances.length = 0;
  }

  static lastInstance(): FakeWebSocket {
    const instance = FakeWebSocket.instances.at(-1);
    if (!instance) {
      throw new Error("no FakeWebSocket has been constructed yet");
    }
    return instance;
  }

  addEventListener(
    type: string,
    listener: FakeWebSocketListener,
    options?: { once?: boolean },
  ): void {
    const entries = this.listenersByType.get(type) ?? [];
    entries.push({ listener, once: Boolean(options?.once) });
    this.listenersByType.set(type, entries);
  }

  removeEventListener(type: string, listener: FakeWebSocketListener): void {
    const entries = this.listenersByType.get(type);
    if (!entries) {
      return;
    }
    this.listenersByType.set(
      type,
      entries.filter((entry) => entry.listener !== listener),
    );
  }

  send(payload: string): void {
    this.sentPayloads.push(payload);
  }

  close(): void {
    this.closed = true;
    this.emit("close", {});
  }

  emitOpen(): void {
    this.emit("open", {});
  }

  emitReply(payload: unknown): void {
    this.emit("message", { data: JSON.stringify(payload) });
  }

  emitError(): void {
    this.emit("error", {});
  }

  emitClose(): void {
    this.emit("close", {});
  }

  private emit(type: string, event: { data?: string }): void {
    for (const entry of [...(this.listenersByType.get(type) ?? [])]) {
      if (entry.once) {
        this.removeEventListener(type, entry.listener);
      }
      entry.listener(event);
    }
  }
}
