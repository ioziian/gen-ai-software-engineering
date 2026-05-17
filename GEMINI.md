# Project Overview

This is the central repository for the "GenAI and Agentic AI for Software Engineering" training course. It contains multiple subdirectories, each corresponding to different homework assignments (homework-1 through homework-6), focused on practical application of AI-assisted software development using the Context-Model-Prompt framework.

## Project Structure

```text
gen-ai-software-engineering/
├── homework-1/           # Homework 1: Simple API with AI Assistance
├── homework-2/           # Homework 2: Enhanced App with Tests
├── homework-3/           # Homework 3: App from Specification
├── homework-4/           # Homework 4: Multi-Agent System
├── homework-5/           # Homework 5: MCP Server Configuration
├── homework-6/           # Homework 6: Capstone Project
├── .gemini/              # Project-specific AI agent context/skills
├── docs/                 # Shared documentation
└── src/                  # Potentially shared source code
```

## Building and Running

Because this is a multi-project repository, build and run instructions depend on the specific assignment directory you are working on. Generally:

1. Navigate to the homework directory: `cd homework-X`
2. Install dependencies: `npm install` (if it's a Node.js project)
3. Run the application: Consult the `HOWTORUN.md` file in the specific homework directory.

## Development Conventions

- **AI-Assisted Development:** All tasks should leverage AI tools (e.g., Gemini CLI).
- **Subagent-Driven Development:** Complex tasks should be decomposed and delegated to specialized subagents.
- **Documentation:** Every submission must include a detailed Pull Request description, `README.md`, `HOWTORUN.md`, and visual evidence (screenshots) in `docs/screenshots/`.
- **TDD:** Prioritize Test-Driven Development for feature implementation and bug fixes.
- **Code Style:** Follow modular patterns (Routes → Services → Repositories), and do not use default exports.
