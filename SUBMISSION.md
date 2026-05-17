# Submission Summary

This file is the clean submission companion for the Gates Foundation AI Fellowship India 2026 technical assignment.

## 1. Repository URLs

Primary deliverable repo:

- `https://github.com/harshad-dhokane/kisansaathi`

Supporting evaluation-tool repo:

- `https://github.com/harshad-dhokane/CeRAI-AIEvaluation`

## 2. Live Endpoint URL

- `https://kisaansaathi-eval.vercel.app`

Primary report URL:

- `https://kisaansaathi-eval.vercel.app/results`

Machine-readable findings summary:

- `https://kisaansaathi-eval.vercel.app/api/results-summary`

## 3. Path Chosen And Why

I chose **Option A — Evaluate & Report**. I wanted to evaluate a conversational endpoint that was directly aligned to the fellowship problem rather than using a generic public assistant, so I built and evaluated **KisanSaathi**, a multilingual agriculture advisory chatbot for smallholder farmers. I used a fork of the CeRAI AI Evaluation Tool to manage targets, testcases, plans, runs, and analysis, and I exposed KisanSaathi through an OpenAI-compatible API so CeRAI could evaluate it reproducibly as an API target. This path let me do two things at once: evaluate a realistic farmer-facing system and document where the evaluator itself was strong, brittle, or misleading.

## 4. AI Use, Course Correction, And Workflow

I used AI as an implementation and analysis assistant, not as a blind generator. The workflow was iterative: first I got CeRAI running locally, then I built KisanSaathi, then I connected the two through a CeRAI-compatible API target, then I designed agriculture-specific test plans and ran them in stages. I had to course-correct repeatedly. Some CeRAI strategies were brittle, some strategy-metric pairings were accepted by the UI even though they were invalid in the backend, some evaluation reasons were blank or contradictory, and some local setup paths were under-documented. I corrected this by reading the code paths directly, adjusting runnable strategy choices, documenting evaluator limitations case by case, exposing a deployed API target on Vercel, and building a final `/results` page that presents human-reviewed interpretation rather than raw CeRAI scores alone.

## 5. Clean Story Of The Submission

- **KisanSaathi repo**
  - the chatbot that was evaluated
  - the live endpoint
  - the final findings page
  - the testcase execution ledger
  - the evaluator limitation summary

- **CeRAI fork**
  - the evaluation infrastructure
  - the rerun setup
  - the target/testcase/test-plan workflow
  - the agriculture evaluation reference

This split is intentional: one repo contains the **system being evaluated**, and the other contains the **tool used to evaluate it**.
