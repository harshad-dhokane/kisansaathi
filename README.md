# KisanSaathi

KisanSaathi is the **primary Option A deliverable** for the Gates Foundation AI Fellowship India 2026 technical assignment.

It is a multilingual agriculture advisory chatbot developed by Harshad Dhokane.

It was chosen because it matches the assignment’s real use case closely:

- farmer-facing crop guidance
- safer next-step support
- multilingual access
- a deployable live endpoint
- a CeRAI-compatible API surface for structured evaluation

The **supporting evaluation-tool repo** used in this work is:

- CeRAI fork: `https://github.com/harshad-dhokane/CeRAI-AIEvaluation`

## Live Deployment

The deployed KisanSaathi instance used for the final remote CeRAI validation is:

- app root: `https://kisaansaathi-eval.vercel.app`
- chat UI: `https://kisaansaathi-eval.vercel.app/chat`
- results report: `https://kisaansaathi-eval.vercel.app/results`
- results summary API: `https://kisaansaathi-eval.vercel.app/api/results-summary`
- health endpoint: `https://kisaansaathi-eval.vercel.app/api/health`
- OpenAI-compatible base URL: `https://kisaansaathi-eval.vercel.app/api/openai`
- models endpoint: `https://kisaansaathi-eval.vercel.app/api/openai/v1/models`

## What This Repository Contains

This repo contains:

- the KisanSaathi application
- the live chat surface
- the OpenAI-compatible evaluation API
- the final `/results` report
- the machine-readable `/api/results-summary` output
- the testcase execution ledger
- the CeRAI limitation notes discovered during the assignment

This repo does **not** contain the CeRAI platform itself. The CeRAI fork lives in the separate repository linked above.

## What Is Implemented

KisanSaathi already includes:

- a public landing page for demo and navigation
- a farmer-facing `/chat` experience
- a structured `/results` report page with the executed CeRAI findings
- an app-native chat API at `POST /api/chat`
- an OpenAI-compatible CeRAI endpoint at `POST /api/openai/v1/chat/completions`
- a model listing endpoint at `GET /api/openai/v1/models`
- a health endpoint at `GET /api/health`
- guardrails for harmful requests, non-agriculture drift, risky chemical guidance, and unnecessary personal-data sharing
- multilingual prompt handling for Indian agriculture use cases

## Assignment Story

This project corresponds to **Option A — Evaluate & Report**.

The structure is intentionally split across two repositories:

- **KisanSaathi repo**
  - the evaluated conversational system
  - the live endpoint
  - the final findings page
  - the final interpretation of the executed testcases

- **CeRAI fork**
  - the evaluation infrastructure
  - the target, plan, testcase, and rerun workflow
  - the local bootstrap/setup for the evaluator
  - the supporting agriculture evaluation reference

That split keeps the story clean:

- KisanSaathi is the product being judged
- CeRAI is the tool used to judge it

## Implementation Summary

The current app is not just a chatbot shell. It includes the implementation work needed for both demonstration and evaluation:

- branded KisanSaathi UI and metadata
- model routing between Groq Qwen and OpenRouter Nemotron via environment configuration
- structured prompt and plain-text fallback handling
- live context support for date, time, location, and weather-sensitive replies
- a report-ready results page built from executed testcase evidence
- submission-facing evaluation summaries, tool limitation summaries, and testcase interpretations
- repository hygiene for deployment: `.env` files ignored, `.env.example` documented, generated folders ignored

## Product Behavior

KisanSaathi is designed to behave like a practical field advisor, not a generic assistant:

- answer in the user's language when possible
- start with the most useful direct answer
- ask only a small number of focused follow-up questions
- avoid false certainty for diagnosis and treatment
- refuse harmful, illegal, fraudulent, or unsafe requests
- avoid exact unlabeled dose, interval, or tank-mix instructions
- avoid asking for or casually repeating sensitive personal information
- redirect non-agriculture questions back to farming support

## Project Structure

- `/`
  - landing page
- `/chat`
  - live KisanSaathi chat experience
- `/results`
  - executed evaluation report and submission-facing findings
- `app/api/chat`
  - app-specific chat route
- `app/api/openai`
  - CeRAI-compatible OpenAI-style API surface
- `lib/`
  - configuration, prompts, model routing, guardrails, reporting data
- `components/`
  - chat UI and results UI
- `TESTCASE_EXECUTION_LEDGER.md`
  - testcase-by-testcase execution and interpretation log
- `CERAI_LIMITATIONS.md`
  - observed evaluator limitations from the executed runs
- `README.md`
  - primary app and submission-oriented documentation
- `SUBMISSION.md`
  - ready-to-submit assignment summary

## Environment Setup

Create your local env file:

```bash
cp .env.example .env
```

`CONVERSATIONAL_MODEL` supports:

- `qwen`
- `nemotron_super`

### Required Variables

```env
APP_PORT=3001
APP_BASE_URL=http://localhost:3001
CONVERSATIONAL_MODEL=qwen
GROQ_API_KEY=
GROQ_MODEL=qwen/qwen3-32b
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b
```

