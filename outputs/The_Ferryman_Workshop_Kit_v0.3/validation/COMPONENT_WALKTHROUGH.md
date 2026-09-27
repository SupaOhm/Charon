# Agent component/rules walkthrough

Executed September 27, 2026 against the generated selectable PDF text and component data. The first five steps form one desk sequence. Later steps use separate constructed states, not a claimed continuous run. Each step checks named recording fields and arithmetic. This is not a human playtest, browser-engine test or physical manipulation trial.

## Setup | PASS

Complete-PDF pages: 3, 19, 24.

Place C01-S01 through S05 waiting, each anger 0. Record cycle 1, completed 0, next quota 3. Mark the empty setup draw done.

Recorded desk result: `{"light": 2, "obols": 2, "hull": 3, "reprimands": 0, "waiting": 5, "memories": 0}`

## Two-seat boarding and shore preparation | PASS

Complete-PDF pages: 14, 18, 20, 24.

Put Mother in seat 1, her extra-capacity marker in seat 2 labeled 1, Child in seat 3, Merchant in seat 4. Calm waiting Red Soldier for 1 obol. Capture waiting Red Soldier/Poet IDs on confirmed departure. Neither waiting soul has a departing linked partner.

Recorded desk result: `{"seatsUsed": 4, "obolsAfterCalm": 1, "W": ["C01-S04", "C01-S05"], "S": [], "P": ["C01-S04"]}`

## First crossing and joint delivery | PASS

Complete-PDF pages: 6, 13, 19, 22, 26.

Choose shore to Elysium, ordinary. Final fog 0. Record entry IDs S01/S02/S03 from C01, then deliver Mother and Child together. Issue their two Joined fronts with source IDs and destination Elysium; keep both Faint options in reserve. Resolve E01, then draw both earned cards.

Recorded desk result: `{"fog": 0, "lightAfterRewardsAndEvent": 6, "obols": 1, "aboard": ["C01-S03"], "earnedMemories": 2, "E01": "resolved", "hand": 2}`

## Free memory, remote protection and second delivery | PASS

Complete-PDF pages: 6, 13, 16, 19, 22, 24.

At Elysium play Mother Joined for free, mark waiting Poet P remotely, discard the card and do not redraw here. Cross to Tartarus with Merchant: max(0,2-2)=0. Deliver Merchant, issue Vigil with source C01-S03 and destination Tartarus. Draw Vigil, then recycle the earlier discarded Joined to reach three cards at this new stop.

Recorded desk result: `{"fog": 0, "light": 6, "obols": 2, "earnedMemories": 3, "hand": 3, "draw": 0, "discard": 0, "P": ["C01-S04", "C01-S05"]}`

## Successful return and refill | PASS

Complete-PDF pages: 19, 20, 25.

Return empty from Tartarus with no active wraiths. Final fog 0. Increment completed cycles to 1. Both W souls have P and no S, so remain anger 0. No broken promises or quota. Clear marks, recover light to cap, advance to cycle 2, reset visits, refill with S06/S07/S08. Existing hand remains three.

Recorded desk result: `{"completedCycles": 1, "cycle": 2, "nextQuota": 3, "light": 6, "obols": 2, "hull": 3, "reprimands": 0, "waitingIDs": ["C01-S04", "C01-S05", "C01-S06", "C01-S07", "C01-S08"], "hand": 3}`

## Wraith formation and immediate release | PASS

Complete-PDF pages: 15, 19, 20, 21, 25.

Separate constructed checkpoint: C02-S09 is a W soul at anger 2 without P/S. On a surviving return its anger becomes 3, form a wraith and add one reprimand. Keep its source card/ID in the wraith area and ledger. At the next preparation with light 2 and reprimands 1, release it.

Recorded desk result: `{"anger": 3, "wraithFogNextCrossingBeforeRelease": 1, "lightAfterRelease": 0, "reprimandsAfterRelease": 0, "activeWraiths": 0, "zeroFogCrossing": "survives"}`

## Separation, returned anger and overflow | PASS

