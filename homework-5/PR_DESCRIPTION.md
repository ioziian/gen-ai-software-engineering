# Homework 5: Configure MCP Servers (GitHub, Filesystem, Notion, Custom)

**Student Name**: Ihor Oziian
**Date Submitted**: 27.06.2026
**AI Tools Used**: Claude Code (Sonnet 4.6)

---

## Summary

This homework configures three external MCP servers and builds one custom FastMCP server,
all registered in a project-scoped `.mcp.json` and wired into Claude Code.

| # | Server | Type | Auth | Verified interaction |
|---|--------|------|------|----------------------|
| 1 | GitHub | remote HTTP (github-mcp-server) | PAT (`${GITHUB_TOKEN}`) | Listed 5 most recent commits of this repo |
| 2 | Filesystem | local stdio (`npx @modelcontextprotocol/server-filesystem`) | none | Listed files in `homework-5/` and read `lorem-ipsum.md` |
| 3 | Notion | remote OAuth (claude.ai connector) | OAuth | Created a Notion page documenting the homework repo |
| 4 | lorem-ipsum | local stdio (custom FastMCP) | none | `read` tool + `lorem://words/{word_count}` resource |

---

## Custom Server (`custom-mcp-server/`)

**Resource** `lorem://words` — reads `lorem-ipsum.md`, returns first 30 words (default).

**Resource** `lorem://words/{word_count}` — returns exactly `word_count` words from `lorem-ipsum.md`.

**Tool** `read(word_count: int = 30)` — same word-limited content as a callable action.

**Resources vs Tools**: resources are URIs Claude can read from (side-effect-free data sources);
tools are actions Claude can call to perform operations. Both expose the same logic here.

Verified over the real MCP protocol: `read(word_count=50)` → 50 lorem ipsum words.
`fastmcp>=2.0.0` is declared in `requirements.txt`; the server starts with `python server.py`.

---

## Deliverables

| File | Status |
|------|--------|
| `.mcp.json` — all four servers | ✅ |
| `custom-mcp-server/server.py` (FastMCP) | ✅ |
| `custom-mcp-server/lorem-ipsum.md` | ✅ |
| `custom-mcp-server/requirements.txt` | ✅ |
| `README.md` — description, author, Resources-vs-Tools explanation | ✅ |
| `HOWTORUN.md` — install / run / connect / test, with exact prompt per server | ✅ |
| `docs/screenshots/` — MCP call results for all four servers | ✅ |

---

## AI Tools Used

- **Claude Code (Sonnet 4.6)** — scaffolding, custom server implementation, `.mcp.json`, documentation, and in-session MCP protocol testing.
- **FastMCP ≥ 2.0.0** — framework for the custom lorem ipsum server.
- **Official MCP servers** — GitHub (`@github/github-mcp-server`), Filesystem (`@modelcontextprotocol/server-filesystem`), Notion (`@notionhq/notion-mcp-server`).

---

## Challenges

**Notion OAuth flow.** The Notion MCP server registered in `.mcp.json` via `OPENAPI_MCP_HEADERS`
initially showed `notion · △ needs authentication`. Resolved by completing the OAuth handshake
through Claude Code's `/mcp` panel — the browser redirected to the Notion consent screen
(`localhost:3118/callback`), granting access to the workspace. After authentication, Notion
became available as a Local MCP with 18 tools.

**MCP config scope.** `github` and `notion` were connected via the claude.ai OAuth connector
(Local MCP scope), while `filesystem` and `custom-lorem` live in the project-scoped `.mcp.json`.
All four appear together in `/mcp` and are functional.

**Notion test data.** Rather than querying existing pages, used Notion MCP to create a new page
(`notion-create-pages`) documenting the homework repo — a more meaningful demonstration of
write-capable MCP tool use.

---

## Security

No secrets committed — `.mcp.json` references `${GITHUB_TOKEN}`; the Notion OAuth token is
stored by Claude Code locally and not in the repo. Screenshots show only public data (commit
hashes, file names, lorem ipsum text).

---

## Screenshots

### All MCP Servers Connected

![All MCP servers connected](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/all-mcp-servers-connected.png)
*`/mcp` panel: `custom-lorem` (1 tool) and `filesystem` (14 tools) as Project MCPs; `github` (44 tools) and `notion` (18 tools) as Local MCPs — all connected.*

---

### 1. GitHub MCP — Recent Commits

![GitHub MCP result](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/github-mcp-list-commits.png)
*Listed 5 most recent commits in `gen-ai-software-engineering` via the GitHub MCP server.*

---

### 2. Filesystem MCP — List + Read

![Filesystem MCP result](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/filesystem-mcp-list-files.png)
*Listed all files in `homework-5/` and read `custom-mcp-server/lorem-ipsum.md` via the Filesystem MCP server.*

---

### 3. Notion MCP — OAuth Connect & Page Creation

![Notion OAuth connect](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/notion-mcp-oauth-connect.png)
*Notion OAuth consent screen — granting `localhost` (Claude Code) access to the workspace.*

![Notion auth success](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/notion-mcp-auth-success.png)
*Authentication successful — Notion connected to Claude Code.*

![Notion MCP create page tool call](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/notion-mcp-create-page-tool-call.png)
*Claude calling `notion-create-pages` tool to create a homework summary page.*

![Notion page created in browser](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/notion-mcp-created-page-in-notion.png)
*The created Notion page "Homework 5: MCP Servers — gen-ai-software-engineering" visible in the Notion UI.*

---

### 4. Custom FastMCP — `read` Tool

![Custom MCP read tool result](https://raw.githubusercontent.com/ioziian/gen-ai-software-engineering/homework-5-submission/homework-5/docs/screenshots/custom-mcp-read-tool-result.png)
*`read(word_count=50)` called via the `custom-lorem` MCP server — returns 50 lorem ipsum words.*
