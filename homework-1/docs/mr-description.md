# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Ihor Oziian
> **Date Submitted**: 01.05.2026
> **AI Tools Used**: GitHub Copilot (GPT-4.1), Gemini CLI (gemini-3-flash-preview), Codex (Default mode)

---

## Overview
This MR completes the Banking Transactions API (Homework 1) by introducing full cross-platform support (Windows `.bat` scripts) and a professional technical documentation suite. It covers all core requirements, advanced validation, and additional summary features, fully documented through an AI-assisted development workflow.

---

## ✅ Summary

A robust REST API for banking transactions built with Node.js and Express.js, featuring in-memory storage and comprehensive validation. All required tasks and the **Account Summary (Task 4A)** additional feature are implemented.

### Endpoints Delivered:
- **`POST /transactions`** — Create a transaction with full validation (Task 1 + Task 2).
- **`GET /transactions`** — List all transactions with advanced filtering (Task 1 + Task 3).
- **`GET /transactions/{id}`** — Retrieve a single transaction by ID (Task 1).
- **`GET /accounts/{id}/balance`** — Real-time balance for an account (Task 1).
- **`GET /accounts/{id}/summary`** — Multi-metric summary: total deposits, withdrawals, and most recent activity (Task 4A).

### Validation Rules Enforced (Task 2):
- **`amount`**: Must be a positive number with a maximum of 2 decimal places.
- **`account`**: Strict regex validation (`^ACC-[A-Za-z0-9]{5}$`) for `fromAccount` and `toAccount`.
- **`currency`**: ISO 4217 allowlist (USD, EUR, GBP, JPY).
- **Aggregated Errors**: Returns all validation failures in a single `details[]` array (no early exit).

### Filtering Capabilities (Task 3):
- **`?accountId`**: Matches any transaction involving the specified account.
- **`?type`**: Filter by `deposit`, `withdrawal`, or `transfer`.
- **`?from` & `?to`**: Date range filtering (inclusive) supporting standard date formats.

---

## 🏗 Architecture

The project follows a modular router-based structure to ensure scalability and maintainability.

```text
homework-1/
├── src/
│   ├── index.js              # Express app entry point & route registration
│   ├── models/
│   │   ├── storage.js        # In-memory data structures (transactions, accounts)
│   │   └── transaction.js    # Transaction object factory & ID generation
│   ├── routes/
│   │   ├── transactions.js   # POST/GET logic with filtering
│   │   ├── accounts.js       # Balance retrieval
│   │   └── accountSummary.js # Aggregated statistics (Task 4A)
│   └── validators/
│       └── transactionValidator.js # Regex & ISO validation logic
├── demo/                     # Multi-OS scripts and sample data
└── docs/                     # Interaction logs and screenshots
```

---

## 🛠 AI Tools & Workflow

### Tools Used:
- **Primary Agent**: Gemini CLI (model: `gemini-3-flash`) — Used for planning, architectural mapping, and implementation.
- **Custom Skills**:
  - `ai-workflow-chronicler`: Automated logging of every prompt and architectural decision.
  - `fintech-guardrail`: Enforced ISO 4217 and ISO 8601 standards during validation design.
  - `web-backend-expert`: Guided the modular route structure and Express error-handling patterns.

### Workflow Phases:
1.  **Planning Phase**: The agent analyzed `TASKS.md` and proposed a step-by-step implementation plan, which was saved and followed to ensure 100% requirement coverage.
2.  **Implementation Loop**: Features were developed iteratively. For each task, the agent proposed code, verified it against existing logic, and updated the `storage` model.
3.  **Cross-Platform Parity**: Specialized tasks were run to mirror Unix `.sh` scripts into Windows `.bat` files, ensuring a seamless experience for all developers.
4.  **Verification**: Used a dedicated `verification-checklist.md` to manually confirm every edge case (e.g., negative amounts, invalid ISO codes).

---

## ⚠️ Challenges Encountered

### 1. Cross-Platform Scripting Compatibility
Ensuring that `run.bat` and `sample-requests.bat` behaved exactly like their Unix counterparts required careful handling of Windows-specific `npm` execution and shell pathing. 
*Solution*: Standardized on `npm start` as the common entry point and used explicit pathing in batch files.

### 2. Validation Error Aggregation
Initial implementations often fail at the first validation error. To meet the professional requirement for "meaningful error messages," the validator was refactored to collect all errors into an array before responding with a 400 status.
*Solution*: Built a `validateTransaction` wrapper that pushes errors from individual field checks into a central `errors` list.

### 3. Date Range Edge Cases
Filtering transactions by date required coercing strings into `Date` objects and ensuring inclusive comparisons.
*Solution*: Implemented robust date parsing in the `GET /transactions` route that handles various date strings consistently.

---

## 📸 Screenshots

Below are the key artifacts demonstrating the development process and the working API.

**AI Workflow & Strategic Planning:**
![AI Planning and Implementation](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/01-ai-planning-implementation.png)
*Initial planning and core API implementation in VS Code, showing the AI-generated plan and successful transaction creation.*

![AI Metrics and Usage](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/02-ai-metrics-usage.png)
*Gemini CLI performance metrics and model usage summary after a successful development cycle.*

**Skill Development & Guardrails:**
![AI Skill Recommendation](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/03-ai-skill-recommendation.png)
*AI assistant recommending project-specific skills (FinTech Guardrail, Workflow Chronicler) for compliance.*

![Skill Installation](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/04-skill-installation.png)
*Installation and activation of custom AI skills within the Gemini CLI environment.*

![Active Skills Review](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/05-active-skills-review.png)
*Reviewing the list of active AI skills, including custom workspace skills.*

![Web Backend Expert Skill](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/06-web-backend-expert-skill.png)
*Creation of the web-backend-expert skill for architectural and error-handling guidance.*

**Project Finalization:**
![Gemini CLI Initialization](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/07-gemini-cli-init.png)
*Gemini CLI session initialization and start of the requirement analysis task.*

![Documentation Finalization](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/08-documentation-finalization.png)
*Finalizing project documentation and creating the manual verification checklist.*

![Gap Analysis with External AI](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/09-gap-analysis-external-ai.png)
*Using an external AI assistant (ChatGPT/Claude) for final gap analysis and remaining task planning.*

**Cross-Platform Scripting & Final Results:**
![Result of Work](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/10-result-of-work.png)
*Terminal output demonstrating the successful execution of cross-platform demo scripts.*

**Rendered MR Description Output:**
![Final MR Description Rendering](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-1-submission/homework-1/docs/screenshots/11-mr-description-rendering.png)
*The final rendered version of this MR description.*

---

## 🔗 References
- [HOWTORUN.md](../HOWTORUN.md)
- [README.md](../README.md)
- [AI Interaction Log](ai-interaction-log.md)

---

**This MR ensures the Banking Transactions API is cross-platform, technically sound, and documented to an industry-standard level using modern AI workflows.**
