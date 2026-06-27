"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildSandboxHtmlDocument } from "./sandboxHtmlTemplate";

type SandboxStatus = "loading" | "ready" | "error";

type SandboxMessage = {
  type: "sandbox-ready" | "sandbox-error";
  error?: string;
};

export function SandboxedComponentRenderer({ jsxCode }: { jsxCode: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>("loading");
  const [sandboxErrorMessage, setSandboxErrorMessage] = useState("");

  const handleSandboxMessage = useCallback((event: MessageEvent) => {
    const message = event.data as SandboxMessage;
    if (message.type === "sandbox-ready") {
      setSandboxStatus("ready");
    } else if (message.type === "sandbox-error") {
      setSandboxStatus("error");
      setSandboxErrorMessage(message.error ?? "Unknown error");
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleSandboxMessage);
    return () => window.removeEventListener("message", handleSandboxMessage);
  }, [handleSandboxMessage]);

  useEffect(() => {
    if (!iframeRef.current || !jsxCode) return;

    setSandboxStatus("loading");
    setSandboxErrorMessage("");

    const htmlDocument = buildSandboxHtmlDocument(jsxCode);
    const blobUrl = URL.createObjectURL(
      new Blob([htmlDocument], { type: "text/html" }),
    );

    iframeRef.current.src = blobUrl;

    return () => URL.revokeObjectURL(blobUrl);
  }, [jsxCode]);

  return (
    <div className="relative h-full w-full">
      {sandboxStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-sm text-neutral-400">Loading...</div>
        </div>
      )}
      {sandboxStatus === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
          <div className="text-sm text-red-600">{sandboxErrorMessage}</div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="h-full w-full border-0"
        title="Sandboxed component"
        style={{
          pointerEvents: "all",
          opacity: sandboxStatus === "ready" ? 1 : 0,
        }}
      />
    </div>
  );
}
