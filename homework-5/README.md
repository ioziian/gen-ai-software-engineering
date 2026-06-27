# Homework 5: MCP Server Configuration

**Author:** Ihor Oziian

## Overview

This homework configures four MCP (Model Context Protocol) servers for use with Claude Code:

1. **GitHub MCP** connects Claude to GitHub for repositories, pull requests, issues, commits, and related project workflows.
2. **Filesystem MCP** connects Claude to the local `homework-5/` directory for file reading and directory listing.
3. **Notion MCP** connects Claude to Notion for querying pages and databases shared with the integration.
4. **Custom MCP (lorem-ipsum-server)** provides a FastMCP server that reads words from a local lorem ipsum source file.

## MCP Concepts

**Resources** are URI-addressable data sources that an MCP client can read from, such as files, API-backed content, or generated data.

**Tools** are callable actions that an MCP client can invoke to perform work, such as reading data, listing files, or querying an external service.

## Custom Server

The custom server is implemented in `custom-mcp-server/server.py` and exposes:

- Resource `lorem://words`, returning the first 30 words from `lorem-ipsum.md`
- Resource `lorem://words/{word_count}`, returning the first N words from `lorem-ipsum.md`
- Tool `read(word_count=30)`, returning the first N words from `lorem-ipsum.md`

The server clamps `word_count` to at least 1 and at most the available word count in the source file.

## Project Structure

```text
homework-5/
|-- README.md
|-- HOWTORUN.md
|-- PR_DESCRIPTION.md
|-- .mcp.json
|-- custom-mcp-server/
|   |-- .gitignore
|   |-- lorem-ipsum.md
|   |-- requirements.txt
|   `-- server.py
`-- docs/
    `-- screenshots/
        `-- .gitkeep
```

Expected screenshots after credentialed MCP setup:

- `docs/screenshots/github-mcp-result.png`
- `docs/screenshots/filesystem-mcp-result.png`
- `docs/screenshots/jira-or-notion-mcp-result.png`
- `docs/screenshots/custom-mcp-read-tool-result.png`
