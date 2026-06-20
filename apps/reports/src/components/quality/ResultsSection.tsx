import { baselineDashboardHref } from "./quality-report-content";

export function ResultsSection() {
  return (
    <>
      <h2>Results</h2>
      <p className="lede">
        End-to-end runs in real tmux sessions, scored 0-100 (NPS):
      </p>
      <table>
        <thead>
          <tr>
            <th>model</th>
            <th>pass</th>
            <th>NPS</th>
            <th>best</th>
            <th>worst</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>opus</td>
            <td>3/6</td>
            <td>69</td>
            <td>workflow: 100</td>
            <td>test: 23</td>
          </tr>
          <tr>
            <td>haiku</td>
            <td>2/6</td>
            <td>50</td>
            <td>format: 88</td>
            <td>test: 6</td>
          </tr>
          <tr>
            <td>sonnet</td>
            <td>1/6</td>
            <td>39</td>
            <td>git: 88</td>
            <td>format: 13</td>
          </tr>
        </tbody>
      </table>
      <p className="lede">
        A/B test, how instructions are loaded into the agent:
      </p>
      <table>
        <thead>
          <tr>
            <th>config</th>
            <th>score</th>
            <th>finding</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>@reference</code>
            </td>
            <td>83</td>
            <td>best, complements the harness instructions</td>
          </tr>
          <tr>
            <td>no-instructions</td>
            <td>78</td>
            <td>model defaults are already decent</td>
          </tr>
          <tr>
            <td>inline</td>
            <td>76</td>
            <td>good</td>
          </tr>
          <tr>
            <td>
              <code>--system-prompt</code>
            </td>
            <td>67</td>
            <td>worst, competes with harness built-ins</td>
          </tr>
        </tbody>
      </table>
      <p className="lede">
        Static evals at the time: 96.7% (177/183), up from 92.2% (118/128). The{" "}
        <a href={baselineDashboardHref}>baseline dashboard</a> tracks this
        number live.
      </p>
    </>
  );
}
