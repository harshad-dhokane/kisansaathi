import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell shell-home">
      <section className="hero">
        <div className="hero-copy">
          <p className="section-kicker">Agriculture AI</p>
          <h1>KisanSaathi is built for farmer-facing advisory and CeRAI evaluation.</h1>
          <p className="lede">
            KisanSaathi is a multilingual agriculture assistant designed for smallholder-style
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
    </main>
  );
}
