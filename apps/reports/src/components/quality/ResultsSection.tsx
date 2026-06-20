import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@lucaszanoni-web/design-system";
import {
  baselineDashboardHref,
  qualityContentLinkClassName,
  qualityLedeClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export function ResultsSection() {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>Results</h2>
      <p className={qualityLedeClassName}>
        End-to-end runs in real tmux sessions, scored 0-100 (NPS):
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>model</TableHead>
            <TableHead>pass</TableHead>
            <TableHead>NPS</TableHead>
            <TableHead>best</TableHead>
            <TableHead>worst</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>opus</TableCell>
            <TableCell>3/6</TableCell>
            <TableCell>69</TableCell>
            <TableCell>workflow: 100</TableCell>
            <TableCell>test: 23</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>haiku</TableCell>
            <TableCell>2/6</TableCell>
            <TableCell>50</TableCell>
            <TableCell>format: 88</TableCell>
            <TableCell>test: 6</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>sonnet</TableCell>
            <TableCell>1/6</TableCell>
            <TableCell>39</TableCell>
            <TableCell>git: 88</TableCell>
            <TableCell>format: 13</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className={qualityLedeClassName}>
        A/B test, how instructions are loaded into the agent:
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>config</TableHead>
            <TableHead>score</TableHead>
            <TableHead>finding</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <code>@reference</code>
            </TableCell>
            <TableCell>83</TableCell>
            <TableCell>best, complements the harness instructions</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>no-instructions</TableCell>
            <TableCell>78</TableCell>
            <TableCell>model defaults are already decent</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>inline</TableCell>
            <TableCell>76</TableCell>
            <TableCell>good</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <code>--system-prompt</code>
            </TableCell>
            <TableCell>67</TableCell>
            <TableCell>worst, competes with harness built-ins</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p className={qualityLedeClassName}>
        Static evals at the time: 96.7% (177/183), up from 92.2% (118/128). The{" "}
        <a className={qualityContentLinkClassName} href={baselineDashboardHref}>
          baseline dashboard
        </a>{" "}
        tracks this number live.
      </p>
    </>
  );
}
