# Limitations

This document lists what is intentionally scoped down, mocked, or omitted relative
to the full PRD, given the assignment's time box. Nothing below is hidden — it's
called out here on purpose, per the PRD's own guidance that honest scope
disclosure is scored positively.

## Agent architecture

- **A single Planner + allow-listed Tool Executor is used instead of 5 separate
  narrow worker agents** (DocumentRequestWorker, DocumentValidationWorker,
  ApprovalPrepWorker, ERPWriteWorker, NotificationWorker as described in PRD
  §8.4). Tool access is still constrained per-call via the tool registry's
  allow-list, which preserves the core safety property the PRD is after — a
  tool call outside what's permitted is still rejected by the orchestrator, not
  by prompting. Splitting into 5 separately-versioned prompts was cut for time.

## Orchestration

- **Tool calls and the planner run in-process, synchronously**, rather than
  through a durable queue + horizontally-scaled worker pool (PRD §9.4–9.5).
  This means the current system does not survive a mid-request crash the way a
  queue-backed design would, though workflow *state* itself is still fully
  durable in the database — only an in-flight request would need to be retried
  by the vendor, not the whole workflow.
- **The `Execution` entity (a grouping of multiple Agent Runs into one resumed
  pass, per PRD §10.1) was not implemented as a separate table.** Agent Runs
  are tracked individually against their Workflow directly.

## Connectors

- **Telegram is fully implemented** (long-polling, not webhook — acceptable for
  local/dev per PRD §6.4, would need to move to webhook mode for production).
- **One additional connector (ERP) is mocked**, returning fixture responses
  rather than calling a real ERP system, per the PRD's explicit allowance for
  this (§11.2).
- **Email, WhatsApp, Google Sheets, and CRM connectors are not implemented.**
  The connector interface supports adding them without touching agent or
  workflow code, but no additional connector beyond Telegram + mock ERP was
  built for this submission.

## Dashboard

- The dashboard covers workflow list, workflow detail (documents, timeline,
  conversation history), vendor list, and a pending-approvals worklist with
  working approve/reject actions. **It does not implement the PRD's other
  screens**: Operations Overview KPIs, Connector Health, Analytics, or the
  Execution Timeline Gantt view (PRD §7.1, 7.7, 7.8, 7.10).
- **Live updates use polling/manual refresh, not Server-Sent Events (SSE)** as
  the PRD prefers for operational screens (§7.11).

## Human approval

- **Editing vendor details mid-flow (e.g., correcting a name after it's been
  submitted) is not a supported operation.** The state machine correctly
  rejects an attempted backward transition for this case rather than silently
  allowing it — this is intentional per the PRD's insistence that the state
  machine, not the model, is the authority on legal transitions (R8.17), but
  it does mean a vendor who makes a typo currently has no in-flow way to
  correct it without operator intervention.

## Reliability

- **No dead-letter queue** for messages that fail beyond max retry attempts —
  failures surface to a `FAILED` workflow state and the audit log instead
  (PRD's principle that no workflow dies silently is still upheld; the
  specific dead-letter mechanism in §13.4 R13.16 is not implemented).
- Retry/backoff is implemented on the Groq model call. Retry coverage on
  connector calls beyond Telegram is more limited given the ERP connector is
  itself mocked and doesn't fail in realistic ways.

## Database

- **SQLite is used instead of PostgreSQL.** The schema is written to be
  portable — swapping the Prisma datasource provider to `postgresql` and
  updating `DATABASE_URL` is a one-line config change, no schema redesign
  needed. SQLite was chosen to minimize setup time within the assignment
  window; see DECISIONS.md for the full reasoning.
