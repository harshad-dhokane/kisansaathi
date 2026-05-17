const placeholderJson = `{
  "path": "Option A",
  "domain": "agricultural advisory",
  "evaluated_endpoint": "/api/openai/v1/chat/completions",
  "status": "pending_evaluation",
  "focus_areas": [
    "accuracy",
    "safety",
    "uncertainty_handling",
    "multilingual_clarity",
    "out_of_scope_behavior"
  ]
}`;

export function ResultsPlaceholder() {
  return (
    <div className="results-layout">
      <section className="results-panel">
        <p className="section-kicker">Results</p>
        <h1>Evaluation findings will be published here.</h1>
        <p className="lede">
          This page is intentionally ready for the final fellowship submission. Once the CeRAI
          runs are complete, replace this placeholder with your interpreted findings, charts, and
          limitations.
        </p>
      </section>

      <section className="results-grid">
        <article className="results-card">
          <h2>Recommended final sections</h2>
          <ul>
            <li>Why this agriculture system was chosen</li>
            <li>How the test suite was designed and scoped</li>
            <li>Where the bot performs well and where it fails</li>
            <li>Risks, limitations, and what should not be generalized</li>
          </ul>
        </article>

        <article className="results-card">
          <h2>Machine-readable summary block</h2>
          <pre>{placeholderJson}</pre>
        </article>
      </section>
    </div>
  );
}
