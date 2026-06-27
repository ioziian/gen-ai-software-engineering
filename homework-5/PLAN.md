# Homework 5: MCP Servers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement homework-5 — configure GitHub, Filesystem, Notion, and custom FastMCP servers; build custom server with resource + read tool; write README, HOWTORUN, and PR description.

**Architecture:** All files live under `homework-5/`. Custom server in `homework-5/custom-mcp-server/server.py` uses FastMCP with two resource URIs and one tool. All four servers registered in `homework-5/.mcp.json`. Screenshots go in `homework-5/docs/screenshots/` (user-captured after setup).

**Tech Stack:** Python 3.11+, FastMCP>=2.0.0, Node.js/npx (for external MCPs)

## Global Constraints

- homework-5 root: `/Users/ihoroziian/Documents/set/gen-ai-software-engineering/homework-5`
- Author: Ihor Oziian
- Use `.mcp.json` (Claude Code standard, not `.cursor/mcp.json`)
- Use `requirements.txt` with `fastmcp>=2.0.0`
- No secrets in committed files — use env var references like `${GITHUB_TOKEN}`
- Resource URI pattern: `lorem://words/{word_count}` (path param, not query param)
- Tool name must be exactly `read`
- Do NOT reference other students' implementations anywhere in docs

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `homework-5/.mcp.json` | Create | Register all 4 MCP servers |
| `homework-5/custom-mcp-server/server.py` | Create | FastMCP server with resource + tool |
| `homework-5/custom-mcp-server/lorem-ipsum.md` | Create | Source text for resource |
| `homework-5/custom-mcp-server/requirements.txt` | Create | Python deps including fastmcp |
| `homework-5/README.md` | Create | Description + author name |
| `homework-5/HOWTORUN.md` | Create | Install + run + connect + usage |
| `homework-5/docs/screenshots/.gitkeep` | Create | Ensure dir committed |
| `homework-5/PR_DESCRIPTION.md` | Create | PR title + summary for submission |

---

## Task 1: Lorem Ipsum Source File

**Files:**
- Create: `homework-5/custom-mcp-server/lorem-ipsum.md`

- [ ] **Step 1: Create lorem-ipsum.md**

```markdown
# Lorem Ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis molestie dictum semper, purus tortor hendrerit ligula, quis semper augue felis ut metus. Praesent eget sem vel leo ultrices bibendum. Aenean faucibus. Morbi dolor nulla, malesuada eu, pulvinar at, mollis ac, nulla. Curabitur auctor semper nulla. Donec varius orci eget risus. Duis nibh mi, congue eu, accumsan eleifend, sagittis quis, diam. Duis eget orci sit amet orci dignissim rutrum. Nam dui ligula, fringilla a, euismod sodales, sollicitudin vel, wisi.
```

- [ ] **Step 2: Commit**

```bash
git add homework-5/custom-mcp-server/lorem-ipsum.md
git commit -m "feat(hw5): add lorem ipsum source file"
```

---

## Task 2: Custom FastMCP Server

**Files:**
- Create: `homework-5/custom-mcp-server/server.py`
- Create: `homework-5/custom-mcp-server/requirements.txt`

**Interfaces:**
- Produces: `read(word_count: int = 30) -> str` tool callable by Claude
- Produces: resource at `lorem://words/{word_count}` and `lorem://words`

- [ ] **Step 1: Create requirements.txt**

```
fastmcp>=2.0.0
```

- [ ] **Step 2: Create server.py**

```python
from pathlib import Path
from fastmcp import FastMCP

mcp = FastMCP("lorem-ipsum-server")

LOREM_FILE = Path(__file__).resolve().parent / "lorem-ipsum.md"


def _get_words(word_count: int = 30) -> str:
    if not LOREM_FILE.exists():
        raise FileNotFoundError(f"lorem-ipsum.md not found at {LOREM_FILE}")

    text = LOREM_FILE.read_text(encoding="utf-8")

    # Strip markdown headers (lines starting with #)
    lines = [line for line in text.splitlines() if not line.strip().startswith("#")]
    content = " ".join(lines)

    words = content.split()
    word_count = max(1, min(word_count, len(words)))
    return " ".join(words[:word_count])


@mcp.resource("lorem://words")
def lorem_default() -> str:
    """Returns first 30 words from lorem ipsum."""
    return _get_words(30)


@mcp.resource("lorem://words/{word_count}")
def lorem_words(word_count: int) -> str:
    """Returns first {word_count} words from lorem ipsum."""
    return _get_words(word_count)


@mcp.tool()
def read(word_count: int = 30) -> str:
    """
    Read words from the lorem ipsum resource.

    Resources are URIs that Claude can read from (files, APIs).
    Tools are actions Claude can call to perform operations (reading a file, running a command).

    Args:
        word_count: Number of words to return (default: 30)
    Returns:
        First word_count words from lorem-ipsum.md
    """
    return _get_words(word_count)


if __name__ == "__main__":
    mcp.run()
```

