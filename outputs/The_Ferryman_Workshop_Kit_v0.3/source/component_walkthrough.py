"""Repeat the bounded agent desk walkthrough against the generated PDF text.
This is component coverage and hand arithmetic, not a gameplay engine/playtest.
"""
from pathlib import Path
import json, hashlib
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'source/components.json').read_text())
pages=[p.extract_text() for p in PdfReader(ROOT/'Print_and_Play_Workshop_v0.3.pdf').pages]
souls={s['id']:s for s in D['souls']}
checks=[]
def record(name,refs,anchors,action,result,valid):
    text=' '.join(' '.join(pages[n-1].split()) for n in refs)
    assert valid,name+' arithmetic/data'
    for a in anchors: assert a in text,(name,'missing recording field or rule',a)
    checks.append({'name':name,'masterPages':refs,'action':action,'recordedResult':result,'status':'PASS'})

record('Setup',[3,19,24],['C01-S01','Completed cycles:','Start cycle 1','Mark setup draw completed'],
 'Place C01-S01 through S05 waiting, each anger 0. Record cycle 1, completed 0, next quota 3. Mark the empty setup draw done.',
 {'light':2,'obols':2,'hull':3,'reprimands':0,'waiting':5,'memories':0},
 D['resources']=={'light_start':2,'light_max':6,'obols_start':2,'hull_start':3,'hull_max':3,'reprimands_start':0,'dismissal_at':3,'seats':4})
record('Two-seat boarding and shore preparation',[14,18,20,24],['2ND SEAT','Same soul as seat:','Soul ID','already protected target'],
 'Put Mother in seat 1, her extra-capacity marker in seat 2 labeled 1, Child in seat 3, Merchant in seat 4. Calm waiting Red Soldier for 1 obol. Capture waiting Red Soldier/Poet IDs on confirmed departure. Neither waiting soul has a departing linked partner.',
 {'seatsUsed':4,'obolsAfterCalm':1,'W':['C01-S04','C01-S05'],'S':[],'P':['C01-S04']},
 sum(souls[s]['seats'] for s in ['S01','S02','S03'])==4 and 2-D['actions']['calm']['obols']==1)
record('First crossing and joint delivery',[6,13,19,22,26],['Final fog (min 0):','Aboard on entry','Delivered together','Shared Farewell'],
 'Choose shore to Elysium, ordinary. Final fog 0. Record entry IDs S01/S02/S03 from C01, then deliver Mother and Child together. Issue their two Joined fronts with source IDs and destination Elysium; keep both Faint options in reserve. Resolve E01, then draw both earned cards.',
 {'fog':0,'lightAfterRewardsAndEvent':6,'obols':1,'aboard':['C01-S03'],'earnedMemories':2,'E01':'resolved','hand':2},
 D['nodes'][1]['base_fog']==0 and min(6,2+2+2+1)==6)
record('Free memory, remote protection and second delivery',[6,13,16,19,22,24],['Target from any stop','RESERVE','Memory played this crossing','cohort / soul-ID order'],
 'At Elysium play Mother Joined for free, mark waiting Poet P remotely, discard the card and do not redraw here. Cross to Tartarus with Merchant: max(0,2-2)=0. Deliver Merchant, issue Vigil with source C01-S03 and destination Tartarus. Draw Vigil, then recycle the earlier discarded Joined to reach three cards at this new stop.',
 {'fog':0,'light':6,'obols':2,'earnedMemories':3,'hand':3,'draw':0,'discard':0,'P':['C01-S04','C01-S05']},
 max(0,2-2)==0 and D['actions']['memory']['cost']==0 and 1+souls['S03']['reward']['amount']==2)
record('Successful return and refill',[19,20,25],['No waiting anger for returned passengers','New wraiths affect the next crossing','Refill toward five'],
 'Return empty from Tartarus with no active wraiths. Final fog 0. Increment completed cycles to 1. Both W souls have P and no S, so remain anger 0. No broken promises or quota. Clear marks, recover light to cap, advance to cycle 2, reset visits, refill with S06/S07/S08. Existing hand remains three.',
 {'completedCycles':1,'cycle':2,'nextQuota':3,'light':6,'obols':2,'hull':3,'reprimands':0,'waitingIDs':['C01-S04','C01-S05','C01-S06','C01-S07','C01-S08'],'hand':3},
 1%D['cycle']['quota_every']!=0 and 2+3==D['cycle']['refill_toward'])
record('Wraith formation and immediate release',[15,19,20,21,25],['ACTIVE WRAITHS','Source soul ID','Release cycle','even down to zero light'],
 'Separate constructed checkpoint: C02-S09 is a W soul at anger 2 without P/S. On a surviving return its anger becomes 3, form a wraith and add one reprimand. Keep its source card/ID in the wraith area and ledger. At the next preparation with light 2 and reprimands 1, release it.',
 {'anger':3,'wraithFogNextCrossingBeforeRelease':1,'lightAfterRelease':0,'reprimandsAfterRelease':0,'activeWraiths':0,'zeroFogCrossing':'survives'},
 2+D['cycle']['normal_anger']==D['cycle']['wraith_at_anger'] and 2-D['actions']['release']['light']==0)
record('Separation, returned anger and overflow',[3,15,20,25],['P prevents normal anger, not S','Keep overflow','existing anger'],
 'Constructed states: a waiting linked Child at anger 1 with P and S gains separation only, ending anger 2. An undelivered passenger with anger 2 returns with anger 2 and adds a reprimand; it receives no waiting anger. Six retained waiting/returned souls remain six and draw none.',
 {'protectedSeparatedAnger':2,'returnedPassengerAnger':2,'brokenPromiseReprimands':1,'overflowKept':6,'newSupplyDrawn':0},
 1+0+D['cycle']['separation_anger']==2 and max(0,D['cycle']['refill_toward']-6)==0)
