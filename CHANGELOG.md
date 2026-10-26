# Changelog

## 1.2.0 (2026-10-26)

- The Cinema quality and the Cinema plan are on sale: `create_project` takes `quality: "cinema"` (a directed film, one per project, code included) on the Pro, Premium and Cinema plans; it pauses at a concept board that the new `get_production` tool shows, then `approve_storyboard` once the user agrees.
- New prices (pricing version 2026-10-27): Standard 35, Studio 110, Cinema 600 credits per second, Standard and Studio billed on at least 25 s; 875 free credits at signup; Cinema plan €999 a month with 133,200 credits (25% off every credit).
- The MCP server is part of the Pro, Premium and Cinema plans (`server.json`, Cursor and Gemini CLI settings).
- Plugin manifests move to 1.2.0 so clients pick up the updated agent skill.

## 1.1.0 (2026-10-25)

- OAuth 2.1 sign-in: clients that support it (claude.ai and Claude Desktop custom connectors, ChatGPT, Claude Code, the MCP Inspector) need only `https://pitchboom.io/api/mcp`; the user approves the app on pitchboom and picks its permissions. Protected resource metadata at `https://pitchboom.io/.well-known/oauth-protected-resource/api/mcp`.
- `server.json` 1.1.0: the `Authorization` header is optional (leave it empty to sign in with OAuth).
- Personal API keys keep working unchanged.

## 1.0.0 (2026-10-25)

- First version of the public configuration repository for the pitchboom remote MCP server (`https://pitchboom.io/api/mcp`, Streamable HTTP, `Authorization: Bearer` API key).
- `server.json` for the official MCP Registry, name `io.pitchboom/pitchboom`, schema 2025-12-11.
- Claude Code plugin and marketplace (`.claude-plugin/`, `.mcp.json`), Cursor plugin (`.cursor-plugin/`, `mcp.json`) and Gemini CLI extension (`gemini-extension.json`, `GEMINI.md`).
- Agent skill `pitchboom-video-ads`: when to use pitchboom, writing a brief, settings, the quote and approval rule, the tool sequence and the error codes.
- README quickstarts for Claude Code, Claude Desktop and claude.ai, Cursor, VS Code, Gemini CLI and Codex.
- `scripts/sync-from-source.mjs` regenerates the facts, the tool list and the plan names from pitchboom's source code.
