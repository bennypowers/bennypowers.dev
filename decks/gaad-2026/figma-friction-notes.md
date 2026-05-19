# Figma RHDS Connection -- Friction Notes

## Context
Attempting to connect to RHDS Figma library from slide deck project,
to demonstrate RHDS-can-do and note pain points for the talk.

## Friction Log

### 1. search_design_system requires a fileKey
Can't search RHDS components without first having a Figma file open.
No way to browse org-level design system assets without a file context.
Chicken-and-egg: need file to find components, need components to make file.

### 2. Library auto-subscription is magic (positive)
Created file in Red Hat org, RHDS library v4.1.0 was automatically subscribed.
PatternFly 5, PF6, Red Hat icon library all auto-added. Zero friction here.

### 3. No Code Connect mappings found
get_code_connect_map returns empty on new file. Expected, but highlights gap:
RHDS Figma library has no Code Connect mappings to `@rhds/elements` web components.
This is literally the talk's thesis -- connecting Figma components to code.
**This is a demo opportunity**: show CEM + Figma MCP bridging this gap.

### 4. Token naming alignment (positive)
RHDS Figma variables use same naming as CSS tokens:
`Brand/--rh-color-brand-red` maps to `--rh-color-brand-red` in CSS.
Asimonim can search these. CEM can reference them.
The naming alignment IS the AI-native bridge.

### 5. search_design_system returns cross-library results
Searching "card" returns PF5, PF6, RHDS, and RHDH results.
No easy way to scope to "just RHDS" without knowing the library key first.
Workaround: use includeLibraryKeys param, but you need to call get_libraries first.

### 6. Component descriptions vary in quality
RHDS Card variants have descriptions (list card, blockquote card, etc).
Some (Card - basic, Card - icon, Card - title) have NO description.
This is exactly what cem health measures -- description quality affects
AI's ability to select the right component.

### 8. Asimonim MCP config discovery
asimonim MCP search tool fails with "no files specified and no files found in config"
even with `.config/design-tokens.yaml` present. CLI works fine with explicit file arg.
MCP server may look for config in different cwd than the project root.
**Friction**: need to figure out how MCP server resolves config path.
CLI workaround: `asimonim search teal node_modules/@rhds/tokens/json/rhds.tokens.json`

### 9. Every GSlides template color maps to an RHDS token (positive)
Extracted all 55 colors from the official PPTX. Every single one maps to an RHDS token.
Teal-60 (#147878) is the accent, teal-10 (#daf2f2) is section divider bg.
**This is powerful proof**: Brand team's templates ARE RHDS tokens.

### 7. Figma MCP file creation flow
create_new_file requires planKey (org key). Had to call whoami first to get it.
Minor friction, but adds a step before you can start working.
For enterprise users this is typical -- personal vs org context matters.
