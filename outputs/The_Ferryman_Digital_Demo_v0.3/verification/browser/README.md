# Browser verification (v0.3)

Run: `node tests/integration/browser-flows.cjs`, 2026-09-27, Node v26.8.1, local headless Google Chrome on macOS arm64, local HTTP on 127.0.0.1 plus one direct `file://` check. **30 PASS, 0 FAIL.** Raw results: `runs/results.json`. Screenshots and an exported run: `runs/`.

This is agent-driven automation with the real engine. Every move is a legal click in the interface; each check compares the screen with `CharonEngine.getView()` of the run the page saved. It is not a human playtest and says nothing about balance or enjoyment.

## Coverage against the handoff list

| Required check | Result | Evidence |
|---|---|---|
| Initial resources | PASS: 2/6 light, 2 obols, 3/3 hull, 0/3 reprimands, cycle 1, 5 waiting | `A01-start.png` |
| Multi-destination travel | PASS: shore, Elysium, haven, shore in one cycle; later Elysium, haven, Asphodel | `A04-cycle2.png` |
| No intermediate anger | PASS: waiting anger unchanged at Elysium; no wraith before return | `A02-deliver.png` |
| Return anger / wraith timing | PASS: forecast equals actual anger; calm and memory mark protect; wraiths appear only after return and add fog next crossing | `E01-wraiths.png` |
| Free memory, no double play | PASS: light unchanged; second card disabled with the engine reason | results |
| Calming | PASS: 1 obol, once per cycle | results |
| Affordable / unaffordable release | PASS: 6 to 4 light, reprimands 2 to 1, pressure 2 to 1; at 1 light the button is disabled with the engine reason | results |
| Zero light | PASS: Tartarus fog 2 with 2 light leaves 0 and play continues | results |
| Repairs / rocky warning | PASS: rocky shows fog and a separate hull marker; hull 3 to 2; haven E04 restores; shore repair 1 obol per hull | `A05-cycle4-rocky.png` |
| Wish rewards | PASS: delivery preview and log match engine; light 2 to 6 | `A03-after-delivery-E01.png` |
| Delivery / event idempotency | PASS: delivery controls removed after confirm; engine rejects a second DELIVER (engine call, not a UI click) | results |
| Failure screens | PASS: fog, dismissal, sinking, each with engine summary, no win screen | `C02-ended-fog.png`, `D02-ended-dismissal.png`, `F01-ended-sinking.png` |
| Lethal / dismissal confirmation | PASS: confirmation dialog; Cancel keeps the run | `C01-lethal-confirm.png`, `D01-dismissal-confirm.png` |
| Quota information | PASS: next quota shown; quota paid at cycle 3 in the log | results |
| Save / reload, JSON export | PASS: reload resumes; export downloads and loads back; bad file and bad stored save rejected without losing the run | `export-cycle2.json` |
| New run vs knowledge | PASS: New run confirms and resets; discovered events kept; spoilers only on request; Clear discoveries leaves the run alone | `B01-reference-spoilers.png` |
| Keyboard | PARTIAL: Enter and Space on Board work and focus survives re-render. No full keyboard-only play-through. | results |
| Narrow viewport | PARTIAL: emulated 390x844 prepare screen, no horizontal scroll. No real phone. | `A06-narrow-prepare.png` |
| Missing-asset fallback | PASS: blocked `S01.png` and `boat.png` show labelled placeholders; play continues | `G01-missing-art.png` |
| Choice events E02, E03 | PASS: E03 accept pays 1 obol; E02 accept disabled with engine reason at 0 reprimands, decline continues; no route controls during the event | `H01-event-E03.png`, `H02-event-E02.png` |
| Direct file opening | PASS in headless Chrome only | results |
| Console | PASS: no exceptions; only the two deliberately blocked image errors | results |

## Not covered

- Human play, balance, enjoyment, learnability.
- Real phones, tablets, Safari, Firefox, Edge, Windows.
- Screen reader use and a full accessibility audit.
- E02 accepted with a reprimand to reduce (engine tests cover it).
- Cohort rollover past 12 souls in the browser (engine tests cover it).
