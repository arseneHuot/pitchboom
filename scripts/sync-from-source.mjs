#!/usr/bin/env node
/**
 * Regenerates the parts of README.md and skills/pitchboom-video-ads/SKILL.md that come from pitchboom's own source
 * code, so they never drift from the live server:
 *   - the MCP tool list and the API key presets: apps/web/lib/mcp/tool-catalog.ts and key-format.ts;
 *   - prices, plans, free signup credits, formats, lengths and goals: apps/web/lib/seo/facts.ts and
 *     packages/shared/src/catalog.ts (the same helpers that write https://pitchboom.io/llms.txt).
 * Text between the BEGIN GENERATED / END GENERATED markers is replaced; everything else is left as written.
 *
 * The pitchboom source is private: this script is for maintainers who have a checkout with its dependencies
 * installed (pnpm install). It only reads that checkout and only writes files of this repository.
 *
 * Usage, from the root of this repository:
 *   node scripts/sync-from-source.mjs --source /path/to/pitchboom            rewrite the generated blocks
 *   node scripts/sync-from-source.mjs --source /path/to/pitchboom --check    exit 1 if a block is out of date
 *   add --verify-live to also compare the prices with https://pitchboom.io/llms.txt (the live overrides)
 * PITCHBOOM_SOURCE can replace --source.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** The Cinema quality is behind the `cinema_production` flag, off in production: nothing about it is generated. */
const CINEMA_PRODUCTION = false;

const SELF = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(SELF), "..");
const argv = process.argv.slice(2);
const CHECK = argv.includes("--check");
const VERIFY_LIVE = argv.includes("--verify-live");
const sourceIndex = argv.indexOf("--source");
const sourceArg = sourceIndex >= 0 ? argv[sourceIndex + 1] : process.env.PITCHBOOM_SOURCE;

function die(message) {
  console.error(`sync-from-source: ${message}`);
  process.exit(2);
}

if (!sourceArg) die("pass --source <path to the pitchboom monorepo> (or set PITCHBOOM_SOURCE).");
const SOURCE = resolve(sourceArg);
const WEB = join(SOURCE, "apps/web");
const SOURCES = {
  catalog: "apps/web/lib/mcp/tool-catalog.ts",
  keys: "apps/web/lib/mcp/key-format.ts",
  facts: "apps/web/lib/seo/facts.ts",
  shared: "packages/shared/src/catalog.ts",
};
for (const rel of Object.values(SOURCES)) if (!existsSync(join(SOURCE, rel))) die(`${rel} not found under ${SOURCE}.`);

// The sources are TypeScript with tsconfig paths: run again under the monorepo's own tsx loader, from apps/web, with
// the react-server condition its tests use.
if (process.env.PB_SYNC_CHILD !== "1") {
  if (!existsSync(join(WEB, "node_modules/tsx"))) die(`tsx is missing in ${WEB}/node_modules: run pnpm install in the monorepo first.`);
  const run = spawnSync(process.execPath, ["--conditions=react-server", "--import", "tsx", SELF, ...argv], {
    cwd: WEB,
    stdio: "inherit",
    env: { ...process.env, PB_SYNC_CHILD: "1", NEXT_PUBLIC_SITE_URL: "https://pitchboom.io" },
  });
  process.exit(run.status ?? 1);
}

const load = (rel) => import(pathToFileURL(join(SOURCE, rel)).href);
const { MCP_TOOLS, MCP_CODE_TOOLS, SCOPE_LABELS, listedMcpTools } = await load(SOURCES.catalog);
const { MCP_ACCESS_PRESETS } = await load(SOURCES.keys);
const facts = await load(SOURCES.facts);
const { GOALS, PLATFORMS } = await load(SOURCES.shared);