record('Quota and dismissal ordering',[19,20,23,25],['automatically pay 2 obols if affordable','Check dismissal again','No optional actions'],
 'Constructed completed cycle 3 with no new transformations/passengers: obols 1 and reprimands 2. Quota misses, keeps 1 obol, records one miss, raises reprimands to 3 and stops before recovery/refill. No release may interrupt. Affordable comparison: 3 obols automatically becomes 1. If return already reaches reprimands 3, stop before quota.',
 {'unaffordable':{'obols':1,'reprimands':3,'missedQuotas':1,'recovery':0},'affordableObolsAfter':1,'debt':0},
 3%D['cycle']['quota_every']==0 and 3-D['cycle']['quota_obols']==1)
record('Fog, rock and reward boundary',[13,19,23,24,25],['Separate hull damage','Hull 0 ends the run before rewards','Exactly zero'],
 'Constructed cycle 3 rocky edge, effective fog 0 and hull 1: survive fog, lose 1 hull and end before arrival rewards. Separate light 0 / fog 1 case fails before arrival; light 1 / fog 1 survives at 0. Return is never rocky.',
 {'rockyHullAfter':0,'arrivalRewardsOnFailure':0,'exactZero':'survives','fogGreaterThanLight':'fails'},
 1-D['cycle']['rocky_hull_damage']==0 and max(0,1-D['cycle']['rocky_base_reduction'])==0)
record('Escalation and repair recording',[13,19,25],['Favored destination this cycle','including haven','ignores only the +1 cycle modifier','repeat to hull 3'],
 'Read cycles 3/5/6 thresholds on board and facilitator sheet. Construct cycle 6 ordinary Elysium with one wraith: base 0 + favored cycle modifier 0 + wraith 1 = fog 1. Haven still gets cycle +1; return gets neither cycle modifier nor rocks. Repair at haven with hull 2 and obols 1 reaches hull 3 and obols 0.',
 {'cycle6Favored':'Elysium','exampleFog':1,'repairHullAfter':3,'repairObolsAfter':0},
 (D['cycle']['rocky_from'],D['cycle']['modifier_from'],D['cycle']['favor_from'])==(3,5,6) and D['cycle']['favor_order'][0]=='elysium')
record('Event entry snapshot and declined offer',[21,22,26,27,28],['Aboard on entry','even if either disembarked','Automatic / accepted / declined','grants no resources'],
 'Construct Tartarus entry with C02-S04 and C02-S06. Record both before unloading either, then accept E03 for 1 obol and write both full IDs in reconciled-pair ledger. Scope the canceled pressure to C02 only. Resolve a separate E02 offer declined, still checking its run flag. At haven hull 2, E04 restores hull 3 once after haven light recovery. Keep discovery annotations separate.',
 {'E03':'resolved, C02 pair only','E02':'resolved despite decline','E04Hull':3,'repeatEventSameRun':False},
 len(D['events'])==4 and 2+1==D['resources']['hull_max'])
record('Continuation and finite reserves',[2,16,31,32,33,34,35,36],['C____-S01','C____-S12','M-C____-S01-R05','12 IDENTICAL BACKS','Never reuse'],
 'Assign fresh C03 to the 12 continuation souls, linked/opposing references and all 16 possible memory fronts. Prepare 12 common backs. Insert fresh supply only when fixed-order refill requires it. Across the starter batch, issue at most 24 memories from 32 front alternatives; keep the unearned alternatives in reserve.',
 {'nextCohort':'C03','continuationSouls':12,'memoryAlternatives':16,'commonBacks':12,'starterMaximumEarned':24,'starterUnusedAlternatives':8},
 len(D['soul_instances'])==24 and len(D['memory_instances'])-24==8)
record('Reset and workshop end record',[21,25,28,29,30],['RESET','session stopped','Player comments','event trigger flags'],
 'Reset all run resources, anger, statuses, visits, reconciliations, source order, memory piles and event flags. Return to setup cycle 1 with no memories. Retain discovery notes only if desired. A facilitator time stop records session stopped with observed state and separate player comments/revision ideas.',
 {'runFlagsCleared':True,'memoriesAtSetup':0,'knowledgeRetention':'optional, no mechanical effect','timeStop':'not a victory'},True)

result={'kind':'Agent component/rules desk walkthrough','date':'2026-09-27','notHumanPlaytest':True,
 'notBrowserEngineTest':True,'physicalManipulation':'NOT_RUN','pdfSha256':hashlib.sha256((ROOT/'Print_and_Play_Workshop_v0.3.pdf').read_bytes()).hexdigest(),
 'passed':len(checks),'failed':0,'steps':checks}
(ROOT/'validation/component_walkthrough.json').write_text(json.dumps(result,indent=2)+'\n')
md=['# Agent component/rules walkthrough','',
 'Executed September 27, 2026 against the generated selectable PDF text and component data. The first five steps form one desk sequence. Later steps use separate constructed states, not a claimed continuous run. Each step checks named recording fields and arithmetic. This is not a human playtest, browser-engine test or physical manipulation trial.','']
for r in checks:
    md += ['## '+r['name']+' | '+r['status'],'','Complete-PDF pages: '+', '.join(map(str,r['masterPages']))+'.','',r['action'],'',
           'Recorded desk result: `'+json.dumps(r['recordedResult'],ensure_ascii=False)+'`','']
(ROOT/'validation/COMPONENT_WALKTHROUGH.md').write_text('\n'.join(md))
print(json.dumps({'walkthroughChecksPassed':len(checks),'failed':0}))
