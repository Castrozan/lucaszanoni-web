import {
  baselineDashboardHref,
  qualityIssueHref,
  reportsHubHref,
} from "./quality-report-content";

export function QualityReportFooter() {
  return (
    <footer>
      Canonical record of <a href={qualityIssueHref}>issue #70</a> · live{" "}
      <a href={baselineDashboardHref}>baseline dashboard</a> ·{" "}
      <a href={reportsHubHref}>reports hub</a>
    </footer>
  );
}