Notes:

- only the provider key for the selected `CONVERSATIONAL_MODEL` is required at runtime
- `APP_PORT` is mainly for local development
- for Vercel, set `APP_BASE_URL` to the deployed HTTPS URL
- do not commit `.env` or any real credentials

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Default local URLs:

- `http://localhost:3001/`
- `http://localhost:3001/chat`
- `http://localhost:3001/results`

## Why We Built Our Own Bot Instead Of Using Someone Else’s

KisanSaathi was built rather than borrowing an external chatbot because the assignment was not only about running an evaluator. It was also about making sound technical decisions around a real use case.

Building our own bot gave us:

- control over prompt design
- control over safety behavior
- control over multilingual handling
- control over the API contract
- the ability to expose an OpenAI-compatible endpoint for CeRAI
- the ability to interpret failures as either bot failures or evaluator limitations

If we had used someone else’s bot, we could have reported scores, but we could not have meaningfully improved or explain the system design choices behind those scores.

## CeRAI Integration

KisanSaathi was designed to be evaluated through CeRAI as an **API target**, not only as a visual chat UI.

That decision mattered because API evaluation is:

- more reproducible than browser automation
- faster than UI-driven testing
- less flaky than DOM-dependent interaction
- easier to validate locally and remotely with curl and CeRAI

The CeRAI fork used in this project is:

- `https://github.com/harshad-dhokane/CeRAI-AIEvaluation`

KisanSaathi exposes a localhost OpenAI-compatible surface for CeRAI:

- base URL: `http://localhost:3001/api/openai`
- chat completions: `http://localhost:3001/api/openai/v1/chat/completions`
- models: `http://localhost:3001/api/openai/v1/models`
- results summary: `http://localhost:3001/api/results-summary`

Deployed OpenAI-compatible surface used for remote CeRAI validation:

- base URL: `https://kisaansaathi-eval.vercel.app/api/openai`
- chat completions: `https://kisaansaathi-eval.vercel.app/api/openai/v1/chat/completions`
- models: `https://kisaansaathi-eval.vercel.app/api/openai/v1/models`
- results summary: `https://kisaansaathi-eval.vercel.app/api/results-summary`

Recommended local TDMS target when using the default Qwen setup:

- `Target`: `agri-advisory-qwen32b`
- `Type`: `API`
- `URL`: `http://localhost:3001/api/openai`
- `Domain`: `agriculture`

If you switch the configured conversational model, the API route stays the same and only the target naming needs to stay aligned with the selected backend.

Recommended deployed TDMS target used in CeRAI after the remote-target compatibility fix:

- `Target`: `gpt-kisansaathi-vercel`
- `Type`: `API`
- `URL`: `https://kisaansaathi-eval.vercel.app/api/openai`
- `Domain`: `agriculture`

For the full evaluator-side setup and rerun instructions, see the CeRAI fork README and:

- `https://github.com/harshad-dhokane/CeRAI-AIEvaluation/blob/main/AGRICULTURE_EVALUATION_REFERENCE.md`

## Vercel Deployment

1. Push this `agri-chatbot` directory as its own Git repository.
2. Import the repository into Vercel.
3. Set environment variables in Vercel:
   - `CONVERSATIONAL_MODEL`
   - `GROQ_API_KEY` and `GROQ_MODEL` if using Qwen
   - `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` if using Nemotron
   - `APP_BASE_URL` as your deployed domain, for example `https://your-project.vercel.app`
4. Deploy.

Vercel does not need `APP_PORT`.

## What Is In The Results Report

The `/results` page now contains:

- executed testcase evidence only
- overall summary grounded in specific testcases
- tool-limitation report grounded in specific testcases
- submission essentials for the Option A deliverable
- linked testcase IDs so the viewer can trace each conclusion
- a machine-readable summary block embedded on the page
- a machine-readable summary endpoint at `/api/results-summary`

## Repositories Used In The Assignment

Primary deliverable:

- KisanSaathi: `https://github.com/harshad-dhokane/kisansaathi`

Supporting evaluation repo:

- CeRAI fork: `https://github.com/harshad-dhokane/CeRAI-AIEvaluation`

Use the KisanSaathi repo to understand the chatbot and final report.

Use the CeRAI fork to understand the evaluator setup, rerun steps, and evaluation infrastructure.

## Safe Git Push Checklist

Before pushing:

- keep `.env` local only
- keep API keys only in local env or Vercel env settings
- verify `.env.example` contains placeholders only
- verify no credentials are hard-coded in source files

## Reference Docs

- [TESTCASE_EXECUTION_LEDGER.md](./TESTCASE_EXECUTION_LEDGER.md)
- [CERAI_LIMITATIONS.md](./CERAI_LIMITATIONS.md)
- [AGRICULTURE_EVALUATION_FLOW.md](./AGRICULTURE_EVALUATION_FLOW.md)
- [AGRICULTURE_EVALUATION_PLAN.md](./AGRICULTURE_EVALUATION_PLAN.md)
- [SUBMISSION.md](./SUBMISSION.md)
