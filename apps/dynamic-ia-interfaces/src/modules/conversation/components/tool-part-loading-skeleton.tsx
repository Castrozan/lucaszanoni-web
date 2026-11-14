export function ToolPartLoadingSkeleton({ toolName }: { toolName: string }) {
  const readableToolName = toolName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (firstChar) => firstChar.toUpperCase())
    .trim();

  return (
    <div className="border-border bg-muted/20 w-full max-w-md animate-pulse rounded-lg border p-6">
      <div className="bg-muted/50 mb-3 h-4 w-1/3 rounded" />
      <div className="space-y-2">
        <div className="bg-muted/40 h-3 w-full rounded" />
        <div className="bg-muted/40 h-3 w-2/3 rounded" />
        <div className="bg-muted/40 h-3 w-1/2 rounded" />
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Generating {readableToolName}...
      </p>
    </div>
  );
}
