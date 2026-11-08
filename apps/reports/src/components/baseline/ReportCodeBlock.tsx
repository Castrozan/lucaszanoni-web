import { baselineCodeBlockClassName } from "./baseline-report-content";

export function ReportCodeBlock({
  label,
  content,
  scrollable = false,
}: {
  readonly label: string;
  readonly content: string;
  readonly scrollable?: boolean;
}) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <pre
        className={`${baselineCodeBlockClassName}${scrollable ? " max-h-72 overflow-y-auto" : ""}`}
      >
        {content}
      </pre>
    </div>
  );
}
