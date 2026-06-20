export function WhyItExistsSection() {
  return (
    <>
      <h2>Why it exists</h2>
      <div className="panel">
        <p>
          The agent&apos;s behaviour degraded over a two-week window.
          Investigation found two compounding root causes:
        </p>
        <ul>
          <li>
            <b>Adaptive-thinking regression</b> (upstream, issue #42796),
            thinking depth dropped 73% and the read-to-edit ratio collapsed from
            6.6 to 2.0.
          </li>
          <li>
            <b>Instruction surface doubled</b>, 14 core.md commits in 5 weeks,
            during the exact window model reasoning capacity dropped.
          </li>
        </ul>
        <p>
          The response was not &quot;write better rules&quot;, it was to{" "}
          <b>measure</b> compliance continuously, so regressions surface in
          minutes instead of weeks.
        </p>
      </div>
    </>
  );
}
