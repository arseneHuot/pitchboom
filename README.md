# pitchboom MCP server: make video ads from your AI assistant

<!-- BEGIN GENERATED intro (scripts/sync-from-source.mjs): do not edit by hand -->
**pitchboom.io is an AI motion-design studio for video ads.** From a product URL or a short brief, it writes the script, builds an editable storyboard, adds a voice-over and music, and renders MP4 videos (1080p; 4K on Pro and Premium) in 16:9, 9:16, 1:1, 4:5 and 3:4. This repository connects AI assistants (Claude Code, Claude Desktop and claude.ai, Cursor, VS Code, Gemini CLI, Codex) to pitchboom's remote MCP server, so an agent can prepare, price, launch, edit and download videos on your pitchboom account. Paid steps return a quote first, and credits are spent only after you approve it.
<!-- END GENERATED intro -->

<!-- BEGIN GENERATED facts (scripts/sync-from-source.mjs): do not edit by hand -->
**Free to start:** Every new account gets 500 free credits at signup, no card required (about one 30-second Standard video), then plans from €30 a month (excl. VAT) with monthly credits. The MCP server is part of the Pro and Premium plans; free accounts make Standard videos in the web app.

| Plan | Price per month (excl. VAT) | Credits | MCP server | 4K export | Longest video | Videos per batch |
| :- | :- | :- | :- | :- | :- | :- |
| Free account | €0 | 500 once, at signup | No (web app only) | No | 30 s | 1 |
| Starter | €30 | 3,000 per month | No | No | 60 s | 3 |
| Pro | €99 | 11,000 per month | **Yes** | +4 credits per second | 90 s | 10 |
| Premium | €300 | 37,500 per month | **Yes** | Included | 120 s | 25 |

**What a video costs** (storyboard, voice-over, music and 1080p render included): Standard 13, Studio 100 credits per second; with your code: Standard +10, Studio +20 credits per second. Videos shorter than 15 s are billed as 15 s. Studio videos are billed on at least 20 s; with screens rebuilt from your code, the code surcharge is billed on at least 30 s. Example: a 15-second Standard video is 195 credits (about €1.95 at the Starter rate, €1.56 on Premium). 1 credit = €0.01 at the Starter rate (10% off every credit on Pro and 20% off every credit on Premium).

**How credits are charged:** Every paid action shows an estimate first. When you confirm, the estimate is held from your balance; each finished step consumes its share, and whatever isn't used is released when the job ends. If a render fails on our side, the credits it consumed are refunded automatically.

Prices as of pricing version 2026-10-24. The live figures are on https://pitchboom.io/pricing and https://pitchboom.io/llms.txt.
<!-- END GENERATED facts -->

Full documentation: https://pitchboom.io/docs/mcp

## Contents

