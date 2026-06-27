## Homework 5: Configure MCP Servers (GitHub, Filesystem, Notion, Custom)

### Summary

- GitHub MCP configured with the official local Docker server `ghcr.io/github/github-mcp-server`.
- Filesystem MCP configured with `@modelcontextprotocol/server-filesystem` scoped to `homework-5/`.
- Notion MCP configured with `@notionhq/notion-mcp-server` and `NOTION_TOKEN`.
- Custom MCP implemented with FastMCP and a lorem ipsum resource/tool.

### What Was Built

| Deliverable | Status |
| --- | --- |
| `.mcp.json` with all 4 servers | Done |
| `custom-mcp-server/server.py` FastMCP server | Done |
| `custom-mcp-server/requirements.txt` | Done |
| `custom-mcp-server/lorem-ipsum.md` | Done |
| `README.md` | Done |
| `HOWTORUN.md` | Done |
| `docs/screenshots/` placeholder | Done |

### Custom MCP Interface

- Resource `lorem://words`
- Resource `lorem://words/{word_count}`
- Tool `read(word_count=30)`

### Screenshots

Screenshots should be added under `docs/screenshots/` after credentialed MCP setup:

- `github-mcp-result.png`
- `filesystem-mcp-result.png`
- `jira-or-notion-mcp-result.png`
- `custom-mcp-read-tool-result.png`

### Test Plan

- [ ] `python server.py` starts without import errors.
- [ ] `read(word_count=30)` returns 30 words.
- [ ] `read(word_count=100)` returns 100 words when enough words are available.
- [ ] `lorem://words/50` resource returns 50 words.
- [ ] `.mcp.json` is valid JSON.
- [ ] All 4 servers appear in `claude mcp list`.
- [ ] GitHub interaction succeeds with `GITHUB_TOKEN`.
- [ ] Filesystem interaction succeeds against `homework-5/`.
- [ ] Notion interaction succeeds with `NOTION_TOKEN` and connected workspace content.