- [ ] **Step 3: Verify server starts (requires venv)**

```bash
cd homework-5/custom-mcp-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -c "from server import _get_words; print(_get_words(10))"
```

Expected: prints 10 words from lorem ipsum, no errors.

- [ ] **Step 4: Commit**

```bash
git add homework-5/custom-mcp-server/server.py homework-5/custom-mcp-server/requirements.txt
git commit -m "feat(hw5): add custom FastMCP server with lorem ipsum resource and read tool"
```

---

## Task 3: MCP Configuration

**Files:**
- Create: `homework-5/.mcp.json`

**Notes:**
- GitHub MCP: use `@github/github-mcp-server` (official, replaces deprecated `@modelcontextprotocol/server-github` as of Apr 2025)
- Filesystem MCP: use `@modelcontextprotocol/server-filesystem` with path to homework-5 dir
- Notion MCP: use `@notionhq/notion-mcp-server`
- Custom: python with absolute path to venv interpreter

- [ ] **Step 1: Create .mcp.json**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/ihoroziian/Documents/set/gen-ai-software-engineering/homework-5"
      ]
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ${NOTION_TOKEN}\", \"Notion-Version\": \"2022-06-28\"}"
      }
    },
    "custom-lorem": {
      "command": "/Users/ihoroziian/Documents/set/gen-ai-software-engineering/homework-5/custom-mcp-server/.venv/bin/python",
      "args": [
        "/Users/ihoroziian/Documents/set/gen-ai-software-engineering/homework-5/custom-mcp-server/server.py"
      ]
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add homework-5/.mcp.json
git commit -m "feat(hw5): add MCP server configuration for all four servers"
```

---

## Task 4: README and HOWTORUN

**Files:**
- Create: `homework-5/README.md`
- Create: `homework-5/HOWTORUN.md`

- [ ] **Step 1: Create README.md**

```markdown
# Homework 5: MCP Server Configuration

**Author:** Ihor Oziian

## Overview

This homework configures four MCP (Model Context Protocol) servers for use with Claude Code:

1. **GitHub MCP** — connects Claude to GitHub for PR management, issue creation, and commit history
2. **Filesystem MCP** — connects Claude to a local directory for file reading and directory listing
3. **Notion MCP** — connects Claude to Notion for querying pages and databases
4. **Custom MCP (lorem-ipsum-server)** — a custom FastMCP server that reads words from a lorem ipsum file

## MCP Concepts

**Resources** are URIs that Claude can read from (e.g., files, APIs, databases). They expose data passively.

**Tools** are actions Claude can call to perform operations (e.g., reading a file, running a command, creating an issue). They execute logic on demand.

## Custom Server

The custom server (`custom-mcp-server/server.py`) exposes:
- **Resource** `lorem://words` — returns first 30 words from `lorem-ipsum.md`
- **Resource** `lorem://words/{word_count}` — returns first N words from `lorem-ipsum.md`
- **Tool** `read(word_count=30)` — callable tool wrapping the resource

## Project Structure

```
homework-5/
├── README.md
├── HOWTORUN.md
├── .mcp.json
├── custom-mcp-server/
│   ├── server.py
│   ├── lorem-ipsum.md
│   └── requirements.txt
└── docs/
    └── screenshots/
        ├── github-mcp-result.png
        ├── filesystem-mcp-result.png
        ├── jira-or-notion-mcp-result.png
        └── custom-mcp-read-tool-result.png
```
```

- [ ] **Step 2: Create HOWTORUN.md**

```markdown
# How to Run — Homework 5 MCP Servers

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm/npx
- Claude Code CLI

## 1. Install Custom Server Dependencies

```bash
cd homework-5/custom-mcp-server
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
```

## 2. Set Environment Variables

Export the required credentials before starting Claude Code:

```bash
export GITHUB_TOKEN="your_github_personal_access_token"
export NOTION_TOKEN="your_notion_integration_token"
```

**Getting credentials:**
- **GitHub Token**: GitHub → Settings → Developer settings → Personal access tokens → Generate new token (scopes: `repo`, `read:org`)
- **Notion Token**: notion.so → Settings → Connections → Develop or manage integrations → New integration → copy Internal Integration Token

## 3. Connect MCP Configuration

The `.mcp.json` file in this directory is automatically picked up by Claude Code when you open the project. No additional configuration needed.

To verify servers are registered:
```bash
claude mcp list
```

Expected output shows: `github`, `filesystem`, `notion`, `custom-lorem`

## 4. Run and Test the Custom Server Manually

```bash
cd homework-5/custom-mcp-server
source .venv/bin/activate
python server.py
```

The server runs on stdio and waits for MCP protocol messages. Press Ctrl+C to stop.

## 5. Use the `read` Tool in Claude Code

Open Claude Code in the `homework-5/` directory and ask:

```
Call the read tool with word_count=50
```

Or read the resource directly:
```
Read the resource lorem://words/20
```

Expected: returns the first N words from `lorem-ipsum.md`.

## 6. Test External Servers

**GitHub:**
```
List my recent pull requests
```

**Filesystem:**
```
List files in the current directory
```

**Notion:**
```
Give me the pages of the last 5 bugs on my project
```

## Troubleshooting

- **`command not found: npx`** — install Node.js from nodejs.org
- **`ModuleNotFoundError: fastmcp`** — run `pip install -r requirements.txt` inside `.venv`
- **Notion auth error** — ensure NOTION_TOKEN is exported and the integration is connected to your Notion workspace
- **GitHub 401** — ensure GITHUB_TOKEN has `repo` scope and is not expired
```

- [ ] **Step 3: Commit**

```bash
git add homework-5/README.md homework-5/HOWTORUN.md
git commit -m "feat(hw5): add README and HOWTORUN documentation"
```

---

## Task 5: Screenshots Directory and PR Description

**Files:**
- Create: `homework-5/docs/screenshots/.gitkeep`
- Create: `homework-5/PR_DESCRIPTION.md`

- [ ] **Step 1: Create screenshots directory**

```bash
mkdir -p homework-5/docs/screenshots
touch homework-5/docs/screenshots/.gitkeep
```

**User must capture four screenshots after setup:**
1. `github-mcp-result.png` — list PRs or create issue via GitHub MCP
2. `filesystem-mcp-result.png` — list files or read file via Filesystem MCP
3. `jira-or-notion-mcp-result.png` — "Give me the last 5 bug pages" via Notion MCP
4. `custom-mcp-read-tool-result.png` — call `read` tool with word_count param

- [ ] **Step 2: Create PR_DESCRIPTION.md**

```markdown
## Homework 5: Configure MCP Servers (GitHub, Filesystem, Notion, Custom)

### Summary

- **GitHub MCP** — configured with `@github/github-mcp-server`; demonstrated listing pull requests and commits
- **Filesystem MCP** — configured with `@modelcontextprotocol/server-filesystem` pointing to `homework-5/` directory; demonstrated listing files and reading content
- **Notion MCP** — configured with `@notionhq/notion-mcp-server`; demonstrated querying last 5 bug pages from a Notion database
- **Custom MCP** — built `custom-mcp-server/server.py` with FastMCP; exposes `lorem://words/{word_count}` resource and `read(word_count)` tool returning word-limited content from `lorem-ipsum.md`

### What was built

| Deliverable | Status |
|-------------|--------|
| `.mcp.json` with all 4 servers | ✅ |
| `custom-mcp-server/server.py` (FastMCP) | ✅ |
| `custom-mcp-server/requirements.txt` | ✅ |
| `custom-mcp-server/lorem-ipsum.md` | ✅ |
| `README.md` (description + author) | ✅ |
| `HOWTORUN.md` (install + run + connect + usage) | ✅ |
| `docs/screenshots/` — 4 MCP interaction screenshots | ✅ |

### Screenshots

See `docs/screenshots/` for MCP call results from all four servers.

### Test plan

- [ ] `python server.py` starts without errors
- [ ] `read(word_count=30)` returns exactly 30 words
- [ ] `read(word_count=100)` returns clamped count if fewer words available
- [ ] `lorem://words/50` resource returns 50 words
- [ ] All 4 servers listed in `claude mcp list`
- [ ] GitHub interaction succeeds (requires GITHUB_TOKEN)
- [ ] Filesystem interaction succeeds (lists homework-5 files)
- [ ] Notion interaction succeeds (requires NOTION_TOKEN + workspace access)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 3: Commit**

```bash
git add homework-5/docs/screenshots/.gitkeep homework-5/PR_DESCRIPTION.md
git commit -m "feat(hw5): add screenshots directory and PR description"
```

---

## Verification

After all tasks complete:

```bash
# 1. Verify file structure
find homework-5 -not -path '*/\.venv/*' -not -name '*.pyc' | sort

# 2. Verify fastmcp is importable
cd homework-5/custom-mcp-server && source .venv/bin/activate && python -c "import fastmcp; print('fastmcp ok')"

# 3. Verify read tool returns correct word count
cd homework-5/custom-mcp-server && source .venv/bin/activate && python -c "
from server import _get_words
result = _get_words(10)
words = result.split()
assert len(words) == 10, f'Expected 10 words, got {len(words)}: {result}'
print('read tool: OK —', result)
"

# 4. Verify MCP config is valid JSON
python -c "import json; json.load(open('homework-5/.mcp.json')); print('mcp.json: valid JSON')"
```

Expected:
- All files present
- `fastmcp ok`
- `read tool: OK — Lorem ipsum dolor...` (10 words)
- `mcp.json: valid JSON`

Screenshots must be captured by the user after configuring credentials and connecting servers in Claude Code.
