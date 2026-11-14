export function ToolPartErrorDisplay({
  toolName,
  errorText,
}: {
  toolName: string;
  errorText: string;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 w-full max-w-md rounded-lg border p-4">
      <p className="text-destructive text-sm font-medium">
        Failed to generate {toolName}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">{errorText}</p>
    </div>
  );
}
