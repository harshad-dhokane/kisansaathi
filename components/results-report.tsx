import { resultsReportData, getResultsSummaryJson } from "@/lib/results-data";

function statusClassName(status: string) {
  if (status === "Executed" || status === "In progress") {
    return "report-status report-status-live";
  }

  if (status === "Ready") {
    return "report-status report-status-ready";
  }

  return "report-status report-status-planned";
}

function coverageStatusClassName(status: string) {
  if (status === "Primary") {
    return "report-status report-status-live";
  }

  if (status === "Secondary") {
    return "report-status report-status-ready";
  }

  return "report-status report-status-planned";
}

export function ResultsReport() {
  const summaryJson = JSON.stringify(getResultsSummaryJson(), null, 2);
  const allCases = resultsReportData.caseGroups.flatMap((group) => group.cases);
  const totalTests = allCases.length;

  return (
    <div className="report-layout">
      <aside className="report-sidebar">
        <div className="report-sidebar-card">
          <p className="section-kicker">Results Index</p>
          <h2>{resultsReportData.meta.systemName}</h2>
          <p>
            Interactive evaluation structure for the final fellowship submission. Use the index to
            jump between required assignment answers, plans, and testcase groups.
          </p>
          <div className="report-sidebar-stats">
            <span>{totalTests} total tests</span>
          </div>
        </div>

        <nav className="report-nav" aria-label="Results page index">
          <div className="report-nav-section">
            <p className="report-nav-heading">Executive overview</p>
            <div className="report-nav-links">
              <a className="report-nav-link report-nav-link-strong" href="#overall-summary">
                Overall summary
              </a>
              <a className="report-nav-link" href="#tool-limitations">
                Tool limitations report
              </a>
            </div>
          </div>

          <div className="report-nav-section">
            <p className="report-nav-heading">Submission essentials</p>
            <div className="report-nav-links">
              <a className="report-nav-link report-nav-link-strong" href="#assignment-requirements">
                Required submission points
              </a>
              <div className="report-subnav">
                {resultsReportData.requirementPoints.map((point, index) => (
                  <a key={point.id} href={`#${point.id}`}>
                    <span>{index + 1}.</span>
                    {point.title}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="report-nav-section">
            <p className="report-nav-heading">Method and plans</p>
            <div className="report-nav-links">
              <a className="report-nav-link" href="#evaluation-setup">
                Evaluation setup
              </a>
              <a className="report-nav-link" href="#strategy-coverage">
                Strategy coverage
              </a>
              <div className="report-subnav">
                {resultsReportData.strategyCoverage.map((entry) => (
                  <a key={entry.id} href={`#${entry.id}`}>
                    {entry.strategy}
                  </a>
                ))}
              </div>
              <a className="report-nav-link" href="#plan-tracker">
                Plan tracker
              </a>
              <div className="report-subnav">
                {resultsReportData.plans.map((plan) => (
                  <a key={plan.id} href={`#${plan.id}`}>
                    {plan.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="report-nav-section">
            <p className="report-nav-heading">Testcase index</p>
            <div className="report-nav-links">
              {resultsReportData.caseGroups.map((group) => (
                <details key={group.id} className="report-nav-group" open>
                  <summary>{group.title}</summary>
                  <div className="report-subnav">
                    <a href={`#${group.id}`}>Section overview</a>
                    {group.cases.map((testCase) => (
                      <a key={testCase.id} href={`#${testCase.id}`}>
                        {testCase.id}
                      </a>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="report-nav-section">
            <p className="report-nav-heading">Closing sections</p>
            <div className="report-nav-links">
              <a className="report-nav-link" href="#machine-readable-summary">
                Machine-readable summary
              </a>
            </div>
          </div>
        </nav>
      </aside>

      <div className="report-main">
        <section className="report-hero-card">
          <p className="section-kicker">Option A Evaluation</p>
          <h1>{resultsReportData.meta.title}</h1>
          <p className="lede">{resultsReportData.meta.subtitle}</p>

          <div className="report-stat-grid">
            <article className="report-stat-card">
              <span>Status</span>
              <strong>{resultsReportData.meta.assignmentStatus}</strong>
            </article>
            <article className="report-stat-card">
              <span>Active target</span>
              <strong>{resultsReportData.meta.targetName}</strong>
            </article>
            <article className="report-stat-card">
              <span>Active model</span>
              <strong>{resultsReportData.meta.conversationalModelLabel}</strong>
            </article>
            <article className="report-stat-card">
              <span>Strategy default</span>
              <strong>{resultsReportData.meta.strategyDefault}</strong>
            </article>
            <article className="report-stat-card">
              <span>Total tests</span>
              <strong>{totalTests}</strong>
            </article>
          </div>
        </section>

        <section className="report-section report-section-shell" id="overall-summary">
          <div className="report-section-header">
            <p className="section-kicker">Executive overview</p>
            <h2>Overall summary</h2>
            <p className="report-section-intro">
              This section gives the professional read of the executed suite. It separates
              <strong> chatbot behavior</strong> from <strong> evaluator behavior</strong> and
              focuses only on patterns that were repeatedly observed in completed runs.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.overallSummaryCards.map((card) => (
              <article key={card.id} className="report-card">
                <div className="report-card-kicker">{card.label}</div>
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
                <p>
                  <strong>Why this matters:</strong> {card.implication}
                </p>

                <div className="report-linked-cases">
                  <span className="report-meta-label">Representative cases</span>
                  <div className="report-chip-list">
                    {card.linkedCaseIds.map((caseId) => (
                      <a key={caseId} className="report-chip-link" href={`#${caseId}`}>
                        {caseId}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section report-section-shell" id="tool-limitations">
          <div className="report-section-header">
            <p className="section-kicker">Evaluator review</p>
            <h2>Tool limitations report</h2>
            <p className="report-section-intro">
              These are the <strong>real tool limitations</strong> that materially affected
              interpretation in the executed suite. This section intentionally excludes
              machine-specific compute setup issues and focuses on evaluator behavior that the
              viewer should understand before trusting every score or summary at face value.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.toolLimitationsReportCards.map((card) => (
              <article key={card.id} className="report-card">
                <div className="report-card-kicker">{card.label}</div>
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
                <p>
                  <strong>Practical consequence:</strong> {card.implication}
                </p>

                <div className="report-linked-cases">
                  <span className="report-meta-label">Evidence cases</span>
                  <div className="report-chip-list">
                    {card.linkedCaseIds.map((caseId) => (
                      <a key={caseId} className="report-chip-link" href={`#${caseId}`}>
                        {caseId}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section report-section-shell" id="assignment-requirements">
          <div className="report-section-header">
            <p className="section-kicker">Assignment</p>
            <h2>Required submission points</h2>
            <p className="report-section-intro">
              This section presents the five core elements required for submission: the system
              evaluated, the rationale for choosing it, the test suite design, the conclusions
              drawn from the results, and the key limitations that should not be generalized.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.requirementPoints.map((point, index) => (
              <article key={point.id} className="report-card" id={point.id}>
                <div className="report-card-kicker">Required point {index + 1}</div>
                <h3>{point.title}</h3>
                <p>{point.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section report-section-shell" id="evaluation-setup">
          <div className="report-section-header">
            <p className="section-kicker">Method</p>
            <h2>Evaluation setup and scoring context</h2>
            <p className="report-section-intro">
              This section explains the relationship between the bot, CeRAI, the target endpoint,
              and the scoring path so the report reads as a real evaluation, not just a demo log.
            </p>
          </div>

          <div className="report-two-column">
            <article className="report-card">
              <div className="report-card-kicker">System under test</div>
              <h3>System under test</h3>
              <dl className="report-definition-list">
                <div>
                  <dt>System</dt>
                  <dd>{resultsReportData.meta.systemName}</dd>
                </div>
                <div>
                  <dt>Endpoint type</dt>
                  <dd>{resultsReportData.meta.endpointType}</dd>
                </div>
                <div>
                  <dt>Target URL</dt>
                  <dd>{resultsReportData.meta.targetUrl}</dd>
                </div>
                <div>
                  <dt>Active model</dt>
                  <dd>{resultsReportData.meta.conversationalModelRoot}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>{resultsReportData.meta.provider}</dd>
                </div>
              </dl>
            </article>

            <article className="report-card">
              <div className="report-card-kicker">Evaluator role</div>
              <h3>CeRAI role in this workflow</h3>
              <ul className="report-list">
                <li>Store the target, plans, metrics, and testcase metadata.</li>
                <li>Send prompts to the chatbot through the OpenAI-compatible API route.</li>
                <li>Capture the response per testcase.</li>
                <li>Compute strategy-based scores for each testcase.</li>
                <li>Act as evidence infrastructure, not as the chatbot itself.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="report-section report-section-shell" id="strategy-coverage">
          <div className="report-section-header">
            <p className="section-kicker">Strategies</p>
            <h2>CeRAI strategy coverage matrix</h2>
            <p className="report-section-intro">
              This matrix shows which CeRAI strategy families are being exercised directly, which
              are infrastructure-limited on the current machine, and which registry entries are not
              appropriate for a human-authored agriculture chatbot evaluation. The goal is to make
              strategy selection explicit rather than silently default to one matching strategy for
              everything.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.strategyCoverage.map((entry) => (
              <article key={entry.id} className="report-card" id={entry.id}>
                <div className="report-card-kicker">Strategy coverage</div>
                <div className="report-card-topline">
                  <div>
                    <h3>{entry.strategy}</h3>
                    <p>{entry.purpose}</p>
                  </div>
                  <span className={coverageStatusClassName(entry.status)}>{entry.status}</span>
                </div>

                <div className="report-meta-grid">
                  <div>
                    <span className="report-meta-label">Metric mode</span>
                    <p>{entry.metricMode}</p>
                  </div>
                  <div>
                    <span className="report-meta-label">Infrastructure note</span>
                    <p>{entry.infrastructureNote}</p>
                  </div>
                </div>

                <div className="report-linked-cases">
                  <span className="report-meta-label">Linked cases</span>
                  {entry.assignedCaseIds.length > 0 ? (
                    <div className="report-chip-list">
                      {entry.assignedCaseIds.map((caseId) => (
                        <a key={caseId} className="report-chip-link" href={`#${caseId}`}>
                          {caseId}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="report-muted-note">
                      No direct testcase is assigned because this strategy is documented as blocked
                      or intentionally excluded from the final run set.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section report-section-shell" id="plan-tracker">
          <div className="report-section-header">
            <p className="section-kicker">Plans</p>
            <h2>Evaluation plan tracker</h2>
            <p className="report-section-intro">
              Each plan exists for a specific purpose. The tracker keeps plan names, metrics, run
              names, and execution notes aligned so evidence remains easy to interpret.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.plans.map((plan) => (
              <article key={plan.id} className="report-card" id={plan.id}>
                <div className="report-card-kicker">Plan definition</div>
                <div className="report-card-topline">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.goal}</p>
                  </div>
                  <span className={statusClassName(plan.status)}>{plan.status}</span>
                </div>

                <div className="report-meta-grid">
                  <div>
                    <span className="report-meta-label">Metrics</span>
                    <p>{plan.metrics.join(", ")}</p>
                  </div>
                  <div>
                    <span className="report-meta-label">Run names</span>
                    <p>{plan.runNames.join(", ")}</p>
                  </div>
                  <div>
                    <span className="report-meta-label">Execution note</span>
                    <p>{plan.note}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {resultsReportData.caseGroups.map((group) => (
          <section key={group.id} className="report-section report-section-shell" id={group.id}>
            <div className="report-section-header">
              <p className="section-kicker">Testcases</p>
              <h2>{group.title}</h2>
              <p className="report-section-intro">{group.description}</p>
            </div>

            <article className="report-card report-group-card">
              <div className="report-card-kicker">Group summary</div>
              <div className="report-card-topline">
                <div>
                  <h3>{group.plan}</h3>
                  <p>{group.description}</p>
                </div>
                <span className="report-status report-status-planned">
                  {group.cases.length} cases
                </span>
              </div>
            </article>

            <div className="report-case-stack">
              {group.cases.map((testCase) => (
                <details
                  key={testCase.id}
                  className="report-case"
                  id={testCase.id}
                  open={testCase.status === "Executed"}
                >
                  <summary className="report-case-summary">
                    <div className="report-case-title">
                      <strong>{testCase.id}</strong>
                      <span>{testCase.metric}</span>
                    </div>
                    <div className="report-case-summary-right">
                      <span>{testCase.language}</span>
                      <span className={statusClassName(testCase.status)}>{testCase.status}</span>
                    </div>
                  </summary>

                  <div className="report-case-body">
                    <div className="report-case-meta">
                      <span>
                        <strong>Plan:</strong> {testCase.plan}
                      </span>
                      <span>
                        <strong>Strategy:</strong> {testCase.strategy}
                      </span>
                    </div>

                    <div className="report-case-grid">
                      <article className="report-subcard">
                        <div className="report-subcard-label">User prompt</div>
                        <h4>Prompt</h4>
                        <p>{testCase.prompt}</p>
                      </article>

                      <article className="report-subcard">
                        <div className="report-subcard-label">Ground truth</div>
                        <h4>Ground-truth focus</h4>
                        <p>{testCase.groundTruthFocus}</p>
                      </article>

                      <article className="report-subcard">
                        <div className="report-subcard-label">Execution state</div>
                        <h4>Current result status</h4>
                        <p>{testCase.resultStatus}</p>
                      </article>

                      <article className="report-subcard">
                        <div className="report-subcard-label">Interpretation</div>
                        <h4>Current finding</h4>
                        <p>{testCase.currentFinding}</p>
                      </article>
                    </div>

                    <article className="report-subcard report-subcard-wide">
                      <div className="report-subcard-label">Evaluation reason</div>
                      <h4>Why this testcase matters</h4>
                      <p>{testCase.whyItMatters}</p>
                    </article>

                    {(testCase.runName ||
                      testCase.executedAt ||
                      testCase.observedScore ||
                      testCase.evaluationResult ||
                      testCase.scoreReading ||
                      testCase.summaryCaveat) && (
                      <article className="report-subcard report-subcard-wide">
                        <div className="report-subcard-label">Execution evidence</div>
                        <h4>Observed run details</h4>
                        <div className="report-meta-grid">
                          {testCase.runName && (
                            <div>
                              <span className="report-meta-label">Run name</span>
                              <p>{testCase.runName}</p>
                            </div>
                          )}
                          {testCase.executedAt && (
                            <div>
                              <span className="report-meta-label">Executed at</span>
                              <p>{testCase.executedAt}</p>
                            </div>
                          )}
                          {testCase.observedScore && (
                            <div>
                              <span className="report-meta-label">Observed score</span>
                              <p>{testCase.observedScore}</p>
                            </div>
                          )}
                        </div>
                        {testCase.evaluationResult && (
                          <p>
                            <strong>CeRAI evaluator output:</strong> {testCase.evaluationResult}
                          </p>
                        )}
                        {testCase.scoreReading && <p>{testCase.scoreReading}</p>}
                        {testCase.summaryCaveat && (
                          <p className="report-muted-note">{testCase.summaryCaveat}</p>
                        )}
                      </article>
                    )}

                    {testCase.whatWeLearned && testCase.whatWeLearned.length > 0 && (
                      <article className="report-subcard report-subcard-wide">
                        <div className="report-subcard-label">Interpretation</div>
                        <h4>What we learned from this run</h4>
                        <ul className="report-list">
                          {testCase.whatWeLearned.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}

                    {testCase.whatItDoesNotProve && testCase.whatItDoesNotProve.length > 0 && (
                      <article className="report-subcard report-subcard-wide">
                        <div className="report-subcard-label">Boundary</div>
                        <h4>What this testcase does not prove</h4>
                        <ul className="report-list">
                          {testCase.whatItDoesNotProve.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="report-section report-section-shell" id="machine-readable-summary">
          <div className="report-section-header">
            <p className="section-kicker">Summary</p>
            <h2>Machine-readable block</h2>
            <p className="report-section-intro">
              This JSON block is intended for the final published report once the executed testcase
              counts and findings have been updated.
            </p>
          </div>

          <article className="report-card">
            <p>
              This block is designed for the final submission page once testcase execution and
              findings have been fully updated.
            </p>
            <pre className="report-json">{summaryJson}</pre>
          </article>
        </section>
      </div>
    </div>
  );
}