const f = facts.marketingFacts({ cinemaProduction: CINEMA_PRODUCTION });
const num = (n) => n.toLocaleString("en-US");
const and = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const or = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs.at(-1)}`);
const mcpPlans = f.plans.filter((p) => p.mcp).map((p) => p.name);
const fourKPlans = f.plans.filter((p) => p.fourK !== "none").map((p) => p.name);
const fourK = (p) => (p.fourK === "included" ? "Included" : p.fourK === "surcharge" ? `+${num(f.render4kPerSecond)} credits per second` : "No");
const listedTools = listedMcpTools({ cinemaProduction: CINEMA_PRODUCTION });

// ---------------------------------------------------------------------------------------------------------- blocks

function introBlock() {
  return [
    `**pitchboom.io is an AI motion-design studio for video ads.** From a product URL or a short brief, it writes the script, builds an editable storyboard, adds a voice-over and music, and renders MP4 videos (1080p; 4K on ${and(fourKPlans)}) in ${and([...f.aspects])}. This repository connects AI assistants (Claude Code, Claude Desktop and claude.ai, Cursor, VS Code, Gemini CLI, Codex) to pitchboom's remote MCP server, so an agent can prepare, price, launch, edit and download videos on your pitchboom account. Paid steps return a quote first, and credits are spent only after you approve it.`,
  ].join("\n");
}

function factsBlock() {
  const rows = [
    "| Plan | Price per month (excl. VAT) | Credits | MCP server | 4K export | Longest video | Videos per batch |",
    "| :- | :- | :- | :- | :- | :- | :- |",
  ];
  if (f.free) {
    rows.push(`| Free account | €0 | ${num(f.free.credits)} once, at signup | No (web app only) | No | ${f.free.maxDurationS} s | ${f.free.maxBatch} |`);
  }
  for (const p of f.plans) {
    rows.push(`| ${p.name} | ${p.price} | ${num(p.creditsPerMonth)} per month | ${p.mcp ? "**Yes**" : "No"} | ${fourK(p)} | ${p.maxDurationS} s | ${p.maxBatch} |`);
  }
  const discounts = f.plans.filter((p) => p.discountPct > 0).map((p) => `${p.discountPct}% off every credit on ${p.name}`);
  return [
    `**Free to start:** ${facts.freemiumSentence(f)} The MCP server is part of the ${and(mcpPlans)} plans; free accounts make Standard videos in the web app.`,
    "",
    ...rows,
    "",
    `**What a video costs** (storyboard, voice-over, music and 1080p render included): ${facts.perSecondRatesLine(f)}; ${facts.codeRatesLine(f)}. Videos shorter than ${f.minBilledSeconds} s are billed as ${f.minBilledSeconds} s. ${facts.offerMinimumsSentence(f)} Example: a 15-second Standard video is ${facts.creditsWithEur(f.video(15, "standard"))}. 1 credit = €${f.creditFaceEur} at the Starter rate${discounts.length ? ` (${and(discounts)})` : ""}.`,
    "",
    `**How credits are charged:** ${facts.creditsLifecycleSentence()}`,
    "",
    `Prices as of pricing version ${f.pricingVersion}. The live figures are on https://pitchboom.io/pricing and https://pitchboom.io/llms.txt.`,
  ].join("\n");
}

function toolNote(t) {
  const spends = t.scope === "spend" ? "**Yes**, only after you approve the quote" : t.annotations.destructiveHint ? "No (stops or deletes)" : "No";
  return t.confirm ? `${spends}; Claude Code asks you before each call` : spends;
}

function toolTable(tools) {
  return [
    "| Tool | What it does | Key permission | Spends credits |",
    "| :- | :- | :- | :- |",
    ...tools.map((t) => `| \`${t.name}\` | ${t.title} | ${SCOPE_LABELS[t.scope]} | ${toolNote(t)} |`),
  ].join("\n");
}

function toolsBlock() {
  return [
    `The server lists ${listedTools.length} tools to every key:`,
    "",
    toolTable(listedTools),
    "",
    `When source-code input is enabled on your account, ${MCP_CODE_TOOLS.length} more tools let an agent with a shell (Claude Code, Codex, Gemini CLI) send your product's code so videos rebuild your real screens. They ask you first: your code leaves your machine.`,
    "",
    toolTable(MCP_CODE_TOOLS),
  ].join("\n");
}

