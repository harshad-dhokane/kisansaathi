import Link from "next/link";
import { HomeNavCard } from "@/components/home-nav-card";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="section-kicker">Agriculture AI</p>
          <h1>AgriSmart is built for farmer-facing advisory and CeRAI evaluation.</h1>
          <p className="lede">
            AgriSmart is a multilingual agriculture assistant designed for smallholder-style
            crop advisory, safer farm decision support, and structured evaluation through CeRAI.
            Use the live chat experience for demonstration, then publish your interpreted Option A
            findings through the results page.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/chat">
              Open chat interface
            </Link>
            <Link className="button button-secondary" href="/results">
              Open results page
            </Link>
          </div>
        </div>
      </section>

      <section className="nav-grid">
        <HomeNavCard
          eyebrow="Option A"
          title="Chat API + UI"
          description="Use the live farming chatbot, inspect the guarded behavior, and connect CeRAI locally through the OpenAI-compatible route."
          href="/chat"
          cta="Try the chatbot"
        />
        <HomeNavCard
          eyebrow="Submission"
          title="Results"
          description="Publish interpreted evaluation findings here once the CeRAI runs are complete, including a machine-readable summary block."
          href="/results"
          cta="View evaluation report"
        />
      </section>
    </main>
  );
}
