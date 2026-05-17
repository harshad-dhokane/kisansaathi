# AgriSmart

AgriSmart is a multilingual agriculture advisory app developed by Harshad Dhokane for the Gates Foundation Option A workflow. It was chosen because it matches the real fellowship problem closely: farmer-facing crop guidance, safer next-step support, multilingual access, and a CeRAI-compatible evaluation surface in one deployable app.

## What Is Implemented

AgriSmart already includes:

- a public landing page for demo and navigation
- a farmer-facing `/chat` experience
- a structured `/results` report page with the executed CeRAI findings
- an app-native chat API at `POST /api/chat`
- an OpenAI-compatible CeRAI endpoint at `POST /api/openai/v1/chat/completions`
- a model listing endpoint at `GET /api/openai/v1/models`
- a health endpoint at `GET /api/health`
- guardrails for harmful requests, non-agriculture drift, risky chemical guidance, and unnecessary personal-data sharing
- multilingual prompt handling for Indian agriculture use cases

## Implementation Summary

The current app is not just a chatbot shell. It includes the implementation work needed for both demonstration and evaluation:

- branded AgriSmart UI and metadata
- model routing between Groq Qwen and OpenRouter Nemotron via environment configuration
- structured prompt and plain-text fallback handling
- live context support for date, time, location, and weather-sensitive replies
- a report-ready results page built from executed testcase evidence
- submission-facing evaluation summaries, tool limitation summaries, and testcase interpretations
- repository hygiene for deployment: `.env` files ignored, `.env.example` documented, generated folders ignored

## Product Behavior

AgriSmart is designed to behave like a practical field advisor, not a generic assistant:

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
  - live AgriSmart chat experience
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

## CeRAI Integration

AgriSmart exposes a localhost OpenAI-compatible surface for CeRAI:

- base URL: `http://localhost:3001/api/openai`
- chat completions: `http://localhost:3001/api/openai/v1/chat/completions`
- models: `http://localhost:3001/api/openai/v1/models`

Recommended local TDMS target when using the default Qwen setup:

- `Target`: `agri-advisory-qwen32b`
- `Type`: `API`
- `URL`: `http://localhost:3001/api/openai`
- `Domain`: `agriculture`

If you switch the configured conversational model, the API route stays the same and only the target naming needs to stay aligned with the selected backend.

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
