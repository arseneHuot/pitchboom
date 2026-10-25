# Changelog

## 1.0.0 (2026-10-25)

- First version of the public configuration repository for the pitchboom remote MCP server (`https://pitchboom.io/api/mcp`, Streamable HTTP, `Authorization: Bearer` API key).
- `server.json` for the official MCP Registry, name `io.pitchboom/pitchboom`, schema 2025-12-11.
- Claude Code plugin and marketplace (`.claude-plugin/`, `.mcp.json`), Cursor plugin (`.cursor-plugin/`, `mcp.json`) and Gemini CLI extension (`gemini-extension.json`, `GEMINI.md`).
- Agent skill `pitchboom-video-ads`: when to use pitchboom, writing a brief, settings, the quote and approval rule, the tool sequence and the error codes.
- README quickstarts for Claude Code, Claude Desktop and claude.ai, Cursor, VS Code, Gemini CLI and Codex.
- `scripts/sync-from-source.mjs` regenerates the facts, the tool list and the plan names from pitchboom's source code.
