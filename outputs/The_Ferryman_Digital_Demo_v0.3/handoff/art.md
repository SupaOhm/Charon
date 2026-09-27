# Worker A: art revision 2

Status: READY for prototype integration. The user requested distinct myth-informed environments, a more frightening wraith, and redesigned currency and gameplay elements. Team art approval and playable-UI integration remain pending.

## Delivered changes

- Five environment replacements: willow/confluence shore, flowering coastal Elysium, flat asphodel meadow, bronze-gated Tartarus abyss and enclosed haven workshop.
- Vengeful wraith with a furious face, reaching hand and turbulent torn shroud.
- Silver obol, amber lantern-light token and shared memory-card back.
- 36 original SVG symbols for resources, hazards, actions, destinations and all six memories.
- Three reusable blank SVG frames and optional CSS for counters, memory cards, routes and action chips.

The current manifest has **62 entries: 20 images, 36 icons and 6 components**. These resolve to **23 PNGs and 39 SVGs**. Nine PNGs are newly generated for this revision; the apprentice, boat and twelve soul portraits are retained byte-for-byte. Counts and hashes are recorded in assets/art/VALIDATION_R2.json, fields counts and assets.

Original PNGs and the first-pass ZIP remain on disk. Active images point to -r2 filenames where revised.

## Style and myth

Keep the atmospheric painted and engraved texture, charcoal-teal framing, worn bronze and amber lantern. Differentiate locations through terrain, architecture, vegetation and spatial scale, not palette alone. Shore uses black-green willow silhouettes; Elysium uses open sea, gold flowers and rounded trees; Asphodel uses horizontal silver-lavender flower fields; Tartarus uses vertical obsidian and copper gates; haven uses close timber and amber light.

The guide and passengers remain human and sympathetic. The wraith is the deliberately threatening exception requested by the user. Destination imagery does not rank passengers by moral worth.

See assets/art/MYTH_AND_VISUAL_NOTES.md for primary-text links, creative adaptations, rule references and the oldest-first freshness table. Haven is an original game stop. The coin emblem is an original game design inspired by silver coin material, not a historical replica.

## Active catalogue

All listed entries are READY. Paths are relative to the v0.3 game root.

| Manifest group/key | File or pattern | Actual dimensions | Fit |
|---|---|---|---|
| images.shore | assets/art/shore-r2.png | 1536 x 1024 | cover |
| images.elysium | assets/art/elysium-r2.png | 1536 x 1024 | cover |
| images.asphodel | assets/art/asphodel-r2.png | 1536 x 1024 | cover |
| images.tartarus | assets/art/tartarus-r2.png | 1536 x 1024 | cover |
| images.haven | assets/art/haven-r2.png | 1536 x 1024 | cover |
| images.wraith | assets/art/wraith-r2.png | 1024 x 1536 | contain |
| images.apprentice | assets/art/apprentice.png | 1024 x 1536 | contain |
| images.boat | assets/art/boat.png | 1536 x 1024 | contain |
| images.S01 through S12 | assets/art/S01.png through S12.png | 1024 x 1536 | contain |
| components.obolToken | assets/art/obol-token-r2.png | 1254 x 1254 | contain |
| components.lightToken | assets/art/light-token-r2.png | 1254 x 1254 | contain |
| components.memoryBack | assets/art/memory-back-r2.png | 1024 x 1536 | contain |
| components.soulFrame | assets/art/components/soulFrame.svg | 480 x 720 | contain |
| components.memoryFrame | assets/art/components/memoryFrame.svg | 480 x 720 | contain |
| components.routeFrame | assets/art/components/routeFrame.svg | 720 x 280 | contain |
| icons, all 36 keys below | assets/art/icons/{key}.svg | 64 x 64 | contain |

Icon keys:

- Resources: obol, light, flame, hull, reprimand.
- Conditions: seats, fog, rock, anger, wraith, protection, link, conflict.
- Actions: calm, release, repair, board, unboard, depart, deliver, playMemory.
- Progress: cycle, quota, discovery, preferred.
- Locations: node_shore, node_elysium, node_asphodel, node_tartarus, node_haven.
- Memories: R01, R02, R03, R04, R05, R06.

