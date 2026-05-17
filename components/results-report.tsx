import type { ReactNode } from "react";

import { resultsReportData, getResultsSummaryJson } from "@/lib/results-data";

function statusClassName(status: string) {
  if (status === "Executed" || status === "Completed" || status === "In progress") {
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

function renderInlineText(text: string): ReactNode[] {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={index}>{part.slice(1, -1)}</code>;
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      return part;
    });
}

function RichText({ text }: { text: string }) {
  return <>{renderInlineText(text)}</>;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function ResultsReport() {
  const summaryJson = JSON.stringify(getResultsSummaryJson(), null, 2);
  const caseGroups = resultsReportData.caseGroups
    .map((group) => ({
      ...group,
      cases: group.cases.filter((testCase) => testCase.status === "Executed"),
    }))
    .filter((group) => group.cases.length > 0);
  const allCases = caseGroups.flatMap((group) => group.cases);
  const totalTests = allCases.length;
  const executedCaseIds = new Set(allCases.map((testCase) => testCase.id));
  const strategyCoverage = resultsReportData.strategyCoverage
    .map((entry) => ({
      ...entry,
      assignedCaseIds: entry.assignedCaseIds.filter((caseId) => executedCaseIds.has(caseId)),
    }))
    .filter((entry) => entry.assignedCaseIds.length > 0);

  const planEvidence = new Map<
    string,
    {
      caseCount: number;
      metrics: string[];
      strategies: string[];
      runNames: string[];
    }
  >();

  for (const group of caseGroups) {
    planEvidence.set(group.plan, {
      caseCount: group.cases.length,
      metrics: unique(group.cases.map((testCase) => testCase.metric)),
      strategies: unique(group.cases.map((testCase) => testCase.strategy)),
      runNames: unique(group.cases.map((testCase) => testCase.runName).filter(Boolean) as string[]),
    });
  }

  const plans = resultsReportData.plans.filter((plan) => planEvidence.has(plan.name));

  return (
    <div className="report-layout">
      <script
        id="results-summary-json"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: summaryJson }}
      />
      <aside className="report-sidebar">
        <div className="report-sidebar-card">
          <p className="section-kicker">Results Index</p>
          <h2>{resultsReportData.meta.systemName}</h2>
          <p>
            Executed evidence only. The index below now points to the final submission sections,
            completed plan coverage, and reviewed testcase evidence.
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
            <p className="report-nav-heading">Executed coverage</p>
            <div className="report-nav-links">
              <a className="report-nav-link" href="#evaluation-setup">
                Evaluation setup
              </a>
              <a className="report-nav-link" href="#strategy-coverage">
                Executed strategies
              </a>
              <div className="report-subnav">
                {strategyCoverage.map((entry) => (
                  <a key={entry.id} href={`#${entry.id}`}>
                    {entry.strategy}
                  </a>
                ))}
              </div>
              <a className="report-nav-link" href="#plan-tracker">
                Completed plans
              </a>
              <div className="report-subnav">
                {plans.map((plan) => (
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
              {caseGroups.map((group) => (
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
            <p className="report-nav-heading">Closing section</p>
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
              <span>Primary strategy family</span>
              <strong>{resultsReportData.meta.strategyDefault}</strong>
            </article>
            <article className="report-stat-card">
              <span>Completed plans</span>
              <strong>{plans.length}</strong>
            </article>
            <article className="report-stat-card">
              <span>Total executed tests</span>
              <strong>{totalTests}</strong>
            </article>
          </div>
        </section>

        <section className="report-section report-section-shell" id="overall-summary">
          <div className="report-section-header">
            <p className="section-kicker">Executive overview</p>
            <h2>Overall summary</h2>
            <p className="report-section-intro">
              This section is the final professional read of the executed suite. It focuses on
              what the chatbot actually did, where the evaluator distorted the reading, and which
              patterns are strong enough to state confidently.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.overallSummaryCards.map((card) => (
              <article key={card.id} className="report-card">
                <div className="report-card-kicker">{card.label}</div>
                <h3>{card.title}</h3>
                <p>
                  <RichText text={card.summary} />
                </p>
                <p>
                  <strong>Why this matters:</strong> <RichText text={card.implication} />
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
              These are the evaluator limitations that materially changed interpretation in the
              final suite. They are included here because several recorded scores would be
              misleading without a human read of the testcase.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.toolLimitationsReportCards.map((card) => (
              <article key={card.id} className="report-card">
                <div className="report-card-kicker">{card.label}</div>
                <h3>{card.title}</h3>
                <p>
                  <RichText text={card.summary} />
                </p>
                <p>
                  <strong>Practical consequence:</strong> <RichText text={card.implication} />
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
              These five entries answer the core Option A submission requirements directly and in
              final-report form.
            </p>
          </div>

          <div className="report-card-stack">
            {resultsReportData.requirementPoints.map((point, index) => (
              <article key={point.id} className="report-card" id={point.id}>
                <div className="report-card-kicker">Required point {index + 1}</div>
                <h3>{point.title}</h3>
                <p>
                  <RichText text={point.answer} />
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="report-section report-section-shell" id="evaluation-setup">
          <div className="report-section-header">
            <p className="section-kicker">Method</p>
            <h2>Evaluation setup and scoring context</h2>
            <p className="report-section-intro">
              The chatbot, evaluator, and scoring path are separated clearly here so the report is
              read as an evidence-backed evaluation rather than a raw demo log.
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
                <li>Store the target, plans, testcases, and run metadata.</li>
                <li>Send prompts to KisanSaathi through the OpenAI-compatible API route.</li>
                <li>Capture responses per testcase and record the selected scoring path.</li>
                <li>Compute strategy-based outputs that are then manually reviewed in context.</li>
                <li>Act as the evaluation framework, not as the chatbot being judged.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="report-section report-section-shell" id="strategy-coverage">
          <div className="report-section-header">
            <p className="section-kicker">Strategies</p>
            <h2>Executed strategy coverage</h2>
            <p className="report-section-intro">
              Only strategy families with executed testcase evidence are shown below. Removed
              entries were excluded because they had no completed run evidence in the final suite.
            </p>
          </div>

          <div className="report-card-stack">
            {strategyCoverage.map((entry) => (
              <article key={entry.id} className="report-card" id={entry.id}>
                <div className="report-card-kicker">Executed strategy</div>
                <div className="report-card-topline">
                  <div>
                    <h3>{entry.strategy}</h3>
                    <p>
                      <RichText text={entry.purpose} />
                    </p>
                  </div>
                  <span className={coverageStatusClassName(entry.status)}>{entry.status}</span>
                </div>

                <div className="report-meta-grid">
                  <div>
                    <span className="report-meta-label">What it measured</span>
                    <p>
                      <RichText text={entry.metricMode} />
                    </p>
                  </div>
                  <div>
                    <span className="report-meta-label">Reading rule</span>
                    <p>
                      <RichText text={entry.infrastructureNote} />
                    </p>
                  </div>
                </div>

                <div className="report-linked-cases">
                  <span className="report-meta-label">Executed evidence</span>
                  <div className="report-chip-list">
                    {entry.assignedCaseIds.map((caseId) => (
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

        <section className="report-section report-section-shell" id="plan-tracker">
          <div className="report-section-header">
            <p className="section-kicker">Plans</p>
            <h2>Completed plan coverage</h2>
            <p className="report-section-intro">
              The plan tracker now reflects completed coverage only. Metrics, strategies, and run
              names are taken from executed testcases rather than earlier planning notes.
            </p>
          </div>

          <div className="report-card-stack">
            {plans.map((plan) => {
              const evidence = planEvidence.get(plan.name);

              if (!evidence) {
                return null;
              }

              return (
                <article key={plan.id} className="report-card" id={plan.id}>
                  <div className="report-card-kicker">Completed plan</div>
                  <div className="report-card-topline">
                    <div>
                      <h3>{plan.name}</h3>
                      <p>
                        <RichText text={plan.goal} />
                      </p>
                    </div>
                    <span className={statusClassName(plan.status)}>{plan.status}</span>
                  </div>

                  <div className="report-plan-summary">
                    <span className="report-evidence-pill">
                      <strong>Cases</strong>
                      {String(evidence.caseCount)}
                    </span>
                    <span className="report-evidence-pill">
                      <strong>Metrics</strong>
                      {String(evidence.metrics.length)}
                    </span>
                    <span className="report-evidence-pill">
                      <strong>Strategies</strong>
                      {String(evidence.strategies.length)}
                    </span>
                    <span className="report-evidence-pill">
                      <strong>Runs</strong>
                      {String(evidence.runNames.length)}
                    </span>
                  </div>

                  <div className="report-meta-grid">
                    <div>
                      <span className="report-meta-label">Executed metrics</span>
                      <div className="report-chip-list">
                        {evidence.metrics.map((metric) => (
                          <span key={metric} className="report-chip-link report-chip-static">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="report-meta-label">Executed strategies</span>
                      <div className="report-chip-list">
                        {evidence.strategies.map((strategy) => (
                          <span key={strategy} className="report-chip-link report-chip-static">
                            {strategy}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="report-meta-grid-full">
                      <span className="report-meta-label">Recorded run names</span>
                      <div className="report-chip-list">
                        {evidence.runNames.map((runName) => (
                          <span key={runName} className="report-chip-link report-chip-static">
                            {runName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {caseGroups.map((group) => {
          const groupMetrics = unique(group.cases.map((testCase) => testCase.metric));
          const groupStrategies = unique(group.cases.map((testCase) => testCase.strategy));

          return (
            <section key={group.id} className="report-section report-section-shell" id={group.id}>
              <div className="report-section-header">
                <p className="section-kicker">Testcases</p>
                <h2>{group.title}</h2>
                <p className="report-section-intro">
                  <RichText text={group.description} />
                </p>
              </div>

              <article className="report-card report-group-card">
                <div className="report-card-kicker">Section summary</div>
                <div className="report-card-topline">
                  <div>
                    <h3>{group.plan}</h3>
                    <p>{group.cases.length} executed cases retained in the final report.</p>
                  </div>
                  <span className="report-status report-status-live">
                    {group.cases.length} executed
                  </span>
                </div>

                <div className="report-plan-summary">
                  <span className="report-evidence-pill">
                    <strong>Metrics</strong>
                    {String(groupMetrics.length)}
                  </span>
                  <span className="report-evidence-pill">
                    <strong>Strategies</strong>
                    {String(groupStrategies.length)}
                  </span>
                </div>

                <div className="report-meta-grid">
                  <div>
                    <span className="report-meta-label">Metrics used</span>
                    <div className="report-chip-list">
                      {groupMetrics.map((metric) => (
                        <span key={metric} className="report-chip-link report-chip-static">
                          {metric}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="report-meta-label">Strategies used</span>
                    <div className="report-chip-list">
                      {groupStrategies.map((strategy) => (
                        <span key={strategy} className="report-chip-link report-chip-static">
                          {strategy}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>

              <div className="report-case-stack">
                {group.cases.map((testCase, index) => (
                  <details
                    key={testCase.id}
                    className="report-case"
                    id={testCase.id}
                    open={index === 0}
                  >
                    <summary className="report-case-summary">
                      <div className="report-case-title">
                        <strong>{testCase.id}</strong>
                        <span>
                          {testCase.metric} · {testCase.strategy}
                        </span>
                      </div>
                      <div className="report-case-summary-right">
                        {testCase.observedScore && (
                          <span className="report-case-score-inline">
                            Score {testCase.observedScore}
                          </span>
                        )}
                        <span>{testCase.language}</span>
                        <span className={statusClassName(testCase.status)}>{testCase.status}</span>
                      </div>
                    </summary>

                    <div className="report-case-body">
                      <div className="report-plan-summary">
                        {testCase.observedScore && (
                          <span className="report-evidence-pill report-evidence-pill-score">
                            <strong>Observed score</strong>
                            {testCase.observedScore}
                          </span>
                        )}
                        <span className="report-evidence-pill">
                          <strong>Metric</strong>
                          {testCase.metric}
                        </span>
                        <span className="report-evidence-pill">
                          <strong>Strategy</strong>
                          {testCase.strategy}
                        </span>
                        <span className="report-evidence-pill">
                          <strong>Plan</strong>
                          {testCase.plan}
                        </span>
                        {testCase.runName && (
                          <span className="report-evidence-pill">
                            <strong>Run</strong>
                            {testCase.runName}
                          </span>
                        )}
                      </div>

                      <div className="report-case-grid">
                        <article className="report-subcard">
                          <div className="report-subcard-label">Prompt asked</div>
                          <h4>User prompt</h4>
                          <p>
                            <RichText text={testCase.prompt} />
                          </p>
                        </article>

                        <article className="report-subcard">
                          <div className="report-subcard-label">Expected behavior</div>
                          <h4>Ground-truth focus</h4>
                          <p>
                            <RichText text={testCase.groundTruthFocus} />
                          </p>
                        </article>

                        <article className="report-subcard">
                          <div className="report-subcard-label">Risk being tested</div>
                          <h4>Why this testcase matters</h4>
                          <p>
                            <RichText text={testCase.whyItMatters} />
                          </p>
                        </article>

                        <article className="report-subcard">
                          <div className="report-subcard-label">Recorded outcome</div>
                          <h4>Execution status</h4>
                          <p>
                            <RichText text={testCase.resultStatus} />
                          </p>
                        </article>
                      </div>

                      <article className="report-subcard report-subcard-wide report-subcard-spotlight">
                        <div className="report-subcard-label">Human review</div>
                        <h4>What the run actually showed</h4>
                        <p>
                          <RichText text={testCase.currentFinding} />
                        </p>
                      </article>

                      {(testCase.runName ||
                        testCase.executedAt ||
                        testCase.observedScore ||
                        testCase.evaluationResult ||
                        testCase.scoreReading) && (
                        <article className="report-subcard report-subcard-wide">
                          <div className="report-subcard-label">Recorded evidence</div>
                          <h4>Run details and evaluator output</h4>
                          <div className="report-meta-grid">
                            {testCase.runName && (
                              <div>
                                <span className="report-meta-label">Run name</span>
                                <p>
                                  <RichText text={testCase.runName} />
                                </p>
                              </div>
                            )}
                            {testCase.executedAt && (
                              <div>
                                <span className="report-meta-label">Executed at</span>
                                <p>
                                  <RichText text={testCase.executedAt} />
                                </p>
                              </div>
                            )}
                            {testCase.observedScore && (
                              <div>
                                <span className="report-meta-label">Observed score</span>
                                <p>
                                  <RichText text={testCase.observedScore} />
                                </p>
                              </div>
                            )}
                          </div>
                          {testCase.evaluationResult && (
                            <p>
                              <strong>CeRAI evaluator output:</strong>{" "}
                              <RichText text={testCase.evaluationResult} />
                            </p>
                          )}
                          {testCase.scoreReading && (
                            <p>
                              <strong>Score reading:</strong> <RichText text={testCase.scoreReading} />
                            </p>
                          )}
                        </article>
                      )}

                      {testCase.summaryCaveat && (
                        <article className="report-subcard report-subcard-wide report-subcard-warning">
                          <div className="report-subcard-label">Caveat</div>
                          <h4>Why the evaluator summary should be read carefully</h4>
                          <p>
                            <RichText text={testCase.summaryCaveat} />
                          </p>
                        </article>
                      )}

                      {testCase.whatWeLearned && testCase.whatWeLearned.length > 0 && (
                        <article className="report-subcard report-subcard-wide">
                          <div className="report-subcard-label">Interpretation</div>
                          <h4>What we learned from this run</h4>
                          <ul className="report-list">
                            {testCase.whatWeLearned.map((item) => (
                              <li key={item}>
                                <RichText text={item} />
                              </li>
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
                              <li key={item}>
                                <RichText text={item} />
                              </li>
                            ))}
                          </ul>
                        </article>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}

        <section className="report-section report-section-shell" id="machine-readable-summary">
          <div className="report-section-header">
            <p className="section-kicker">Summary</p>
            <h2>Machine-readable block</h2>
            <p className="report-section-intro">
              The final report also exposes a structured JSON summary. It is embedded here and is
              available directly from <code>/api/results-summary</code>.
            </p>
          </div>

          <article className="report-card">
            <p>
              This block records the evaluated system, live endpoints, executed coverage, key
              findings, and evaluator limitations in a machine-readable format for verification and
              reuse.
            </p>
            <pre className="report-json">{summaryJson}</pre>
          </article>
        </section>
      </div>
    </div>
  );
}
