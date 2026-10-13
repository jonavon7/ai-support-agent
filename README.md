# AI Support Agent

A TypeScript-based AI support agent that combines LLM reasoning, tool calling, deterministic business logic, human approval flows, and behavioral evaluation.

The project is being built as a practical exploration of AI engineering patterns, with a focus on keeping agent behavior explicit, testable, and safe.

## What it does

The agent can currently:

- Retrieve customer information
- Retrieve subscription information
- Create support tickets
- Prepare subscription cancellation requests
- Require explicit human confirmation before executing sensitive actions
- Handle domain and application errors without exposing unsafe side effects
- Preserve conversational state across interactions

## Architecture

The project follows a pragmatic Clean / Hexagonal Architecture approach.

```text
src/
  domain/
  application/
  infrastructure/
  agent/
```

Main responsibilities:

```text
User
  ↓
SupportAgent
  ↓
LLM
  ↓
Tool call
  ↓
Application use case
  ↓
Domain rules
  ↓
Repository / external system
```

The LLM is responsible for interpreting intent and deciding when to use tools.

Business rules and sensitive side effects remain deterministic and are executed by application/domain code rather than by the model itself.

## Agent loop

The agent uses an explicit tool-use loop:

```text
LLM response
  ↓
tool_use?
  ├── no  → return response
  └── yes
        ↓
     execute tool
        ↓
     append tool result
        ↓
     call LLM again
```

The loop is implemented directly rather than hidden behind an agent framework in order to make the orchestration behavior easier to understand, test, and evolve.

## Human-in-the-loop

Sensitive actions such as subscription cancellation require explicit approval.

Example:

```text
User asks to cancel subscription
        ↓
Agent prepares cancellation
        ↓
Pending action is stored
        ↓
User must reply CONFIRM
        ↓
Cancellation is executed deterministically
```

The initial request does not cancel the subscription.

The model cannot bypass the approval step.

## Tools

Current tools include:

```text
get_customer
get_subscription
create_support_ticket
request_cancel_subscription
```

Tools act as adapters into application use cases rather than containing business logic directly.

## Evaluation

The project uses two complementary testing strategies.

### Vitest

Used for deterministic behavior such as:

- business rules
- use cases
- error handling
- confirmation flows
- state transitions
- side effects

### Promptfoo

Used for probabilistic agent behavior such as:

- correct tool selection
- tool-call arguments
- response grounding
- error communication
- approval behavior
- agent iteration limits

This allows deterministic software behavior and LLM behavior to be evaluated separately.

## Tech stack

- TypeScript
- Node.js
- Anthropic API
- Vitest
- Promptfoo
- ESLint
- Strict TypeScript / ESM

## Current status

The project is actively evolving.

Current focus:

```text
agent foundations
→ tool calling
→ human approval
→ evaluation
→ agentic system patterns
→ retrieval / RAG
→ observability
→ production hardening
```

## Running locally

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Add the required API credentials to `.env`.

Run the project:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run type checking:

```bash
npm run typecheck
```

Run linting:

```bash
npm run lint
```

Run agent evaluations:

```bash
npx promptfoo eval
```

## Design principles

The project intentionally follows a few rules:

- LLMs interpret intent; code enforces business rules
- Sensitive side effects require explicit approval
- Domain logic does not depend on the LLM provider
- Tools expose capabilities, not unrestricted system access
- Agent behavior should be observable and evaluable
- Deterministic logic should remain deterministic whenever possible

## Roadmap

Planned areas of exploration include:

- richer agent orchestration patterns
- knowledge retrieval and RAG
- persistent state
- tracing and observability
- cost and latency monitoring
- security and permission boundaries
- production deployment

## Purpose

This project is primarily a hands-on AI engineering project focused on understanding how production-oriented agentic systems are designed, orchestrated, evaluated, and integrated with traditional software architecture.
