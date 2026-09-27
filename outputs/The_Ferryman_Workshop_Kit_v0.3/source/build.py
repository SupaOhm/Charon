"""Rebuild all workshop PDFs from components.json and local assets.
Usage: python source/build.py. Requires the already available reportlab, Pillow and pypdf.
"""
from pathlib import Path
import json, math
from copy import deepcopy
from pypdf import PdfReader, PdfWriter
from drawing import Sheet, card_positions, panel, ROOT, INK, BRONZE, PALE, ALERT, LINE

D=json.loads((ROOT/'source/components.json').read_text())
SOULS={s['id']:s for s in D['souls']}; MEM={m['id']:m for m in D['memories']}
NODES={n['id']:n for n in D['nodes']}; LOGS=[]; SECTIONS=[]

def start(name,title):
    path=ROOT/'print'/f'{name}.pdf'; SECTIONS.append({'name':name,'title':title,'file':str(path.relative_to(ROOT))})
    return Sheet(path,name,LOGS)

def soul_card(p,x,y,s):
    p.card(x,y); tid=s.get('template',s['id'])
    p.text(x+3,y+3,s['name'],12,bold=True); p.text(x+3,y+9.7,s['id'],10,bold=True)
    p.image(tid,x+3,y+17,19,28.5)
    p.text(x+25,y+17,f'Seats: {s["seats"]}',10.5,bold=True)
    p.text(x+25,y+24,'Reward',10)
    p.text(x+25,y+29,'Flame: 1 light' if s['reward']['type']=='flame' else 'Coin: 1 obol',10)
    p.text(x+25,y+36,'Wish (+1 light)',10)
    p.text(x+25,y+41,NODES[s['wish']]['name'],10,bold=True)
    opts=s['memory_options']
    memory='Faint / Joined*' if len(opts)>1 else MEM[opts[0]]['name']
    p.text(x+3,y+49,'Memory: '+memory,10,bold=True)
    if s['partner']: note='Link: '+s['partner']+' | *see reference'
    elif s['opponent']: note='Opposes '+s['opponent']+'. +1 fog together unless canceled.'
    else: note=s['protection'] or 'Any destination accepts this soul.'
    p.para(x+3,y+55.5,57,note,size=10,maxh=11.5)
    p.text(x+3,y+69,'Anger',10,bold=True)
    for j,label in enumerate(['0','1','2','3+']):
        xx=x+24+j*9
        p.box(xx,y+68,8,7,fill='#ffffff',radius=1)
        p.text(xx+1.2,y+69,label,10)
    for xx,label in [(x+3,'W'),(x+23,'S'),(x+43,'P')]:
        p.box(xx,y+78,17,6,fill='#ffffff',radius=.5); p.text(xx+2,y+78.7,label+' [ ]',10)
    p.end_card()

def memory_card(p,x,y,instance):
    m=MEM[instance['template']]; p.card(x,y)
    p.text(x+3,y+3,m['name'],12,bold=True)
    p.text(x+3,y+10,m['id']+' | upcoming crossing',10)
    p.text(x+3,y+17,instance['source_name'],10.5,bold=True)
    p.text(x+3,y+22,instance['source_id'],10)
    p.icon(m['id'],x+50,y+17,10)
    p.text(x+3,y+28,'To: __________________',10)
    p.para(x+3,y+35,57,m['description'],size=10.5,maxh=28)
    if instance['alternative']: p.text(x+3,y+65,'Earn only one alternative.',10)
    p.text(x+3,y+71,instance['id'],10)
    p.text(x+3,y+79,'FREE | 1 per crossing',10,bold=True)
    p.end_card()

def back(p,x,y,kind='MEMORY'):
    p.card(x,y)
    p.text(x+3,y+5,kind,13,bold=True)
    if kind=='MEMORY': p.image('memoryBack',x+14.5,y+23,34,51)
    else:
        p.box(x+8,y+26,47,39,fill=PALE,stroke=BRONZE)
        p.para(x+12,y+31,39,'Keep the face hidden until its condition is met. A facilitator checks the trigger.',size=11,maxh=32)
    p.text(x+3,y+79,'v0.3 | shared reverse',10)
    p.end_card()

def cards(p,items,title,draw):
    for i in range(0,len(items),9):
        p.new(title,cards=True)
        for (x,y),item in zip(card_positions(),items[i:i+9]): draw(p,x,y,item)

def track(p,x,y,title,icon_key,count,start_value):
    p.icon(icon_key,x,y,10); p.text(x+14,y+1,title,12,bold=True)
    p.text(x+14,y+7,f'Start: {start_value}',10)
    for i in range(count+1):
        xx=x+62+i*17
        p.box(xx,y,14,13,fill='#ffffff'); p.text(xx+4,y+3,str(i),12,bold=True)