function presetsBlock() {
  return [
    "| Preset | Permissions | What it allows |",
    "| :- | :- | :- |",
    ...Object.values(MCP_ACCESS_PRESETS).map((p) => `| ${p.label} | ${p.scopes.map((s) => SCOPE_LABELS[s]).join(", ")} | ${p.description} |`),
  ].join("\n");
}

function frBlock() {
  const et = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs.at(-1)}`);
  const eur = (cents) => `${(cents / 100).toLocaleString("fr-FR")} €`;
  const plans = f.plans.filter((p) => p.mcp).map((p) => `${p.name} (${eur(p.priceCents)} HT par mois)`);
  return [
    `**pitchboom.io est un studio de motion design par IA pour les publicités vidéo.** À partir de l'URL d'un produit ou d'un court brief, il écrit le script, construit un storyboard modifiable, ajoute une voix off et une musique, et livre des vidéos MP4 (1080p ; 4K avec les formules ${et(fourKPlans)}) aux formats ${et([...f.aspects])}. Ce dépôt relie vos assistants IA (Claude Code, Claude Desktop et claude.ai, Cursor, VS Code, Gemini CLI, Codex) au serveur MCP distant de pitchboom.`,
    "",
    `${f.free ? `**Pour commencer :** chaque nouveau compte reçoit ${f.free.credits.toLocaleString("fr-FR")} crédits gratuits, une seule fois à l'inscription, sans carte bancaire. ` : ""}Le serveur MCP est inclus dans les formules ${et(plans)} ; les comptes gratuits utilisent l'application web.`,
  ].join("\n");
}

function skillOptionsBlock() {
  const planLengths = f.plans.map((p) => `${p.name} ${p.maxDurationS} s`);
  if (f.free) planLengths.unshift(`free account ${f.free.maxDurationS} s`);
  return [
    `- **Goals** (\`goal\`, required): ${GOALS.map((g) => `\`${g.id}\` (${g.label}: ${g.description.replace(/\.$/, "")})`).join("; ")}.`,
    `- **Platform presets** (\`platform\`, optional; each sets a default aspect and keeps text clear of the platform's interface): ${PLATFORMS.map((p) => `\`${p.id}\` (${p.label}, ${p.defaultAspect})`).join(", ")}.`,
    `- **Aspect ratios** (\`aspect\`): ${f.aspects.join(", ")}. Each format is recomposed, not cropped.`,
    `- **Lengths** (\`duration_seconds\`): ${f.durations.join(", ")} seconds. Longest video per plan: ${planLengths.join(", ")}.`,
    `- **Qualities** (\`quality\`): ${f.rates.map((r) => `\`${r.offer}\` (${r.label}, ${r.video} credits per second)`).join(", ")}. With screens rebuilt from the user's code: ${f.rates.map((r) => `${r.label} +${r.code}`).join(", ")} credits per second.`,
    `- **Resolution**: 1080p by default; 4K on ${and(fourKPlans)} (${f.plans
      .filter((p) => p.fourK !== "none")
      .map((p) => `${p.name}: ${fourK(p).toLowerCase()}`)
      .join(", ")}).`,
    `- **Languages**: ${f.languageCount} languages for the voice-over and translations (codes from \`get_options\`).`,
    `- **Batches** (\`quantity\`): independent variants of one brief, up to ${and(f.plans.filter((p) => p.mcp).map((p) => `${p.maxBatch} on ${p.name}`))}.`,
    `- **Plans with the MCP server**: ${and(mcpPlans)}. ${f.free ? `Free accounts (${num(f.free.credits)} signup credits) use the web app.` : ""}`.trim(),
  ].join("\n");
}

// ------------------------------------------------------------------------------------------------------- rewriting

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceBlock(text, name, body, file) {
  const begin = `<!-- BEGIN GENERATED ${name} (scripts/sync-from-source.mjs): do not edit by hand -->`;
  const end = `<!-- END GENERATED ${name} -->`;
  const re = new RegExp(`${escapeRe(begin)}[\\s\\S]*?${escapeRe(end)}`);
  if (!re.test(text)) die(`${file}: the markers of the "${name}" block are missing.`);
  return text.replace(re, () => `${begin}\n${body.trim()}\n${end}`);
}

