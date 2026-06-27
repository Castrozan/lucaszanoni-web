export function ToolPartErrorDisplay({
  toolName,
  errorText,
}: {
  toolName: string;
  errorText: string;
}) {
  return (
    <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium text-destructive">
        Failed to generate {toolName}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{errorText}</p>
    </div>
  );
}