def lines(p,x,y,w,n=3,spacing=9):
    for i in range(n): p.line(x,y+i*spacing,x+w,y+i*spacing)

def guide():
    p=start('01_Print_Guide','Print and assembly guide')
    p.new('THE FERRYMAN','One facilitated station | English | A4 | single-sided assembly')
    p.text(12,41,'Carry. Remember. Return.',23,bold=True)
    p.para(12,57,116,'A complete physical workshop kit for the decided v0.3 rules. You are an apprentice carrier and guide. Any destination accepts any passenger.',size=12,maxh=28)
    p.image('apprentice',151,38,41,61.5); p.image('boat',12,91,120,54)
    p.image('lightToken',157,110,30,30)
    p.text(12,153,'Print plan',15,bold=True)
    rows=[('01','Print guide','1-2'),('02','24 soul cards','3-5'),('03','32 memory fronts + 24 backs','6-12'),
          ('04','Route board + 3 play mats','13-16'),('05','Obols + status markers','17-18'),
          ('06','Resources + facilitator trackers','19-22'),('07','Player + facilitator references','23-25'),
          ('08','Event reveals + spoiler reference','26-28'),('09','Observation + feedback forms','29-30'),
          ('10','Repeatable continuation sheets','31-36')]
    for i,(num,title,ran) in enumerate(rows):
        yy=165+i*7.1; p.text(12,yy,num,10,bold=True); p.text(25,yy,title,10.5); p.text(171,yy,ran,10.5)
    p.para(12,242,183,'Print pages 1-30 for the starter station. Pages 31-36 are a reusable next-cohort batch. Finite paper and token quantities do not limit the endless rules. Full kit: 36 A4 pages.',size=11,maxh=21)
    p.para(12,266,183,'Prototype: physical printing, handling and human playtesting remain NOT_RUN. Rules and numerical defaults have not been balanced by this kit.',size=10,maxh=11)
    p.new('Print, cut and assemble','Printing choices do not add rules. Keep the event faces and spoiler sheet with the facilitator.')
    body=[('1 | Check scale','Use A4, actual size / 100%, single-sided. Turn off Fit, Shrink and borderless scaling. Measure the 50 mm line before cutting. Margins are at least 10 mm. Cards are 63 x 88 mm with 3 mm text safety.'),
          ('2 | Prepare the station','Use paper or light card, scissors or a ruler/cutter, pencils, erasers and optional identical opaque sleeves. Place the route board, boat, shore/storage and memory mats on a table. Place resources and reference sheets nearby.'),
          ('3 | Cut and sort','Cut on the fine card/token outlines. Soul cards are public and need no back. Sort C01-S01 through C01-S12, then C02-S01 through C02-S12. Keep further blank-cohort cards aside until assigned fresh IDs.'),
          ('4 | Assemble memory cards','There are 32 starter fronts but at most 24 earned memories from 24 souls. Select only the earned Faint/Joined alternative per linked soul. Put its front with one identical printed memory back in an opaque sleeve, or glue onto equal opaque stock. Keep all fronts, thickness and reverse orientation alike.'),
          ('5 | Keep reserves separate','Keep unearned memories and unused alternatives in RESERVE, never the draw/discard piles. At delivery, fill the destination and issue one memory per soul. Single-sided front + backing is sufficient. Duplex is optional and untested.'),
          ('6 | Continue and reset','Print pages 31-36 for each further 12-template cohort. Assign the same new cohort number to its souls, links, opponents and memory sources. Never reuse a delivered, waiting or active instance within the run. Add tally/log sheets whenever space runs out.'),
          ('7 | Physical check before people play','Check one 63 x 88 mm card, 50 mm calibration, safe cuts, visible rules, equal opaque memory backs, pencil erasability, grayscale symbols and table reach. Complete the checklist in VALIDATION.md. No print or rehearsal result is prefilled.')]
    yy=39
    for title,copy in body:
        p.text(12,yy,title,12,bold=True); yy+=7
        yy+=p.para(12,yy,185,copy,size=10.5,maxh=25)+6
    p.save()

def souls():
    p=start('02_Soul_Cards','Starter soul cards')
    cards(p,D['soul_instances'],'SOULS | C01 + C02 | cut 63 x 88 mm',soul_card); p.save()

def memories():
    p=start('03_Memory_Cards','Starter memories and identical backs')
    cards(p,D['memory_instances'],'MEMORY FRONTS | select only earned alternatives',memory_card)
    cards(p,list(range(24)),'24 IDENTICAL MEMORY BACKS | single-sided assembly',lambda p,x,y,_:back(p,x,y))
    p.save()

