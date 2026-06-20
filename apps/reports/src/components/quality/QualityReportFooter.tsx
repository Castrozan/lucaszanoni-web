import {
  baselineDashboardHref,
  qualityContentLinkClassName,
  qualityIssueHref,
  reportsHubHref,
} from "./quality-report-content";

export function QualityReportFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-4 text-xs text-muted-foreground">
      Canonical record of{" "}
      <a className={qualityContentLinkClassName} href={qualityIssueHref}>
        issue #70
      </a>{" "}
      · live{" "}
      <a className={qualityContentLinkClassName} href={baselineDashboardHref}>
        baseline dashboard
      </a>{" "}
      ·{" "}
      <a className={qualityContentLinkClassName} href={reportsHubHref}>
        reports hub
      </a>
    </footer>
  );
}
