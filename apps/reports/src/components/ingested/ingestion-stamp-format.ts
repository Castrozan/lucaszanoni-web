export function formatIngestionStamp(stampedAt: string): string {
  const stampedDate = new Date(stampedAt);
  return Number.isNaN(stampedDate.valueOf())
    ? "an unknown date"
    : stampedDate.toISOString().slice(0, 16).replace("T", " ");
}