def board_and_mats():
    p=start('04_Board_and_Mats','Route board and play mats')
    p.new('Five stops, one journey','Move HERE to your current stop. Mark each intermediate stop visited; clear visited marks after a surviving return.')
    for i,node in enumerate(D['nodes']):
        col=i%3; row=i//3; x=12+col*63; y=39+row*63
        p.box(x,y,59,59,fill='#fffef9'); p.image(node['id'],x+3,y+3,53,26)
        p.text(x+3,y+31,node['name'],11,bold=True); p.text(x+3,y+38,f'Base fog: {node["base_fog"]}',10)
        p.icon('node_'+node['id'],x+48,y+39,7)
        p.text(x+3,y+45,'HERE [ ]',10)
        if node['id']!='shore': p.text(x+3,y+51,'Visited [ ]',10)
    p.para(142,105,55,'A crossing = one edge.\n<br/><br/>A cycle ends on return to the starting shore. Visit at least one destination first.',size=10.5,maxh=50)
    p.text(12,172,'Directed travel: read FROM row to TO column',12,bold=True)
    labels=['Shore','Elysium','Asphodel','Tartarus','Haven']; keys=[n['id'] for n in D['nodes']]
    xcols=[12,51,81,111,142,172]; widths=[38,29,29,30,29,27]
    for j,(x,w) in enumerate(zip(xcols,widths)): p.box(x,182,w,10); p.text(x+1,184,'FROM / TO' if j==0 else labels[j-1],10,bold=True)
    for i,key in enumerate(keys):
        y=192+i*10
        for j,(x,w) in enumerate(zip(xcols,widths)):
            p.box(x,y,w,10,fill='#ffffff'); p.text(x+2,y+2,labels[i] if j==0 else ('GO' if keys[j-1] in D['edges'][key] else '-'),10)
    p.para(12,248,184,'GO is legal only if that intermediate stop is unvisited. A return finishes the cycle. No self-loops, shore-to-haven edge or boarding away from shore. Use the resource sheet to calculate final fog; these node values are only base fog.',size=11,maxh=25)
    p.para(12,272,184,'Later cycles: 3+ rocky choices; 5+ non-return fog +1; 6+ favor Elysium, Asphodel, Tartarus in rotation. Full modifiers: facilitator return sheet.',size=10,maxh=10)
    p.new('Boat mat | four seats','A two-seat soul uses one card plus a 2ND SEAT marker in any other slot. Write the first slot number beside it.')
    for i in range(4):
        x=28+(i%2)*78; y=49+(i//2)*104
        p.text(x,y-8,f'SEAT {i+1}',12,bold=True)
        p.box(x,y,63,88,fill='#fffef9')
        p.para(x+5,y+19,53,'Place one soul card here.<br/><br/>Or use a 2ND SEAT marker.<br/><br/>Same soul as seat: ____',size=11,maxh=60)
    p.para(12,252,184,'Capacity is four occupied slots, not four soul cards. The extra slot can be anywhere; adjacency has no rule effect. Loading is reversible before shore departure. Passengers cannot be unloaded at the haven.',size=11,maxh=23)
    p.new('Waiting shore & storage','Extend all areas onto the table as needed. Five is a refill target, never a waiting-soul limit.')
    p.box(12,41,186,72,fill='#fffef9'); p.text(17,46,'WAITING SHORE + OVERFLOW',14,bold=True)
    p.para(17,58,175,'Lay waiting souls beside this mat with their anger and W / S / P markers visible. Keep all returned passengers, even when the shore exceeds five. W = waiting-at-departure snapshot. S = separated waiting partner. P = protected from normal anger.',size=11,maxh=28)
    p.para(17,94,175,'Only shore departure captures W and S. Anger changes only at return. Erase W / S / P after return processing.',size=10.5,maxh=13)
    for x,title,copy in [(12,'SOURCE QUEUE','Fixed order. C01-S01 to S12, then C02-S01 to S12, then fresh cohorts. Refill only at setup or after return.'),
                          (108,'DELIVERED SOULS','Keep delivered individuals and their destinations in the arrival record. They cannot reboard or re-enter supply in this run.')]:
        p.box(x,122,90,74); p.text(x+4,127,title,12,bold=True); p.para(x+4,140,82,copy,size=11,maxh=45)
    p.box(12,205,186,66,fill='#fffef9'); p.image('wraith',16,210,34,51)
    p.text(57,210,'ACTIVE WRAITHS',14,bold=True)
    p.para(57,222,135,'Move a transformed soul here with its source ID intact. Record that ID in the persistent ledger. Each active wraith adds 1 fog. Released wraiths leave this area immediately; record the release and keep the source card aside.',size=11,maxh=41)
    p.new('Memories in circulation','Keep source IDs and delivery destinations on faces. Every active memory uses the same opaque reverse.')
    for x,title,copy in [(10.5,'DRAW PILE','Earned memories only. Add new cards to the bottom in cohort / soul-ID order.'),
                          (73.5,'DISCARD','Played cards. Shuffle only when the draw pile is empty and a draw is needed.'),
                          (136.5,'RESERVE','Unearned fronts and unused alternatives. Never shuffle these into the run.')]:
        p.text(x+2,39,title,11,bold=True); p.box(x,48,63,88,fill='#fffef9')
        p.para(x+5,65,53,copy,size=11,maxh=55)
    p.text(12,147,'HAND | keep unplayed cards',14,bold=True)
    for x in [10.5,73.5,136.5]: p.box(x,158,63,88,fill='#fffef9')
    p.para(12,254,184,'Draw to three once per stop after rewards and events. Playing is free, at most once before the next crossing. Do not draw again at that stop or redraw the just-played card there. Discard is recycling, not deletion.',size=11,maxh=24)
    p.save()

def tokens():
    p=start('05_Tokens','Obol counters and status markers')
    p.new('Obols | cuttable counters','Denominations are printing conveniences. 12 x 1, 6 x 5 and 2 x 10 obols. Total printed value: 62 obols, not a rules cap.')
    denominations=[1]*12+[5]*6+[10]*2
    for i,n in enumerate(denominations):
        x=17+(i%5)*36; y=41+(i//5)*39
        p.box(x,y,31,31,fill='#fffef9',radius=0); p.icon('obol',x+2,y+2,9)
        p.text(x+15,y+4,str(n),18,bold=True); p.text(x+3,y+18,'obol' if n==1 else 'obols',11)
    p.image('obolToken',14,210,35,35); p.text(57,211,'Unlimited overflow tally',13,bold=True)
    p.para(57,222,138,'Write extra obols on the resource dashboard or another sheet. Exchange counter denominations freely without changing the total. Start with 2 obols. Spare counters are supply, not starting money.',size=11,maxh=25)
    p.text(12,259,'Extra tally sheet number: ______  Extra obols held: ______________',11)
    p.new('Status markers | cut rectangles','Shapes + labels carry meaning in grayscale. Printed quantities never cap the rules. Use pencil marks or reprint extras.')
    tokenset=[]
    for label,count in D['tokens']['status'].items(): tokenset += [label]*count
    for i,label in enumerate(tokenset):
        x=13+(i%8)*23.4; y=41+(i//8)*29
        p.box(x,y,20,24,fill='#fffef9',radius=0)
        key={'WAIT':'anger','SPLIT':'link','GUARD':'protection','VISIT':'node_shore','HERE':'node_haven','2ND SEAT':'seats','TRACK':'light','NORMAL':'fog','ROCKY':'rock'}.get(label)
        if key: p.icon(key,x+6,y+2,8)
        else: p.box(x+6,y+2,8,8,fill='#ffffff',radius=0)
        words=['2ND','SEAT'] if label=='2ND SEAT' else [label] if label!='BLANK' else ['____']
        for j,word in enumerate(words): p.text(x+1.5,y+12+j*4,word,10,bold=True)
    p.para(12,224,184,'WAIT / W: in the shore-departure waiting snapshot. SPLIT / S: a linked partner departed aboard. GUARD / P: prevent normal anger only. VISIT: stop already visited. HERE: current location. 2ND SEAT: occupy an extra capacity slot; write its matching slot number on the mat.',size=10.5,maxh=28)
    p.para(12,259,184,'TRACK marks light, hull or reprimands. NORMAL / ROCKY selects an edge variant. Flags and unlimited identity records live on the tracker sheets. Blank markers can replace exhausted supplies.',size=10.5,maxh=16)
    p.save()

def trackers():
    p=start('06_Trackers','Resource dashboard and facilitator ledgers')
    p.new('Resources & next crossing','Use pencil, counters or an erasable sleeve. Amounts above the light cap are lost. Zero light survives; zero hull does not.')
    track(p,12,39,'LIGHT','light',6,2); track(p,12,58,'HULL','hull',3,3); track(p,12,77,'REPRIMANDS','reprimand',3,0)
    p.text(12,98,'Obols total: ______  Counter value: ______  Overflow tally: ______',11,bold=True)
    p.text(12,109,'Current cycle: ______   Completed cycles: ______',11)
    p.text(12,119,'Next quota after completed cycle: ______  Amount: 2 obols',11)
    p.text(12,129,'Favored destination this cycle (from 6): __________________',11)
    p.box(12,141,186,67,fill='#fffef9'); p.text(16,145,'FINAL FOG PREVIEW',14,bold=True)
    p.text(16,155,'From: __________  To: __________  [ ] Ordinary  [ ] Rocky',11)
    p.text(16,165,'Base: ___  Rocky reduction: ___  Effective base (min 0): ___',10.5)
    p.text(16,175,'+ Cycle: ___ + Wraiths: ___ + Conflicts: ___',11)
    p.text(16,185,'- Passenger protection: ___ - Memory protection: ___',11)
    p.text(16,195,'Final fog (min 0): _____   Separate hull damage: _____',11,bold=True)
    p.text(12,215,'Light before: ___  After fog: ___   Hull before: ___  After rocks: ___',10.5)
    p.para(12,225,184,'If fog exceeds current light, stop before arrival. Otherwise subtract fog, then rocky hull damage. Hull 0 ends the run before rewards. There is no later rescue by rewards, release or repair.',size=10.5,maxh=16)
    p.text(12,247,'[ ] Calm used this cycle   [ ] Memory played this crossing',10.5)
    p.text(12,256,'[ ] Draw completed at this stop   [ ] Delivery/events resolved',10.5)
    p.para(12,266,184,'Clear calm at surviving cycle reset. Clear memory-play allowance only after a successful crossing. Each new stop gets one draw phase after rewards/events, even when the pile is empty.',size=10,maxh=12)
    p.new('Return ledger | waiting snapshot','Cycle: __________  Continuation sheet: __________  Copy again for any overflow. Rows are bookkeeping, never a soul cap.')
    p.para(12,38,184,'At confirmed shore departure, list waiting IDs (W). Mark S only when their matching cohort partner leaves aboard. P prevents normal anger, not S. Update P if a memory marks this soul later.',size=10.5,maxh=17)
    columns=[('Soul ID',40),('Before',19),('S?',13),('P?',13),('+normal',24),('+split',21),('After',20),('Wraith?',36)]
    x=12
    for name,w in columns: p.box(x,62,w,10); p.text(x+1,64,name,10,bold=True); x+=w
    for i in range(9):
        x=12; y=72+i*11
        for name,w in columns: p.box(x,y,w,11,fill='#ffffff',radius=0); x+=w
    p.para(12,178,184,'At return, a listed soul still waiting gains +1 normal anger unless P, plus +1 if S. At 3 or more: move its card to active wraiths and add 1 reprimand. New wraiths affect the next crossing, not this return.',size=10.5,maxh=19)
    p.text(12,204,'Undelivered passengers returned (IDs / existing anger)',12,bold=True)
    lines(p,12,217,186,2,10)
    p.text(12,233,'Transformations: ___  Broken promises: ___  Reprimands now: ___',10.5)
    p.text(12,243,'Dismissed? ___  Quota due? ___  Paid / missed: ___  Reprimands: ___',10)
    p.para(12,255,184,'No waiting anger for returned passengers. Add 1 reprimand each. Check dismissal before quota, then again after quota. No optional action interrupts these checks. Only survivors clear marks, recover 1 light, refill toward five and draw once.',size=10.5,maxh=22)
    p.new('Persistent run ledger','Run ID: __________  Sheet: __________  Keep this separate from optional discovery knowledge. Continue on extra sheets.')
    p.text(12,39,'Active and released wraiths',13,bold=True)
    for i,label in enumerate(['Source soul ID','Formed cycle','Active / released','Release cycle']): p.text([12,66,106,157][i],49,label,10,bold=True)
    for i in range(6): lines(p,12,65+i*11,186,1)
    p.text(12,135,'Reconciled pairs | persist for this run only',13,bold=True)
    p.text(12,146,'Cohort       Red Soldier full ID           Blue Soldier full ID           Cycle',10)
    for i in range(3): lines(p,12,161+i*12,186,1)
    p.text(12,197,'Event resolved this run | reset all on New run',13,bold=True)
    for i,e in enumerate(D['events']):
        p.text(12,210+i*12,e['id']+' [ ] resolved   Cycle: ____   Automatic / accepted / declined: ______',10)
    p.para(12,262,184,'Count an event as resolved even when its paid offer is declined. No event repeats during this run. Retained discovery notes grant no mechanical bonus and do not change these flags.',size=10.5,maxh=15)
    p.new('Arrivals & memory awards','Run: ______  Cycle: ______  Sheet: ______  Keep entry IDs before anyone disembarks; they are needed for event checks.')
    for i in range(4):
        y=40+i*54; p.box(12,y,186,49,fill='#fffef9')
        p.text(16,y+3,f'Arrival {i+1} | stop: __________  crossing: ____',11,bold=True)
        p.text(16,y+12,'Aboard on entry (full IDs): __________________________________',10.5)
        p.text(16,y+21,'Delivered together (IDs): ____________________________________',10.5)
        p.text(16,y+30,'Rewards / wish light: __________  Memories issued: _____________',10)
        p.text(16,y+39,'Events resolved / accepted / declined: ________________________',10)
    p.para(12,261,184,'One complete delivery selection per destination, including none. Record each memory source and destination on its face. New memories go to draw-pile bottom in cohort / soul-ID order. Continue with extra records as needed.',size=10.5,maxh=17)
    p.save()

def references():
    p=start('07_References','Player and facilitator references')
    p.new('Player quick reference','Carrier and guide, not judge. Wishes are advisory. The run continues through cycles until failure.')
    rows=[('1 | Prepare at shore','Start: 2 light (cap 6), 2 obols, hull 3, 0 reprimands, no memories. Fill shore to five in fixed order. Board within four seats. Take anyone to any destination before returning.'),
          ('2 | Choose and survive','A crossing is one edge. Use unvisited stops; visit a destination before returning. Check final fog AND hull damage. Fog greater than light fails. Exactly zero light survives. Rocky damage follows fog; hull 0 fails before rewards.'),
          ('3 | Deliver, then remember','At a destination, confirm one selection, including none. Others continue aboard. Each delivered soul gives its printed reward plus 1 light for a matched wish, and one memory. A mismatch has no penalty. Haven gives 1 light and unloads nobody.'),
          ('4 | Memories are free','After rewards and events, draw to three once per stop. Keep unplayed cards. Shuffle discard when draw is empty. Play at most one before the next crossing, then discard. No second draw at that stop.'),
          ('5 | Return is the checkpoint','Only return changes anger. Waiting snapshot: +1 normal, plus +1 for separation. P blocks only normal anger. At 3+, form a wraith and add 1 reprimand. Each undelivered passenger adds 1 reprimand and returns with existing anger.'),
          ('6 | Settle and begin again','Check dismissal at 3 reprimands before quotas. Every third completed cycle, automatically pay 2 obols if affordable; otherwise keep coins and add 1 reprimand, no debt. Check dismissal again. Survivors recover 1 light, clear marks, refill toward five, then draw once.')]
    yy=38
    for title,body in rows:
        p.text(12,yy,title,12,bold=True); yy+=7; yy+=p.para(12,yy,185,body,size=10.5,maxh=23)+5
    p.para(12,240,184,'Actions: calm at shore, 1 obol, once per cycle, prevents one normal anger increase. Repair at shore/haven, 1 obol per hull to 3, repeatable. Release at any stop in preparation, 2 light per wraith, remove it and 1 reprimand (min 0), repeat if affordable.',size=10.5,maxh=22)
    p.para(12,267,184,'Linked-card *: matching partners delivered together in one action each earn Joined, otherwise Faint. No later replacement. W = waiting snapshot; S = split; P = normal-anger protection.',size=10,maxh=11)
    p.new('Facilitator | crossings & arrivals','Read the separate event trigger sheet privately. Keep unused event faces covered unless the player opens the spoiler reference.')
    sections=[
      ('Setup and identities','Reset the run ledger and event flags. Start cycle 1, completed cycles 0; next quota is after completed cycle 3. Start at 2 light, 2 obols, hull 3, 0 reprimands. All memory piles empty. Fill to five from C01-S01 onward. Mark setup draw completed even though empty.'),
      ('Shore departure','Confirm loading within four seats; empty departures are legal. Only then capture W waiting IDs and S separated partners. Boarding changes before departure do not create S or refund a paid action/card. Calming costs 1 obol once per cycle, only at shore; an already protected target is ineligible. P expires at return even if unused.'),
      ('Calculate the upcoming edge','Final fog = max(0, effective base + cycle modifier + active wraiths + opposing-pair conflicts - passenger protection - memory protection). For a rocky edge, effective base = max(0, base - 1). Check final fog against light, then subtract 1 hull for rocks. Failure stops before arrival.'),
      ('Passengers and wishes','Each same-cohort Red/Blue pair aboard adds 1 fog unless canceled. Each Poet with at least two other souls aboard gives 1 protection. A Keeper alone gives 1. Count souls, not seats. Flame reward = 1 light; coin = 1 obol; matched wish = +1 light per soul, capped at 6.'),
      ('Arrival order','Save the aboard-on-entry IDs. At a destination, choose one delivery selection, including none. Award rewards, wishes and one memory per soul. At haven, give its once-per-cycle 1 light instead. Resolve matching events E01-E04 in order, once each per run. Then draw to three once and prepare.'),
      ('Memory handling','Add new memories to draw-pile bottom in cohort / soul-ID order. Preserve hand; shuffle discard only when the draw pile empties. Play one free card, discard it, and do not draw again at that stop. Reset play allowance only after a successful crossing. Recollection/Joined can mark a waiting shore soul from any stop; marks do not stack or stop S.')]
    yy=39
    for title,body in sections:
        p.text(12,yy,title,12,bold=True); yy+=7; yy+=p.para(12,yy,185,body,size=10.5,maxh=29)+5
    facilitator_return(p)
    p.save()

def facilitator_return(p):
    p.new('Facilitator | return & reset','A failed return performs no cycle-end actions. No optional actions can interrupt the following checks.')
    steps=[
      '1. Survive the return using the wraiths already active. Return has base fog 0, no cycle modifier and no rocky variant; passenger effects and wraiths still count.',
      '2. Count the completed cycle. Resolve W waiting anger: +1 normal unless P, plus +1 if S. At anger 3+, transform, move the source card to active wraiths and add 1 reprimand per transformation.',
      '3. Return every undelivered passenger to shore, keeping its old anger and adding 1 reprimand each. These passengers gain no waiting anger for this cycle. Keep overflow. Check dismissal now; at 3 reprimands stop before quota or recovery.',
      '4. If completed cycles is divisible by 3, pay 2 obols automatically when affordable. Otherwise retain coins, mark one missed quota and add 1 reprimand, with no debt. Check dismissal again.',
      '5. Survivors clear cycle marks, recover 1 light (cap 6), increment current cycle and reset visited stops. Refill toward five only now, using fresh cohorts as needed. New souls start at zero anger and get none for the finished cycle. Draw memories to three once, then prepare.'
    ]
    yy=39
    for body in steps: yy+=p.para(12,yy,185,body,size=10.5,maxh=29)+6
    p.text(12,191,'Later cycles and repeatable care',12,bold=True)
    p.para(12,200,185,'Cycles 1-2: ordinary edges. From 3: optional rocky non-return variants, base fog -1 (min 0) and 1 hull damage. From 5: +1 fog on non-return edges, including haven. From 6: favor Elysium, then Asphodel, then Tartarus, repeating; entry to that destination ignores only the +1 cycle modifier.',size=10.5,maxh=26)
    p.para(12,229,185,'Repair at shore/haven costs 1 obol for 1 hull, repeat to hull 3. At any stop in preparation, release one wraith for 2 light and reduce reprimands by 1 (min 0); repeat if affordable, even down to zero light. No action rescues an ended run.',size=10.5,maxh=22)
    p.para(12,254,185,'RESET: separate all souls by original source order; remove W/S/P, anger, visits and reconciliations; return every memory to reserve; clear run flags and totals; restore setup values. Keep discovery notes only if desired, separate from run state. A timed workshop stop is not a victory.',size=10.5,maxh=23)

def events():
    p=start('08_Events_and_Discoveries','Events and discovery knowledge')
    items=[('event',e) for e in D['events']]+[('back',None)]*4
    def event_draw(p,x,y,item):
        kind,e=item
        if kind=='back': return back(p,x,y,'HIDDEN EVENT')
        p.card(x,y); p.text(x+3,y+3,e['title'],11.5,bold=True); p.text(x+3,y+10,e['id']+' | reveal after trigger',10)
        p.text(x+3,y+18,'CONDITION',10,bold=True); h=p.para(x+3,y+24,57,e['condition'],size=10,maxh=23)
        p.text(x+3,y+49,'EFFECT / CHOICE',10,bold=True); p.para(x+3,y+55,57,e['effect'],size=10,maxh=26)
        p.end_card()
    cards(p,items,'EVENT FACES + COVERS | FACILITATOR ONLY',event_draw)
    p.new('Event triggers | optional spoilers','Facilitator reference. Show the player only after explicit spoiler-reference access or reveal the relevant entry on discovery.')
    yy=39
    for e in D['events']:
        p.box(12,yy,186,49,fill='#fffef9'); p.text(16,yy+3,e['id']+' | '+e['title'],12,bold=True)
        h=p.para(16,yy+11,178,e['condition'],size=10.5,maxh=14)
        p.para(16,yy+27,178,e['effect'],size=10.5,maxh=19); yy+=55
    p.para(12,264,184,'Resolve in E01-E04 order after normal rewards, before memory draw. Each can trigger once per run, even if declined. Reveal its condition and effect. No hidden lethal damage. Events do not alter anger mid-cycle.',size=10,maxh=13)
    p.new('Discovery knowledge | optional','This reference is separate from active run state. Keep or clear it between runs; it grants no resources or unlocks.')
    for i,e in enumerate(D['events']):
        y=41+i*52; p.box(12,y,186,47,fill='#ffffff'); p.text(16,y+3,e['id']+' | learned / reference opened: __________',11,bold=True)
        p.text(16,y+13,'Condition learned: _________________________________________',10.5)
        p.text(16,y+24,'Effect learned: ____________________________________________',10.5)
        p.text(16,y+35,'Notes: __________________________________________________',10.5)
    p.para(12,258,184,'Resetting the run always resets its event trigger flags. Keeping these notes does not stop an event from triggering in a later run. All entries are available from the start in the explicit spoiler reference.',size=11,maxh=20)
    p.save()

def observations():
    p=start('09_Observation','Workshop observation and feedback')
    p.new('Workshop observation','Blank human-session record. No results have been prefilled. Kit: v0.3 workshop-1 | rules SHA: 459d7a8501b5')
    p.text(12,41,'Session ID: ______________  Date: __________  Facilitator: __________',10.5)
    p.text(12,54,'Start time: __________  End time: __________  Station: __________',11)
    p.text(12,68,'Completed cycles: _____  Delivered souls: _____  Memories earned: _____',10.5)
    p.text(12,80,'Wraiths formed: _____  Released: _____  Missed quotas: _____',10.5)
    p.text(12,92,'End: [ ] fog  [ ] sinking  [ ] dismissal  [ ] session stopped',11,bold=True)
    p.text(12,104,'Final light / obols / hull / reprimands: __________________________',10.5)
    for yy,title in [(121,'Observed behavior and relevant choices'),(163,'Rules questions and symbol misunderstandings'),(205,'Facilitator interventions and notable game state')]:
        p.text(12,yy,title,12,bold=True); lines(p,12,yy+15,186,3,10)
    p.para(12,256,184,'Write observations here, not inferred feelings. Keep direct player comments on the feedback sheet. Ending observation after a time limit does not create a victory condition. A rehearsal is not evidence of balance.',size=10.5,maxh=19)
    p.new('Player feedback & revision notes','Session ID: __________________  Participant label (optional): __________________')
    prompts=[('Clarity','What was clear or unclear when choosing passengers and routes?'),
             ('Responsibility','When, if at all, did the people waiting or aboard affect a decision?'),
             ('Difficult choices','Describe one choice that needed thought. What made it difficult?'),
             ('Bookkeeping','Which record, marker or repeated step felt useful or tedious?')]
    for i,(title,q) in enumerate(prompts):
        yy=41+i*42; p.text(12,yy,title,12,bold=True); p.para(12,yy+8,184,q,size=11,maxh=11); lines(p,12,yy+24,186,2,9)
    p.text(12,216,'Player comments | keep quotations distinct from interpretation',11,bold=True); lines(p,12,232,186,2,10)
    p.text(12,253,'Proposed revisions | suggestions, not approved rule changes',11,bold=True); lines(p,12,269,186,1)
    p.save()

def continuation():
    p=start('10_Continuation','Repeatable further-cohort sheets')
    source=[]
    for soul in D['souls']:
        s=deepcopy(soul); s['template']=s['id']; s['id']='C____-'+s['id']
        if s['partner']: s['partner']='C____-'+s['partner']
        if s['opponent']: s['opponent']='C____-'+s['opponent']
        source.append(s)
    cards(p,source,'REPRINT SOULS | assign one fresh cohort to all 12',soul_card)
    fronts=[{'id':'M-'+s['id']+'-'+rid,'source_id':s['id'],'source_name':s['name'],'template':rid,
             'alternative':len(s['memory_options'])>1} for s in source for rid in s['memory_options']]
    cards(p,fronts,'REPRINT MEMORIES | match the new cohort IDs',memory_card)
    cards(p,list(range(12)),'REPRINT 12 IDENTICAL BACKS | one per earned memory',lambda p,x,y,_:back(p,x,y))
    p.save()

if __name__=='__main__':
    guide(); souls(); memories(); board_and_mats(); tokens(); trackers()
    references()
    events(); observations(); continuation()
    writer=PdfWriter(); next_page=1
    for section in SECTIONS:
        reader=PdfReader(ROOT/section['file']); count=len(reader.pages)
        section.update(pages=count,first_page=next_page,last_page=next_page+count-1)
        writer.append(reader,outline_item=section['title']); next_page+=count
    writer.add_metadata({'/Title':'The Ferryman v0.3 | Complete workshop kit','/Author':'The Ferryman project',
                         '/Subject':'Physical prototype. File checks do not validate printing or human play.'})
    with (ROOT/'Print_and_Play_Workshop_v0.3.pdf').open('wb') as f: writer.write(f)
    (ROOT/'source/page_index.json').write_text(json.dumps(SECTIONS,indent=2)+'\n')
    (ROOT/'validation/layout.json').write_text(json.dumps(LOGS,indent=2)+'\n')
    assert next_page-1==36,(next_page-1,'Update the print plan and inventory if page structure changes.')
    print(json.dumps({'pdfs':len(SECTIONS)+1,'total_pages':next_page-1,'sections':SECTIONS},indent=2))