Complete-PDF pages: 3, 15, 20, 25.

Constructed states: a waiting linked Child at anger 1 with P and S gains separation only, ending anger 2. An undelivered passenger with anger 2 returns with anger 2 and adds a reprimand; it receives no waiting anger. Six retained waiting/returned souls remain six and draw none.

Recorded desk result: `{"protectedSeparatedAnger": 2, "returnedPassengerAnger": 2, "brokenPromiseReprimands": 1, "overflowKept": 6, "newSupplyDrawn": 0}`

## Quota and dismissal ordering | PASS

Complete-PDF pages: 19, 20, 23, 25.

Constructed completed cycle 3 with no new transformations/passengers: obols 1 and reprimands 2. Quota misses, keeps 1 obol, records one miss, raises reprimands to 3 and stops before recovery/refill. No release may interrupt. Affordable comparison: 3 obols automatically becomes 1. If return already reaches reprimands 3, stop before quota.

Recorded desk result: `{"unaffordable": {"obols": 1, "reprimands": 3, "missedQuotas": 1, "recovery": 0}, "affordableObolsAfter": 1, "debt": 0}`

## Fog, rock and reward boundary | PASS

Complete-PDF pages: 13, 19, 23, 24, 25.

Constructed cycle 3 rocky edge, effective fog 0 and hull 1: survive fog, lose 1 hull and end before arrival rewards. Separate light 0 / fog 1 case fails before arrival; light 1 / fog 1 survives at 0. Return is never rocky.

Recorded desk result: `{"rockyHullAfter": 0, "arrivalRewardsOnFailure": 0, "exactZero": "survives", "fogGreaterThanLight": "fails"}`

## Escalation and repair recording | PASS

Complete-PDF pages: 13, 19, 25.

Read cycles 3/5/6 thresholds on board and facilitator sheet. Construct cycle 6 ordinary Elysium with one wraith: base 0 + favored cycle modifier 0 + wraith 1 = fog 1. Haven still gets cycle +1; return gets neither cycle modifier nor rocks. Repair at haven with hull 2 and obols 1 reaches hull 3 and obols 0.

Recorded desk result: `{"cycle6Favored": "Elysium", "exampleFog": 1, "repairHullAfter": 3, "repairObolsAfter": 0}`

## Event entry snapshot and declined offer | PASS

Complete-PDF pages: 21, 22, 26, 27, 28.

Construct Tartarus entry with C02-S04 and C02-S06. Record both before unloading either, then accept E03 for 1 obol and write both full IDs in reconciled-pair ledger. Scope the canceled pressure to C02 only. Resolve a separate E02 offer declined, still checking its run flag. At haven hull 2, E04 restores hull 3 once after haven light recovery. Keep discovery annotations separate.

Recorded desk result: `{"E03": "resolved, C02 pair only", "E02": "resolved despite decline", "E04Hull": 3, "repeatEventSameRun": false}`

## Continuation and finite reserves | PASS

Complete-PDF pages: 2, 16, 31, 32, 33, 34, 35, 36.

Assign fresh C03 to the 12 continuation souls, linked/opposing references and all 16 possible memory fronts. Prepare 12 common backs. Insert fresh supply only when fixed-order refill requires it. Across the starter batch, issue at most 24 memories from 32 front alternatives; keep the unearned alternatives in reserve.

Recorded desk result: `{"nextCohort": "C03", "continuationSouls": 12, "memoryAlternatives": 16, "commonBacks": 12, "starterMaximumEarned": 24, "starterUnusedAlternatives": 8}`

## Reset and workshop end record | PASS

Complete-PDF pages: 21, 25, 28, 29, 30.

Reset all run resources, anger, statuses, visits, reconciliations, source order, memory piles and event flags. Return to setup cycle 1 with no memories. Retain discovery notes only if desired. A facilitator time stop records session stopped with observed state and separate player comments/revision ideas.

Recorded desk result: `{"runFlagsCleared": true, "memoriesAtSetup": 0, "knowledgeRetention": "optional, no mechanical effect", "timeStop": "not a victory"}`
