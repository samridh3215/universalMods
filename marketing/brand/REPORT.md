# universalMods launch brand kit

## 1. Research findings

**Sizes:**
- Product Hunt gallery: 1270x760. You need at least 2 images, and the first one is the hook. ([screenhance gallery size](https://screenhance.com/blog/product-hunt-gallery-size), [screenhance launch visuals](https://screenhance.com/blog/product-hunt-launch-visuals))
- Product Hunt thumbnail: 240x240, uploaded separately; a GIF under 3 MB is allowed. Keep it simple.
- GitHub social preview: 1280x640, under 1 MB, at least 640x320. Keep the key content central and use a solid background. ([GitHub docs](https://docs.github.com/en/enterprise-server@3.17/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview))
- Open Graph: 1200x630 (1.91:1). LinkedIn uses 1200x627, and X may crop to 16:9. Keep it under about 1 MB. ([krumzi](https://www.krumzi.com/blog/og-image-size-cheat-sheet-1200x630), [dev.to](https://dev.to/grabbit/open-graph-image-sizes-and-dimensions-the-complete-2026-guide-1k16))

**Patterns:**
1. **Lead with a short line that names the category, next to the product.**
   - Munder Difflin: "Agent harness to run an office of your clones". It shows a banner, then a floor screenshot, and was #1 repo of the day and #5 on Product Hunt. ([repo](https://github.com/HarnessMD/munder-difflin), [overview](https://themenonlab.blog/blog/munder-difflin-office-of-coding-agents))
   - Conductor: "Run parallel coding agents on your Mac". ([site](https://www.conductor.build/))
   - Vibe Kanban: "Get 10X more out of Claude Code, Gemini CLI, Codex…" ([repo](https://github.com/BloopAI/vibe-kanban))
   - Claude Squad: a plain screenshot. ([repo](https://github.com/smtg-ai/claude-squad))
   - Our README currently has no headline above the screenshot.
2. **Keep headlines to 3–5 words** and put no paragraphs on the image; the long copy goes in the launch text.
3. **Use one background across the set.** Dark with soft brand glows is the standard dev-tool look (Linear, Raycast, Warp, Zed).
4. **Show the product in a frame:** a window, angled in perspective, bleeding off an edge, with a glow behind it.
5. **Crop to the moment that matters**, with numbered callouts, instead of the whole app at unreadable scale.
6. **Treat the gallery as a story:** hook, then workflow (input, action, result), then feature details, then a next step. Real UI with realistic data beats illustrations.
7. **Motion is optional.** If used, put a 4–6 s WebM in slot 2 and keep slot 1 static.

**The field:** Claude Squad, Conductor, Vibe Kanban (now sunsetting), Superset, Crystal and Munder Difflin all run multiple agents in parallel. ([agentsroom](https://agentsroom.dev/blog/best-multi-agent-coding-tools), [superset](https://superset.sh/compare/best-ai-coding-agents-2026)) Our differentiators: the real CLI in a live browser terminal for both Codex and Claude Code, a permanent Orchestrator with a shared hive, and mods generated from a sentence.

## 2. Naming

**An honest look at "universalMods":**
- **Clarity:** it names the plugin system, not the product. There is no hint of agents, orchestration or a floor.
- **Search:** crowded by game modding. ModDB has "Universal Mod" for Blitzkrieg 2. **Universal Modder** ([aiidelist write-up](https://aiidelist.com/blog/universal-modder.md)) is an MIT toolkit for modding PC games with Claude Code, released 30 Sep 2026, with a CLI named `um`, which collides with this repo's `um-*` prefix. GitHub also has `knah/ML-UniversalMods` (52★, game mods).
- **Memorability:** camelCase and awkward to say aloud.
- **npm:** `universalmods` and `universal-mods` are both free.
- **Domain:** `universalmods.dev` has no NS records (a hint only).
- **Verdict:** workable but undersells the product. If you rename, do it before the Product Hunt launch.

**Alternatives** (checked with npm view, a GitHub in:name search and a web search; domains are hints only):

| Name | Why | npm | GitHub repos | Web / domain | Verdict |
|---|---|---|---|---|---|
| **Modfloor** | Floor of agents + moddable, in one word. | free | 0 | No product found. `.dev` has no NS; `.com` is registered. | **Top pick** |
| **Floorwalker** | The supervisor who walks the floor, i.e. the Orchestrator. Keeps the office lineage. | free | 2 tiny | No software found. `.com` is parked for sale; `.dev` has no NS. | Runner-up |
| **Hivefloor** | Uses the product's own hive + floor vocabulary. | free | 1 (0★) | `.com` is registered; `.dev` has no NS. | Third |
| Hivemod | Short. | free | 3 small, one a game-server mod | Leans towards game modding. | Maybe |
| Shiftboss | Foreman tone. | free | 3 tiny | Clean. | Maybe, but no mods angle |
| Pitboss | Floor supervisor. | taken | – | Common. | Weak |
| Bullpen | Office nod. | taken | 270 | A Product Hunt "Bullpen" Claude Code skills pack exists ([hunted.space](https://hunted.space/product/bullpen-2)). | Reject |
| AgentFloor | Literal. | taken: "AI Agent Fleet Management hub" | 3 | Direct collision. | Reject |
| Crewdeck | – | taken: "Visual dashboard to manage your Claude Code agents" | 25 | Collision. | Reject |
| Agentdeck | – | taken: "Mobile control for your coding agents" | – | Collision. | Reject |
| Foreman | – | taken | many | Unsearchable. | Reject |
| Switchboard | – | taken | many | Generic. | Reject |

**Recommendation:** 1. Modfloor, 2. Floorwalker, 3. Hivefloor.

If you keep the name, use "universalMods: run a team of coding agents. Mod everything." and lead the repo description with the agent story. Also consider moving away from the `um` prefix in the docs.

**Taglines:**
1. **"Run a team of coding agents. Mod everything."** (used in the images)
2. "One moddable floor for your Codex and Claude Code agents."
3. "Your coding agents on one floor, reshaped with a sentence."

**One-sentence pitch:** universalMods is an open-source, local web floor where a master Orchestrator plans and delegates to a team of Codex or Claude Code agents, each running its real CLI in a live browser terminal, and where every view is a hot-reloading mod you can generate from one sentence.

## 3. Images

All images use the dark base with blue, violet, pink and amber glows, Inter and JetBrains Mono, the logo mark, and the name "universalMods".

| File | Size | Use |
|---|---|---|
| `hero.png` | 2400x1350 | README and site hero: headline, angled framed floor, and 3 numbered callouts. |
| `social-preview.png` | 1280x640 | GitHub Settings → Social preview. |
| `og.png` | 1200x630 | `og:image` / `twitter:image` for the GitHub Pages site. |
| `ph-gallery-1.png` | 1270x760 | Product Hunt slot 1: the hook. |
| `ph-gallery-2.png` | 1270x760 | Live terminals (mission layout). |
| `ph-gallery-3.png` | 1270x760 | Mods from a sentence: describe it, Mod Builder writes it, Cost panel hot-reloads. |
| `ph-gallery-4.png` | 1270x760 | Layouts: dashboard, mission, planner (light). |
| `ph-thumbnail.png` | 240x240 | Product Hunt thumbnail. |

**Editing:**
- To rename, edit `universal<b class="grad">Mods</b>` and the `<title>` in `src/*.html`, then run `src/render.sh`.
- To refresh the screenshots, run `UM_TOKEN=<token> node marketing/brand/src/capture.mjs`.

**Next steps:** swap the README hero, upload the social preview, add OG meta tags to `docs/index.html`, and optionally add a 4–6 s WebM of a mod hot-reloading as Product Hunt slot 2.