const targets = [
  { file: "README.md", blocks: { intro: introBlock(), facts: factsBlock(), presets: presetsBlock(), tools: toolsBlock(), fr: frBlock() } },
  { file: "skills/pitchboom-video-ads/SKILL.md", blocks: { options: skillOptionsBlock() } },
];

// The key descriptions of the manifests name the plans that include the MCP server.
const keyDescription = `Personal pitchboom API key (pb_live_...), created at https://pitchboom.io/settings/api. The MCP server needs the ${or(mcpPlans)} plan.`;
const jsonTargets = [
  {
    file: "server.json",
    edit: (j) => {
      const header = j.remotes?.[0]?.headers?.find((h) => h.name === "Authorization");
      if (!header) die("server.json: no Authorization header in remotes[0].");
      header.description = `Optional: a pitchboom API key as a bearer token (${or(mcpPlans)} plan), from https://pitchboom.io/settings/api. Leave it empty to sign in with OAuth.`;
    },
  },
  {
    file: ".cursor-plugin/plugin.json",
    edit: (j) => {
      if (!j.variables?.properties?.PITCHBOOM_API_KEY) die(".cursor-plugin/plugin.json: no PITCHBOOM_API_KEY variable.");
      j.variables.properties.PITCHBOOM_API_KEY.description = keyDescription;
    },
  },
  {
    file: "gemini-extension.json",
    edit: (j) => {
      const setting = j.settings?.find((s) => s.envVar === "PITCHBOOM_API_KEY");
      if (!setting) die("gemini-extension.json: no PITCHBOOM_API_KEY setting.");
      setting.description = keyDescription;
    },
  },
];

let stale = 0;
for (const { file, edit } of jsonTargets) {
  const path = join(ROOT, file);
  const before = readFileSync(path, "utf8");
  const json = JSON.parse(before);
  edit(json);
  const after = `${JSON.stringify(json, null, 2)}\n`;
  if (after === before) console.log(`up to date  ${file}`);
  else if (CHECK) {
    console.log(`OUT OF DATE ${file}`);
    stale++;
  } else {
    writeFileSync(path, after);
    console.log(`updated     ${file}`);
  }
}

for (const { file, blocks } of targets) {
  for (const [name, body] of Object.entries(blocks)) {
    if (!CINEMA_PRODUCTION && /cinema/i.test(body)) die(`the generated "${name}" block of ${file} mentions Cinema while cinema_production is off.`);
  }
  const path = join(ROOT, file);
  const before = readFileSync(path, "utf8");
  let after = before;
  for (const [name, body] of Object.entries(blocks)) after = replaceBlock(after, name, body, file);
  if (after === before) {
    console.log(`up to date  ${file}`);
  } else if (CHECK) {
    console.log(`OUT OF DATE ${file}`);
    stale++;
  } else {
    writeFileSync(path, after);
    console.log(`updated     ${file}`);
  }
}

if (VERIFY_LIVE) {
  // Live admin overrides can change prices without a deploy: the code defaults must still match the live mirror.
  const res = await fetch("https://pitchboom.io/llms.txt", { headers: { "user-agent": "pitchboom-public-repo-sync" } });
  const live = await res.text();
  const expected = [
    facts.freemiumSentence(f),
    ...f.plans.map((p) => `${p.name} ${p.price} with ${num(p.creditsPerMonth)} credits`),
    ...f.rates.map((r) => `${r.label} ${r.video} credits`),
  ];
  const missing = expected.filter((s) => !live.includes(s));
  if (missing.length) {
    console.log(`LIVE MISMATCH: https://pitchboom.io/llms.txt does not contain:\n  - ${missing.join("\n  - ")}`);
    stale++;
  } else {
    console.log("live check  https://pitchboom.io/llms.txt matches the code defaults");
  }
}

process.exit(stale ? 1 : 0);
