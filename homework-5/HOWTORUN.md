# How to Run - Homework 5 MCP Servers

## Prerequisites

- Python 3.11+
- Node.js 18+ with `npx`
- Docker, for the GitHub MCP local server
- Claude Code CLI
- GitHub personal access token exported as `GITHUB_TOKEN`
- Notion integration token exported as `NOTION_TOKEN`

## 1. Install Custom Server Dependencies

```bash
cd homework-5/custom-mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Set Environment Variables

Export the required credentials before starting Claude Code:

```bash
export GITHUB_TOKEN="your_github_personal_access_token"
export NOTION_TOKEN="your_notion_integration_token"
```

Credential setup:

- GitHub token: create a personal access token with access needed for the repository operations you plan to test.
- Notion token: create an internal Notion integration and connect the target pages or databases to that integration.

Do not commit real token values. The committed `.mcp.json` uses environment variable references only.

## 3. Connect MCP Configuration

Open Claude Code from the homework directory or repository root where `homework-5/.mcp.json` is available:

```bash
cd homework-5
claude
```

To inspect registered servers:

```bash
claude mcp list
```

Expected server names:

- `github`
- `filesystem`
- `notion`
- `custom-lorem`

## 4. Test the Custom Server Manually

```bash
cd homework-5/custom-mcp-server
source .venv/bin/activate
python -c "from server import _get_words; print(_get_words(10))"
```

Expected output starts with:

```text
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
```

To run the server over stdio:

```bash
python server.py
```

The server waits for MCP protocol messages. Press `Ctrl+C` to stop it.

## 5. Use the Custom MCP Tool in Claude Code

Ask Claude Code:

```text
Call the read tool with word_count=50
```

Or read the resource:

```text
Read the resource lorem://words/20
```

Expected result: Claude returns the first requested words from `custom-mcp-server/lorem-ipsum.md`.

## 6. Test External Servers

GitHub:

```text
List my recent pull requests.
```

Filesystem:

```text
List files in the homework-5 directory.
```

Notion:

```text
Give me the last 5 bug pages from my Notion project.
```

## 7. Capture Screenshots

After the four MCP interactions work, save screenshots under `docs/screenshots/`:

- `github-mcp-result.png`
- `filesystem-mcp-result.png`
- `jira-or-notion-mcp-result.png`
- `custom-mcp-read-tool-result.png`

## Troubleshooting

- `command not found: npx`: install Node.js and ensure `npx` is on `PATH`.
- `Cannot connect to Docker daemon`: start Docker Desktop or the Docker daemon.
- `ModuleNotFoundError: fastmcp`: activate `.venv` and run `pip install -r requirements.txt`.
- GitHub 401 or authentication error: verify `GITHUB_TOKEN` is exported and has the required permissions.
- Notion authorization error: verify `NOTION_TOKEN` is exported and the integration has access to the target pages or databases.
