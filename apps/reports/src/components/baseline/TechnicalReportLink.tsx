import { baselineArtifactUrl } from "../../data/report-artifact-sources";
import { qualityContentLinkClassName } from "../quality/quality-report-content";

export function TechnicalReportLink() {
  return (
    <a className={qualityContentLinkClassName} href={baselineArtifactUrl}>
      full technical report
    </a>
  );
}
