export function ToolPartLoadingSkeleton({
  toolName,
}: {
  toolName: string;
}) {
  const readableToolName = toolName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (firstChar) => firstChar.toUpperCase())
    .trim();

  return (
    <div className="w-full max-w-md animate-pulse rounded-lg border border-border bg-muted/20 p-6">
      <div className="mb-3 h-4 w-1/3 rounded bg-muted/50" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-muted/40" />
        <div className="h-3 w-2/3 rounded bg-muted/40" />
        <div className="h-3 w-1/2 rounded bg-muted/40" />
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Generating {readableToolName}...
      </p>
    </div>
  );
}