- [Before you start](#before-you-start)
- [Quickstart](#quickstart): [Claude Code](#claude-code), [Claude Desktop and claude.ai](#claude-desktop-and-claudeai), [Cursor](#cursor), [VS Code](#vs-code), [Gemini CLI](#gemini-cli), [Codex](#codex), [other clients](#other-mcp-clients)
- [The money rule](#the-money-rule)
- [Typical flow](#typical-flow)
- [Tools](#tools)
- [Errors](#errors)
- [Security and privacy](#security-and-privacy)
- [What is in this repository](#what-is-in-this-repository)
- [En français](#en-français)

## Before you start

1. **A pitchboom account on a plan with the MCP server** (see the table above).
2. **The server:** `https://pitchboom.io/api/mcp`, Streamable HTTP transport. Two ways to sign in:
   - **OAuth 2.1** (claude.ai and Claude Desktop custom connectors, ChatGPT, Claude Code, the MCP Inspector and other clients that support it): add only the URL. The client opens pitchboom, you sign in, approve the app and choose its permissions. Connected apps are listed, and disconnected, at https://pitchboom.io/settings/api.
   - **Personal API key** for every other client: create it at https://pitchboom.io/settings/api and send `Authorization: Bearer <your key>`. Keys start with `pb_live_`; you choose the key's permissions when you create it and can revoke it there at any time. The server refuses a key passed in the URL.
3. **Keep a key out of your files.** Most key setups below read it from an environment variable:

   ```bash
   export PITCHBOOM_API_KEY=pb_live_YOUR_KEY   # for example in ~/.zshrc; never commit it
   ```

Permission presets offered when you create a key or approve an app:

<!-- BEGIN GENERATED presets (scripts/sync-from-source.mjs): do not edit by hand -->
| Preset | Permissions | What it allows |
| :- | :- | :- |
| Full access | Read, Prepare & edit, Spend credits | Read, prepare and edit, and spend credits after you confirm a quote. |
| No spending | Read, Prepare & edit | Prepare quotes, edit storyboards and drafts; confirming paid work stays in the app. |
| Read only | Read | List and inspect projects, videos, jobs and credits. Nothing changes. |
<!-- END GENERATED presets -->

## Quickstart

### Claude Code

Install this repository as a plugin. It adds the MCP server and a skill that tells Claude how to write a brief, show the quote and wait for your approval:

```text
/plugin marketplace add arseneHuot/pitchboom
/plugin install pitchboom@pitchboom
```

The plugin reads `PITCHBOOM_API_KEY` from the environment Claude Code was started in. Run `/mcp` to check the connection.

To add only the server, without the skill, and sign in with OAuth (run `/mcp`, pick pitchboom, then **Authenticate**):

```bash
claude mcp add --transport http pitchboom https://pitchboom.io/api/mcp
```

Or with a key: add `--header "Authorization: Bearer pb_live_YOUR_KEY"`.

Add `--scope user` to use it in every project. Docs: [MCP in Claude Code](https://code.claude.com/docs/en/mcp), [plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces).

### Claude Desktop and claude.ai

- **Claude Desktop, Code tab:** paste this into a chat in the Code tab (Claude runs it for you), or run it in a terminal, then start a new chat:

  ```text
  claude mcp add --transport http --scope user pitchboom https://pitchboom.io/api/mcp --header "Authorization: Bearer pb_live_YOUR_KEY"
  ```

- **Custom connector (claude.ai, Claude Desktop and mobile chats):** in **Customize > Connectors**, choose **Add custom connector**, enter `https://pitchboom.io/api/mcp` (leave the OAuth client ID and secret empty), then **Connect**: pitchboom opens, you sign in and choose the permissions, and you're back in Claude. On Team and Enterprise plans, each member connects their own pitchboom account.
- **Claude Desktop chats through a local bridge** (needs Node.js): add this to `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`) and restart Claude Desktop.

  ```json
  {
    "mcpServers": {
      "pitchboom": {
        "command": "npx",
        "args": ["-y", "mcp-remote@latest", "https://pitchboom.io/api/mcp", "--header", "Authorization:${AUTH_HEADER}"],
        "env": { "AUTH_HEADER": "Bearer pb_live_YOUR_KEY" }
      }
    }
  }
  ```

  The header has no space after the colon because some clients split arguments on spaces ([mcp-remote README](https://github.com/geelen/mcp-remote#custom-headers)).

### Cursor

Add this to `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one project). Cursor reads `${env:PITCHBOOM_API_KEY}` from your environment ([Cursor MCP docs](https://cursor.com/docs/mcp)):

```json
{
  "mcpServers": {
    "pitchboom": {
      "url": "https://pitchboom.io/api/mcp",
      "headers": { "Authorization": "Bearer ${env:PITCHBOOM_API_KEY}" }
    }
  }
}
```

This repository is also a Cursor plugin (`.cursor-plugin/plugin.json`, `mcp.json` and the skill). When you install it as a plugin, set the key in the `PITCHBOOM_API_KEY` plugin variable under **Dashboard > Plugins > Configure** ([Cursor plugin variables](https://cursor.com/docs/reference/plugins#variables)).

### VS Code

Add this to `.vscode/mcp.json`. VS Code asks for the key once and stores it securely ([VS Code MCP configuration](https://code.visualstudio.com/docs/copilot/reference/mcp-configuration)):

```json
{
  "inputs": [
    { "type": "promptString", "id": "pitchboom-key", "description": "pitchboom API key", "password": true }
  ],
  "servers": {
    "pitchboom": {
      "type": "http",
      "url": "https://pitchboom.io/api/mcp",
      "headers": { "Authorization": "Bearer ${input:pitchboom-key}" }
    }
  }
}
```

### Gemini CLI

Install this repository as an extension. It asks for your API key during installation and keeps it in the system keychain; it also adds the skill:

```bash
gemini extensions install https://github.com/arseneHuot/pitchboom
```

To add only the server (`--scope user` for every project):

```bash
gemini mcp add --transport http --header "Authorization: Bearer pb_live_YOUR_KEY" pitchboom https://pitchboom.io/api/mcp
```

Docs: [Gemini CLI extensions](https://geminicli.com/docs/extensions/reference/), [MCP servers in Gemini CLI](https://geminicli.com/docs/tools/mcp-server/).

### Codex

```bash
export PITCHBOOM_API_KEY=pb_live_YOUR_KEY
codex mcp add pitchboom --url https://pitchboom.io/api/mcp --bearer-token-env-var PITCHBOOM_API_KEY
```

`--bearer-token-env-var` takes the variable's name, not the key. The same setting in `~/.codex/config.toml`, shared by the Codex CLI, the IDE extension and the ChatGPT desktop app ([Codex MCP docs](https://developers.openai.com/codex/mcp)):

```toml
[mcp_servers.pitchboom]
url = "https://pitchboom.io/api/mcp"
bearer_token_env_var = "PITCHBOOM_API_KEY"
```

### Other MCP clients

Any client that supports Streamable HTTP and custom headers works:

```text
URL:        https://pitchboom.io/api/mcp
Transport:  Streamable HTTP
Header:     Authorization: Bearer pb_live_YOUR_KEY
```

A client that only runs local servers can use the bridge `npx -y mcp-remote@latest https://pitchboom.io/api/mcp --header "Authorization: Bearer <key>"`. Clients that support OAuth need only the URL. To inspect the server, use the MCP Inspector: `npx @modelcontextprotocol/inspector` (Streamable HTTP, URL only: it signs in with OAuth).

## The money rule

Nothing is charged without an explicit confirmation.

1. `create_project`, `get_estimate`, `request_variant` and paid edits only return a **quote**: `quote_id`, credits per video and in total, balance after. Nothing is charged.
2. Your assistant shows you the quote, and you approve that exact amount (or not).
3. Only then does it call `confirm_operation(quote_id)`, which holds the credits and starts the work. A video that waits for storyboard approval resumes with `approve_storyboard(max_total)` within the total you accepted; if the price grew, nothing happens and you get the new total.

Quotes expire after 30 minutes. `confirm_operation` and `approve_storyboard` are the only tools that spend credits; both are marked destructive and tell Claude Code to ask you before every call. With a **No spending** key, the assistant prepares quotes and edits storyboards, and you confirm paid work in the web app.

## Typical flow

```text
get_credit_balance
→ get_options, list_brand_kits             accepted values, Brand Kits
→ create_project                           a quote; the free website analysis starts
→ you approve the quote → confirm_operation
→ get_job_status(wait_seconds=50)          until the storyboard waits for approval
→ get_storyboard → update_storyboard       free edits
→ you approve → approve_storyboard(max_total)
→ get_job_status                           until succeeded
→ get_video                                download links valid 1 hour
```

After rendering: `edit_video` for changes, `request_variant` for translations, other formats, new takes or 4K.

Prompts to try:

- "Make a 15-second 9:16 TikTok ad for https://example.com with the goal sign-ups. Show me the quote before anything is charged."
- "Translate my last pitchboom video into French and German. Quote it first."
- "How many pitchboom credits do I have left?"

## Tools

<!-- BEGIN GENERATED tools (scripts/sync-from-source.mjs): do not edit by hand -->
The server lists 18 tools to every key:

| Tool | What it does | Key permission | Spends credits |
| :- | :- | :- | :- |
| `get_credit_balance` | Credits & plan | Read | No |
| `get_options` | Allowed settings and prices | Read | No |
| `list_brand_kits` | Brand Kits | Read | No |
| `list_projects` | Projects | Read | No |
| `get_project` | Project details | Read | No |
| `analyze_url` | Read a website | Prepare & edit | No |
| `create_project` | Prepare videos (quote) | Prepare & edit | No |
| `get_estimate` | Quote (refresh or read) | Read | No |
| `confirm_operation` | Confirm and spend credits | Spend credits | **Yes**, only after you approve the quote; Claude Code asks you before each call |
| `get_job_status` | Job progress | Read | No |
| `cancel_job` | Cancel a job | Prepare & edit | No (stops or deletes) |
| `get_storyboard` | Storyboard | Read | No |
| `update_storyboard` | Edit a storyboard (free) | Prepare & edit | No |
| `approve_storyboard` | Approve a storyboard | Spend credits | **Yes**, only after you approve the quote; Claude Code asks you before each call |
| `list_videos` | Videos | Read | No |
| `get_video` | Video details & downloads | Read | No |
| `request_variant` | Prepare a variant (quote) | Prepare & edit | No |
| `edit_video` | Edit a rendered video | Prepare & edit | No |

When source-code input is enabled on your account, 5 more tools let an agent with a shell (Claude Code, Codex, Gemini CLI) send your product's code so videos rebuild your real screens. They ask you first: your code leaves your machine.

| Tool | What it does | Key permission | Spends credits |
| :- | :- | :- | :- |
| `prepare_code_upload` | Send your source code (step 1 of 2) | Prepare & edit | No; Claude Code asks you before each call |
| `complete_code_upload` | Analyse the uploaded code | Prepare & edit | No |
| `import_code_from_github` | Read a GitHub repository | Prepare & edit | No; Claude Code asks you before each call |
| `get_code_source` | Code analysis | Read | No |
| `delete_code_source` | Delete uploaded code now | Prepare & edit | No (stops or deletes) |
<!-- END GENERATED tools -->

Every tool's full description and input schema come from the server (`tools/list`), and at https://pitchboom.io/docs/mcp.

## Errors

Tool errors start with `ERROR <code>:` followed by how to fix it. The common ones:

| Code | Meaning | What to do |
| :- | :- | :- |
| `plan_required` | The plan doesn't include this (MCP access, 4K, a longer video). | Upgrade at https://pitchboom.io/billing, or choose a shorter length. |
| `subscription_required` | No paid plan on the account. | Free accounts use the web app; plans at https://pitchboom.io/pricing. |
| `insufficient_scope` | The key lacks the permission (for example a Read only key). | Create a key with the right preset. |
| `insufficient_credits` | Not enough credits for the quote. Nothing was charged. | Top up at https://pitchboom.io/billing#top-up, or ask for fewer or shorter videos. |
| `quote_expired`, `quote_stale` | The quote is older than 30 minutes, or prices changed. | Get a fresh quote with `get_estimate` and show it again. |
| `estimate_changed` | The storyboard grew and costs more than the accepted total. | Show the new total; call `approve_storyboard` with it only if you agree. |
| `analysis_running` | The website analysis isn't finished. | Poll `get_project` until `analysis_status` is `ready`, then confirm the same quote again. |
| `batch_too_large` | More videos at once than the plan allows. | Lower `quantity`. |
| `video_busy` | A job is already running on this video. | Wait with `get_job_status`. |
| `rate_limited` | Too many requests. | Wait and retry. |

HTTP errors are JSON `{ "error": { "code", "message", "docs" } }`: `401` with `missing_api_key`, `malformed_api_key`, `invalid_api_key` or `key_in_url`; `429` with `rate_limited` and a `Retry-After` header; `503` when the service is briefly unavailable.

## Security and privacy

- The key is personal. pitchboom stores only a hash of it and checks it on every request, so revoking it at https://pitchboom.io/settings/api, a plan change or a suspension applies at once.
- Keep the key in an environment variable, your client's secret storage or your keychain; never in a repository, a chat or a URL.
- Text inside storyboards and site analyses comes from websites: the server tells agents to treat it as data, never as instructions.
- Videos are public in the pitchboom gallery by default. Pass `visibility: "private"` to `create_project`, or make private the default in your account settings.
- Download links from `get_video` are valid for 1 hour: download the file right away and don't store or share the links.
- The source-code tools ask you first, because your code leaves your machine. `delete_code_source` deletes uploaded code and everything derived from it, except saved Brand Kits and rendered videos.

## What is in this repository

| Path | Purpose |
| :- | :- |
| `server.json` | Entry for the [official MCP Registry](https://registry.modelcontextprotocol.io) (`io.pitchboom/pitchboom`) |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.mcp.json` | Claude Code plugin and its marketplace |
| `.cursor-plugin/plugin.json`, `mcp.json` | Cursor plugin |
| `gemini-extension.json`, `GEMINI.md` | Gemini CLI extension |
| `skills/pitchboom-video-ads/SKILL.md` | The agent skill ([Agent Skills](https://agentskills.io) format), shared by the plugins and the extension |
| `assets/` | Icon |
| `scripts/sync-from-source.mjs` | Regenerates the facts and the tool list from pitchboom's source code |

The pitchboom server is hosted by pitchboom and its code is not public: this repository holds configuration and documentation only. The blocks marked "GENERATED" are written by `scripts/sync-from-source.mjs` from the same source files as the live server and https://pitchboom.io/llms.txt.

## Links

- MCP documentation: https://pitchboom.io/docs/mcp
- Pricing: https://pitchboom.io/pricing
- Facts for AI assistants: https://pitchboom.io/llms.txt
- Terms: https://pitchboom.io/legal/terms · Privacy: https://pitchboom.io/legal/privacy
- Support: hello@pitchboom.io or [an issue in this repository](https://github.com/arseneHuot/pitchboom/issues)

## License

The files in this repository are under the MIT license ([LICENSE](LICENSE)). Use of the pitchboom service is governed by its [terms of service](https://pitchboom.io/legal/terms).

## En français

<!-- BEGIN GENERATED fr (scripts/sync-from-source.mjs): do not edit by hand -->
**pitchboom.io est un studio de motion design par IA pour les publicités vidéo.** À partir de l'URL d'un produit ou d'un court brief, il écrit le script, construit un storyboard modifiable, ajoute une voix off et une musique, et livre des vidéos MP4 (1080p ; 4K avec les formules Pro et Premium) aux formats 16:9, 9:16, 1:1, 4:5 et 3:4. Ce dépôt relie vos assistants IA (Claude Code, Claude Desktop et claude.ai, Cursor, VS Code, Gemini CLI, Codex) au serveur MCP distant de pitchboom.

**Pour commencer :** chaque nouveau compte reçoit 500 crédits gratuits, une seule fois à l'inscription, sans carte bancaire. Le serveur MCP est inclus dans les formules Pro (99 € HT par mois) et Premium (300 € HT par mois) ; les comptes gratuits utilisent l'application web.
<!-- END GENERATED fr -->

- **Adresse du serveur :** `https://pitchboom.io/api/mcp` (Streamable HTTP). Claude (connecteur personnalisé), ChatGPT, Claude Code et les autres clients compatibles OAuth n'ont besoin que de l'adresse : ils ouvrent pitchboom pour vous connecter et choisir les permissions. Sinon, en-tête `Authorization: Bearer pb_live_…` avec une clé personnelle créée sur https://pitchboom.io/settings/api ; ne la mettez jamais dans un fichier partagé ni dans une URL.
- **Installation :** dans Claude Code, `/plugin marketplace add arseneHuot/pitchboom` puis `/plugin install pitchboom@pitchboom` ; dans Gemini CLI, `gemini extensions install https://github.com/arseneHuot/pitchboom`. Les autres clients (Cursor, VS Code, Codex, Claude Desktop) sont décrits plus haut.
- **Règle d'argent :** les outils payants renvoient d'abord un devis. L'assistant vous le montre, vous approuvez ce montant précis, puis seulement il appelle `confirm_operation`. Un devis expire au bout de 30 minutes.
- Documentation (en anglais) : https://pitchboom.io/docs/mcp · Tarifs : https://pitchboom.io/pricing
