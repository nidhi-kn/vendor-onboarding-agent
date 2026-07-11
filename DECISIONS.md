# Design Decisions

Key tradeoffs made while building this within the assignment's time box, and the
reasoning behind each.

## Database: SQLite over PostgreSQL

Chosen for zero setup time — no separate database server to install, configure,
or credential-manage during a tightly time-boxed build. The Prisma schema is
written without SQLite-specific assumptions that would block a future move to
Postgres; switching is a one-line change to the `datasource` provider and
`DATABASE_URL`. Given the assignment's actual grading criteria (architecture and
agent quality over infrastructure choice), the setup-time savings outweighed
demonstrating Postgres specifically.

## Agent architecture: single Planner + Tool Executor over 5 narrow workers

The PRD describes 5 separate worker agents, each with its own constrained tool
allow-list and independently versioned prompt. This build uses one Planner
whose tool calls are still allow-listed and validated by the orchestrator before
execution — the safety property the PRD cares about (a model cannot call a tool
it isn't permitted to) is preserved structurally, just without the additional
indirection of 5 separate prompt files and 5 separate LLM invocations per
workflow step. This was a deliberate scope cut to fit the time box; splitting
into narrow workers would be the natural next iteration if given more time, and
the tool registry's allow-list design already supports that split without
requiring a rewrite.

## Connector architecture: separate process communicating over HTTP

Rather than importing the Telegram connector directly into the same process as
the API server, the connector layer runs as an independent process
(`start-connectors.js`) that communicates with the backend exclusively through
`POST /api/connector/message` — a plain HTTP call, not a shared in-process
function call. This mirrors the PRD's own deployment view (§9.5), which treats
the bot webhook receiver and the agent worker pool as independently deployable
pieces. It also means the connector layer could be redeployed, restarted, or
scaled independently of the API server, and makes it straightforward to test
the API in isolation (as done in `test-integration.js`) without needing a live
Telegram connection.

## Model choice: llama-3.1-8b-instant for development

Groq's `llama-3.3-70b-versatile` produces higher-quality structured output but
adds significant per-call latency (30-55+ seconds observed under load during
testing), which risked timing out the planner's own retry budget. Per the
PRD's own Technology Stack guidance (development → 8b-instant, demo →
70b-versatile), the model is configurable via `GROQ_MODEL` in `.env` — fast
model for iteration and testing, switchable to the larger model for the final
demo recording where output quality matters more than latency.

## In-process synchronous dispatch over a queue + worker pool

The full production architecture described in PRD §9 uses a durable
queue (agent_run queue) consumed by a horizontally-scalable worker pool,
decoupling the webhook response from the (potentially slow) model call. This
build instead dispatches directly, in-process, synchronously. This was a
scope cut for time — see LIMITATIONS.md for the operational implications.
The workflow's *state* is fully durable regardless of this choice, since
every state transition is persisted to the database before the request
completes; only the request/response cycle itself lacks the queue's
crash-resilience.

## Deterministic system-guaranteed message logging over LLM-driven logging

Initially, saving the inbound vendor message to the conversation history
depended on the planner choosing to emit a `conversation.save_message` tool
call correctly — which proved unreliable in testing (the model sometimes
omitted required fields). This was changed so the inbound message is saved
deterministically by the workflow runtime itself, before the planner is even
invoked, rather than being contingent on model behavior. This matches the
PRD's broader philosophy that critical guarantees should be enforced by
scaffolding, not by hoping the model does the right thing.
