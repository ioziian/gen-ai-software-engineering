---
name: ai-workflow-chronicler
description: Document AI assistant prompts, responses, and architectural decisions for course grading. Use this when performing tasks in the AI-Assisted Development course to ensure compliance with the "AI Usage Documentation" criteria.
---

# AI Workflow Chronicler

## Overview

This skill ensures that all AI-assisted development activities are meticulously documented to satisfy grading requirements (25% of total score). It automates the logging of prompts, tool usage, and critical design decisions.

## Workflow

### 1. Pre-Task Logging
Before starting a significant implementation task, create a new entry in the AI interaction log.
- **Goal:** Capture the initial intent and prompt.
- **Action:** Append to `docs/ai-interaction-log.md` within the current homework directory.

### 2. Decision Tracking
When a critical architectural choice is made by the AI (e.g., choosing a specific library, structuring data models), document the "Why."
- **Note:** Include the AI's rationale and your validation.

### 3. Post-Task Summary
After completing a task, summarize the AI's contribution for the Pull Request and README.
- **Fields:** Prompts used, challenges encountered, AI suggestions accepted/rejected.

## Guidelines

- **Maintain Chronology:** Always append to the end of the log.
- **Verbatim Prompts:** Use blockquotes for the exact text used in prompts.
- **Homework Scoping:** Ensure logs are placed in the correct `homework-X/docs/` folder.

## Resources

### scripts/
- `log_interaction.cjs`: Appends a structured log entry to the project's AI interaction log.

### references/
- `log-template.md`: Examples of high-quality log entries that meet grading standards.
