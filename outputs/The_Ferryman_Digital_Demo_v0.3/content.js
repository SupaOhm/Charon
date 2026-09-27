globalThis.CHARON_CONTENT = {
  "version": "0.3",
  "language": "en",
  "title": "The Ferryman: Apprentice Charon",
  "intro": "You are Charon's apprentice, carrying the dead from the waiting shore. Listen to their wishes, choose a path through the fog, and keep your promise to those you board. Each return begins another cycle. This endless journey is a fictional adaptation of underworld mythology.",
  "nodes": {
    "shore": {
      "name": "Starting Shore",
      "description": "Souls wait beside the mooring. Board passengers here. Returning completes the cycle and resolves the waiting shore's anger."
    },
    "elysium": {
      "name": "Elysium",
      "description": "Pale fields lie beyond the landing. Any passenger may disembark here. A wish for Elysium is a preference, not a judgment of worth."
    },
    "asphodel": {
      "name": "Asphodel",
      "description": "Quiet paths lead through the asphodel fields. Deliver any selected passengers, then carry the others onward."
    },
    "tartarus": {
      "name": "Tartarus",
      "description": "Stone steps descend beneath a dark gate. In this adaptation, any passenger may disembark here. You guide their passage; you do not sentence them."
    },
    "haven": {
      "name": "Haven",
      "description": "A sheltered landing offers a pause. Arrival restores 1 light, once per cycle. Hull repairs are available here. Passengers stay aboard."
    }
  },
  "souls": {
    "S01": {
      "name": "Mother",
      "flavor": "She folds a small scarf across her knees and watches for the child linked to her journey.",
      "memoryFlavor": "You remember the care with which she made room beside her."
    },
    "S02": {
      "name": "Child",
      "flavor": "The child counts the lights on the water, then looks back for their mother.",
      "memoryFlavor": "You remember a small voice counting through the dark."
    },
    "S03": {
      "name": "Merchant",
      "flavor": "The merchant closes a worn ledger. For once, the journey has no price written beside it.",
      "memoryFlavor": "You remember the ledger closing and a long breath following it."
    },
    "S04": {
      "name": "Red Soldier",
      "flavor": "A faded red strip of cloth marks the soldier's coat. An old argument returns when the opposing soldier draws near.",
      "memoryFlavor": "You remember tired hands loosening their grip on the gunwale."
    },
    "S05": {
      "name": "Poet",
      "flavor": "The poet tries a line aloud, leaving room for another voice to answer.",
      "memoryFlavor": "You remember a verse spoken softly enough for everyone to hear."
    },
    "S06": {
      "name": "Blue Soldier",
      "flavor": "The soldier smooths a blue cuff, then glances toward an old opponent. Neither seems certain how to begin.",
      "memoryFlavor": "You remember the silence before a difficult conversation."
    },
    "S07": {
      "name": "Cook",
      "flavor": "The cook describes a kitchen at dawn and the people who used to arrive hungry.",
      "memoryFlavor": "You remember a place set for someone who had not yet arrived."
    },
    "S08": {
      "name": "Mason",
      "flavor": "The mason studies the landing stones, noticing the careful work beneath their worn edges.",
      "memoryFlavor": "You remember patient hands checking that a stone would hold."
    },
    "S09": {
      "name": "Messenger",
      "flavor": "The messenger carries words meant for someone else and repeats them quietly against the sound of the water.",
      "memoryFlavor": "You remember a message held carefully in a human voice."
    },
    "S10": {
      "name": "Keeper",
      "flavor": "The keeper watches the lantern with the practiced attention of someone used to a long vigil.",
      "memoryFlavor": "You remember someone staying awake while the world grew quiet."
    },
    "S11": {
      "name": "Musician",
      "flavor": "The musician taps a quiet rhythm and waits for the listener who knows its pauses.",
      "memoryFlavor": "You remember a tune with space left for another person."
    },
    "S12": {
      "name": "Listener",
      "flavor": "The listener follows a familiar rhythm with one finger, attentive even between the notes.",
      "memoryFlavor": "You remember how much care there can be in listening."
    }
  },
  "memories": {
    "R01": {
      "name": "Steadiness",
      "description": "2 protection against fog for the upcoming crossing."
    },
    "R02": {
      "name": "Vigil",
      "description": "1 protection against fog for the upcoming crossing. Increase to 3 protection if any aboard soul uses two seats."
    },
    "R03": {
      "name": "Recollection",
      "description": "1 protection against fog for the upcoming crossing. Optionally mark one waiting starting-shore soul to prevent its normal anger increase at this cycle's return. You may mark it from any stop. Separation anger still applies."
    },
    "R04": {
      "name": "Accord",
      "description": "1 protection against fog for the upcoming crossing. Cancel all same-cohort Red Soldier and Blue Soldier conflicts for that crossing."
    },
    "R05": {
      "name": "Joined Memory",
      "description": "2 protection against fog for the upcoming crossing. Optionally mark one waiting starting-shore soul to prevent its normal anger increase at this cycle's return. You may mark it from any stop. Separation anger still applies."
    },
    "R06": {
      "name": "Faint Memory",
      "description": "1 protection against fog for the upcoming crossing."
    }
  },
  "events": {
    "E01": {
      "title": "Shared Farewell",
      "body": "At the landing, two companions turn toward each other before stepping ashore. For a moment, the farewell feels less lonely.",
      "condition": "Arrive at Elysium and deliver at least one matching linked pair together in the same delivery action at this arrival. Triggers at most once per run.",
      "effect": "Gain 1 light, up to the light cap. This happens automatically after normal delivery rewards.",
      "acceptLabel": "",
      "declineLabel": ""
    },
    "E02": {
      "title": "Unfinished Message",
      "body": "At Asphodel, a message finds someone willing to carry it farther. There is a chance to put one unfinished matter to rest.",
      "condition": "Arrive at Asphodel with a Messenger still aboard or delivered at this arrival. Triggers at most once per run, even if you decline.",
      "effect": "Optionally pay 1 obol to reduce reprimands by 1, to a minimum of zero. Accepting requires an obol and at least one reprimand. Declining has no effect.",
      "acceptLabel": "Pay 1 obol",
      "declineLabel": "Decline"
    },
    "E03": {
      "title": "Old Feud",
      "body": "Before the gate, the two soldiers pause. Their argument has outlasted their lives. You can offer a moment in which to leave it behind.",
      "condition": "Arrive at Tartarus with both opposing soldiers from the same cohort aboard on entry. Delivering either soldier here does not prevent the trigger. Triggers at most once per run, even if you decline.",
      "effect": "Optionally pay 1 obol to reconcile this pair for the rest of the run. Remove only this pair's conflict pressure. Accepting requires an obol. Declining has no effect.",
      "acceptLabel": "Pay 1 obol",
      "declineLabel": "Decline"
    },
    "E04": {
      "title": "The Broken Landing",
      "body": "Beside the haven's weathered landing, a loose plank can be fitted to the damaged boat.",
      "condition": "Arrive at the haven with hull below 3. Triggers at most once per run.",
      "effect": "Gain 1 hull, up to hull 3. This happens automatically after the haven's normal light recovery.",
      "acceptLabel": "",
      "declineLabel": ""
    }
  },
  "ui": {
    "board": "Board",
    "unboard": "Unboard",
    "depart": "Depart",
    "deliver": "Deliver selected",
    "deliverNone": "Continue without delivery",
    "calm": "Calm",
    "release": "Release wraith",
    "repair": "Repair",
    "playMemory": "Play memory",
    "newRun": "New run",
    "resume": "Resume",
    "exportRun": "Export run",
    "clearDiscoveries": "Clear discoveries"
  },
  "help": {
    "crossing": "A crossing is one edge between stops. Check its final fog damage and separate hull damage before departing. Survive both before receiving arrival rewards.",
    "cycle": "A cycle begins at the starting shore and ends when you return there. Visit at least one destination before returning. Each destination and the haven may be visited at most once in a cycle. The run continues through new cycles until failure.",
    "anger": "Anger increases only on return to the starting shore. Souls left waiting at departure gain 1 normal anger if still waiting and unprotected. A waiting linked partner marked by separation gains 1 additional anger. At 3 anger or more, a soul becomes a wraith and adds 1 reprimand. New refill souls get no anger for the finished cycle.",
    "light": "Start with 2 light; the cap is 6. Fog damage greater than your light ends the run before arrival. Otherwise subtract the damage. Exactly zero light survives. Protection reduces fog damage; it does not restore light. Arrival rewards cannot rescue a failed crossing.",
    "calming": "At the starting shore, pay 1 obol to protect one waiting soul from normal anger at the imminent return. Calm at most once before leaving that shore. This does not remove anger or prevent separation anger. An already protected soul cannot be calmed. Protection expires at cycle end, even if unused. Boarding the soul later does not refund the obol.",
    "wishes": "Any passenger may be delivered to any destination. Matching a preferred destination grants 1 extra light per delivered soul, subject to the light cap. A mismatch has no penalty and still fulfills the delivery promise.",
    "quota": "After every third completed cycle, pay 2 obols automatically if you can. Otherwise keep your coins, record a missed quota and gain 1 reprimand, with no debt. Quotas continue throughout the run. Return anger and broken promises are resolved first; dismissal stops later quota payment and recovery.",
    "memory": "Each delivered soul grants one memory. New memories enter the bottom of the draw pile in cohort and soul-ID order. After arrival rewards and events, draw to a hand of three once per stop. Keep unplayed cards. When the draw pile empties, shuffle the discard pile for reuse. Play at most one memory before the next crossing, for no resource cost, then discard it. Playing does not let you draw again at that stop. A played card cannot be redrawn there. The allowance resets after a successful crossing and does not accumulate.",
    "discovery": "Arrival events have hidden conditions. Reveal an event's condition and effect when encountered, even if an offered action is declined. Each event can trigger once per run. An explicitly opened spoiler reference can show all entries from the start. Optional saved discovery annotations are knowledge only; they grant no mechanical bonus. New runs reset event triggers.",
    "boarding": "Board only at the starting shore, within four seats. Some souls use two seats. You may change the boarding selection before departure. Paid actions and played memories are not refunded by changing that selection. Empty departures are legal. Boarding does not refill the shore.",
    "promises": "Taking a soul away from the starting shore commits you to delivering it to any destination before returning. Declining passage is not a broken promise, though waiting anger may rise at return. Each passenger brought back undelivered adds 1 reprimand and returns to the shore with existing anger, without waiting anger for that cycle. Missing a wish adds no reprimand or anger by itself.",
    "delivery": "At each destination, confirm one complete delivery selection, even if it is empty. The selected souls disembark together; the rest stay aboard. Each delivered soul grants its printed reward and one memory, plus a wish bonus if matched. A flame grants 1 light; a coin grants 1 obol. No one boards or disembarks at the haven, and delivered souls cannot reboard.",
    "pairs": "Mother and Child, or Musician and Listener, earn Joined Memory instead of Faint Memory only if matching cohort partners disembark together in the same action. Each still grants one memory. Delivering them separately grants Faint Memory, with no later replacement. Repeated role labels in later cohorts represent different people; links and soldier conflicts stay within a cohort.",
    "passengerEffects": "Each aboard Poet protects against 1 fog damage when at least two other souls are aboard. A Keeper protects against 1 fog damage when the only soul aboard. Each opposing Red Soldier and Blue Soldier pair from the same cohort adds 1 fog damage unless its conflict is canceled. Count souls, not occupied seats, for the Poet and Keeper.",
    "memoryTargets": "Recollection and Joined Memory may protect one waiting starting-shore soul from normal anger, even when played at another stop. Their crossing protection works without a target. Normal-anger protection does not stack or cancel separation anger, and expires at this cycle's return. A memory need not help on a crossing that already has zero fog damage.",
    "wraiths": "Each active wraith adds 1 to fog danger on every edge, including the return. Wraiths formed at return affect the next crossing. At any stop during preparation, voluntarily pay 2 light to release one. Remove it immediately and reduce reprimands by 1, to a minimum of zero. Repeat if affordable. Spending down to zero light is legal; an ended run cannot be rescued.",
    "hull": "Start with hull 3 of 3. Rocky edges cause 1 hull damage after fog is survived. Hull at zero ends the run before arrival rewards. At the starting shore or haven, pay 1 obol to restore 1 hull. Repeat up to hull 3 while affordable. Full hull cannot be repaired.",
    "recovery": "Arriving at the haven restores 1 light, once per cycle. Completing a cycle restores 1 light only after all return failure checks are survived. Both respect the light cap. Remaining at a stop or reloading a save grants no extra recovery.",
    "returnOrder": "Survive the return edge first. Count the completed cycle, then resolve waiting anger, separation and wraith formation. Return undelivered passengers and add their reprimands. Check dismissal. If still in play, settle any due quota and check dismissal again. No optional action can interrupt these checks. Then clear cycle marks, recover 1 light, begin the next cycle, refill toward five and draw memories once.",
    "supply": "Begin with five waiting souls from the fixed twelve-template sequence. Refill toward five only after a completed return has been resolved. Waiting souls keep their anger; new arrivals start at zero. Returned passengers may take the shore above five. Keep them all and draw only when below five. Each new cohort uses fresh IDs and represents different deceased people.",
    "routes": "From the starting shore, choose Elysium, Asphodel or Tartarus. From a destination, choose an unvisited destination, the unvisited haven or the starting shore. From the haven, choose an unvisited destination or the starting shore. The final fog preview covers only the upcoming edge. Return edges have zero base fog and no cycle fog modifier, but wraiths and passenger effects still count. There are no destination tolls or Tartarus service payments.",
    "escalation": "Cycles 1 and 2 use ordinary routes. From cycle 3, non-return edges also offer a rocky variant: reduce base fog by 1, to a minimum of zero, then risk 1 hull damage. Return edges are never rocky. From cycle 5, add 1 fog to non-return edges, including the haven. From cycle 6, one destination ignores that extra fog: Elysium on cycle 6, then Asphodel, then Tartarus, repeating each cycle. These route modifiers do not keep rising.",
    "failure": "The run ends when fog damage exceeds available light, hull reaches zero, or reprimands reach 3. Later rewards, repairs and releases cannot undo an ended run. Completing a cycle or exhausting one cohort is not a victory condition.",
    "saving": "Save and resume preserves this run. New run resets its resources, souls, memories and event triggers. No resources or unlocks carry over. The optional discovery reference is separate. Clear discoveries removes remembered event annotations; it does not start a new run or reset that run's event triggers."
  },
  "endings": {
    "fog": {
      "title": "The lantern cannot sustain the crossing",
      "body": "Fog damage exceeded the available light. The run ended before arrival. No rewards from that arrival were received."
    },
    "sinking": {
      "title": "The boat sinks",
      "body": "The hull reached zero. The run ended before arrival. No rewards from that arrival were received."
    },
    "dismissal": {
      "title": "The apprenticeship ends",
      "body": "Reprimands reached 3. Charon ended the apprenticeship during the return checks. The run ended before cycle recovery."
    }
  },
  "tutorial": [
    {
      "id": "T01",
      "title": "Carry and guide",
      "body": "You are Charon's apprentice. Any destination accepts any passenger. Your duty is to deliver each soul you take from the starting shore before you return."
    },
    {
      "id": "T02",
      "title": "Choose passengers",
      "body": "Check the four seats, each soul's wish and any matching cohort partner. Boarding can be changed before departure. Souls left waiting gain anger only when the cycle returns."
    },
    {
      "id": "T03",
      "title": "Read the crossing",
      "body": "Choose a reachable stop. Read the final fog damage and any separate hull damage. A memory can protect this crossing for free, at most once before departure. Exactly zero light survives, but zero hull does not. Arrival rewards come only after survival."
    },
    {
      "id": "T04",
      "title": "Choose who steps ashore",
      "body": "At a destination, confirm all souls to deliver together, or explicitly continue without delivery. Others stay aboard for a later destination. A matched wish adds light; a mismatch has no penalty."
    },
    {
      "id": "T05",
      "title": "Prepare at the next stop",
      "body": "After rewards and any revealed events, draw memories to three once. Unplayed cards stay in hand. Repair at the haven or starting shore. During preparation at any stop, you may spend 2 light to release a wraith and reduce reprimands by 1, to a minimum of zero."
    },
    {
      "id": "T06",
      "title": "Plan the return",
      "body": "Check the return forecast. Waiting anger, separation and undelivered passengers can add reprimands. Reprimands at 3 end the run. Every third completed cycle also settles a 2-obol quota. These checks finish before recovery or another action."
    },
    {
      "id": "T07",
      "title": "Begin another cycle",
      "body": "If the return checks are survived, recover 1 light and refill the shore toward five. New arrivals get no anger for the past cycle. There is no final cycle. Resume continues this run; New run starts fresh. The optional event-knowledge reference is managed separately."
    }
  ]
};