Missing required keys: none. Delivered assets needing revision after the recorded checks: none.

## Integration for Worker D

1. Preserve the existing CHARON_ASSETS.images interface and classic-script loading order from SHARED_CONTRACT.md:7. Paths resolve from the game root. The manifest still uses version 0.3; revision art-r2, icons and components are additive fields authorized by the latest user request.
2. Each added entry uses src, alt, width, height, fit and position; icons additionally have a category. Existing consumers of .images continue to work. Optional consumers should fall back to local labeled controls if an icon is absent.
3. Paintings are opaque RGB, not transparent sprites. Contain the apprentice, boat, wraith, portraits, tokens and memory back. The generated tokens are actually 1254 square even though their prompts requested 1024.
4. Environments use centered cover. The source is 3:2; 16:9 crops were reviewed. Use a separate solid or shaded panel behind game text, especially over flower fields and workshop details. Review other crop ratios in the actual UI.
5. Use SVG icons around 24-48 CSS pixels with adjacent labels. Paintings are intended for larger illustrations. Coin and lantern shapes distinguish the resources as well as their color. Labels and live counts must remain accessible HTML.
6. assets/art/ui-theme.css is an optional visual layer scoped beneath .charon-r2. The preview shows its expected markup. It does not implement selection, focus, disabled states, boarding, route decisions or memory effects. D should wire real buttons and state semantics in the game.
7. SVG frames have dark filled panels and blank visual regions. Place them behind live content or use the CSS examples; never render a complete game card as one inaccessible image. Memory effect text remains in current rules/content.
8. Keep numeric mechanics unchanged. Preview counters show current starting values from decided rules line 56. Other samples use placeholder live-text labels. Resolve soul portraits by template ID, with instance identities and relationship labels kept in the UI.
9. Retain the established Mother/Child and Musician/Listener textile links. Red and Blue Soldier differ in clothing, age and helmet treatment. All portraits still need role text.
10. Serve the game root locally and open assets/art/preview.html to review. Direct-file opening was not tested. The asset files themselves have no server or external-service dependency.

## Provenance, checks and package

- PROVENANCE_R2.json: exact prompts and references for the nine new PNGs, original SVG inventory and retained-key list. Images were generated with the built-in image tool. No web or museum images were copied.
- PROVENANCE.json: preserved first-pass history, including provenance for the fourteen retained images. Its old twenty-image set is historical, not the active manifest.
- VALIDATION_R2.json: Node syntax and VM checks, local paths, actual dimensions, SVG XML and script/reference checks, hashes and browser observations.
- preview.html: manifest-driven art catalogue, not a playable game.
- The_Ferryman_v0.3_Art_Pack_r2.zip: active art, manifest, optional CSS, preview, provenance, notes, validation and this handoff, with game-relative paths.
- PACKAGE_CHECK_R2.json: integrity and entry-hash comparisons, kept outside the ZIP to avoid a self-referential checksum.

Recorded validation: **62 of 62 catalogue assets loaded**, zero failed loads and zero natural-dimension mismatches in the 1280 x 720 desktop browser preview. All 36 symbols were visually inspected at 24 and 48 CSS pixels. The five 16:9 environment crops, wraith, tokens, memory samples and blank frames were inspected. Fourteen retained PNG hashes match the first-pass report. Total active PNG bytes: 67,675,572; SVG bytes: 14,978. Full-resolution PNGs have not been optimized for runtime download size.

These checks cover the art catalogue only. No gameplay integration, mobile/real-device coverage, full accessibility audit, human playtest, balance, enjoyment or final approval is claimed.

## Coordinator checkpoint

Art revision 2 is ready for integration. No rules, content pack or playable game source changed. The user's currency/game-element request extends the earlier art scope; playable-control behavior remains with Worker D.

AGENT_CONTEXT.md predates both art passes and is possibly stale for art completion. During coordinated assembly, record this revision and its pending UI integration there. It remains untouched here to respect Worker A's assigned ownership. No dependencies were installed, no other agents were launched, and nothing was pushed or published.
