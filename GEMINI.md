# Project: AI-Assisted Development Course Homework

This repository is dedicated to homework assignments for the **GenAI and Agentic AI for Software Engineering** course. It follows a structured approach where each homework task is contained in its own directory.

## 📁 Repository Structure

- `homework-1/`: Banking Transactions API (Node.js/Express).
- `homework-2/`: Enhanced application with tests (likely building on HW1 patterns).
- `homework-3/`: Specification-driven design (documentation-focused).
- `homework-4/`, `homework-5/`, `homework-6/`: Future assignments.
- `node_modules/`: Shared dependencies for the root and potentially sub-projects.

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Web Framework:** Express.js
- **Language:** JavaScript (CommonJS) / TypeScript (as per user preference in global GEMINI.md)
- **Utilities:** `uuid` for ID generation.
- **Testing/Demo:** Shell scripts (`curl`), REST Client (`.http`), and manual documentation.

## 🧠 Custom Agent Skills

The following workspace-specific skills are installed to assist with course requirements:

- **`ai-workflow-chronicler`**: Automates logging of AI prompts and decisions to `docs/ai-interaction-log.md`.
- **`fintech-guardrail`**: Enforces ISO standards (4217, 8601) and banking validation rules.
- **`web-backend-expert`**: Provides idiomatic patterns for Node.js/Express (JS/TS), including route scaffolding and error handling.

*Note: If you just installed these, run `/skills reload` in your interactive session.*

## 🚀 Building and Running

### Root Level
- Install shared dependencies: `npm install`

### Homework-specific (e.g., homework-1)
- **Install:** `cd homework-X && npm install`
- **Start:** `cd homework-X && npm start` (usually starts `src/index.js`)
- **Demo:** Each homework typically has a `demo/` folder with `run.sh` and sample request scripts.
  - Run demo: `cd homework-X/demo && ./run.sh`

## 📝 Development Conventions

- **AI Usage:** This course emphasizes AI-assisted development. Always document AI prompts, tool interactions, and decisions made by AI vs. humans.
- **Documentation:** Every homework requires:
  - `README.md`: Project overview and AI tool usage.
  - `HOWTORUN.md`: Clear setup and execution instructions.
  - `docs/screenshots/`: Visual proof of AI interaction and working application.
- **Surgical Updates:** When modifying existing homework code, maintain the existing directory structure (`src/routes`, `src/models`, `src/validators`, etc.).
- **Validation:** Always verify changes using the provided demo scripts or by creating new ones.
- **FinTech Best Practices:** (Especially for HW3 and beyond) Follow industry standards for security, auditability, and data handling (e.g., ISO 4217 for currencies, ISO 8601 for dates).

## 📤 Submission Workflow

1. Create a branch: `homework-X-submission`.
2. Implement tasks.
3. Commit and push to your fork.
4. Create a detailed Pull Request (PR) with screenshots and verification steps.
