"""Build editable component data from the bundled v0.3 source snapshot.
No gameplay engine, network access or optional dependencies are required.
"""
from pathlib import Path
import json, re, hashlib

HERE=Path(__file__).resolve().parent
raw=(HERE/'references/Decided_Rules.md').read_text()
expected='459d7a8501b5e0674e95e31db09806dd6657117da1470b44a42684d5f9e5cdfb'
assert hashlib.sha256(raw.encode()).hexdigest()==expected, 'Rules changed: re-audit constants, copy and layouts before rebuilding.'
memory_ids={'Steadiness':'R01','Vigil':'R02','Recollection':'R03','Accord':'R04','Joined':'R05','Faint':'R06'}
linked={'S01':'S02','S02':'S01','S11':'S12','S12':'S11'}
conflict={'S04':'S06','S06':'S04'}
souls=[]
for row in re.findall(r'^\| (S\d{2}) \| (.*?) \| (\d) \| (.*?) \| (.*?) \| (.*?) \|$',raw,re.M):
    sid,name,seats,reward,wish,mem=row
    souls.append({'id':sid,'name':name,'seats':int(seats),'reward':{'type':reward.lower(),'amount':1},
                  'wish':wish.lower(),'memory_options':[memory_ids[n.strip()] for n in mem.split('/')],
                  'partner':linked.get(sid),'opponent':conflict.get(sid),
                  'protection':('1 fog protection with 2+ other souls aboard.' if sid=='S05' else
                                '1 fog protection when the only soul aboard.' if sid=='S10' else ''),
                  'rule_source':'6. Souls, wishes and memories; 3. Passenger protection'})
assert len(souls)==12
names=['Steadiness','Vigil','Recollection','Accord','Joined Memory','Faint Memory']
short=[
 '2 fog protection for the upcoming crossing.',
 '1 fog protection. Increase to 3 if any aboard soul uses two seats.',
 '1 fog protection. Optional: mark one waiting shore soul to prevent normal anger at this return. Target from any stop. Separation anger still applies.',
 '1 fog protection. Cancel all same-cohort opposing soldier conflicts for this crossing.',
 '2 fog protection. Optional: mark one waiting shore soul to prevent normal anger at this return. Target from any stop. Separation anger still applies.',
 '1 fog protection for the upcoming crossing.']
memories=[]
for i,name in enumerate(names):
    exact=re.search(r'^\| '+re.escape(name)+r' \| (.*?) \|$',raw,re.M).group(1)
    memories.append({'id':f'R{i+1:02}','name':name,'protection':[2,1,1,1,2,1][i],
       'conditionalProtection':3 if i==1 else None,'normalAngerTarget':i in [2,4],
       'cancelConflicts':i==3,'description':short[i],'source_effect':exact,'rule_source':'6. Memory circulation/effect table'})
event_rows=re.findall(r'^\| (E\d{2}) \| (.*?) \| (.*?) \|$',raw,re.M)
event_copy=[
 ('Shared Farewell','Elysium: at least one matching linked pair was delivered together in this arrival action.',
  'Gain 1 light, up to 6. Automatic after delivery rewards.','Two companions pause together at the landing.'),
 ('Unfinished Message','Asphodel: a Messenger is still aboard or was delivered at this arrival.',
  'Optional: pay 1 obol to reduce reprimands by 1, minimum 0. Requires an obol and a reprimand. Decline: no effect.','A message finds someone willing to carry it farther.'),
 ('Old Feud','Tartarus: both opposing soldiers of one cohort were aboard on entry, even if either disembarked here.',
  'Optional: pay 1 obol to reconcile only this pair for the run. Remove their conflict pressure on later crossings. Decline: no effect.','An old argument reaches a moment of quiet.'),
 ('The Broken Landing','Haven: hull is below 3 on arrival.',
  'Gain 1 hull, up to 3. Automatic after normal haven recovery.','A loose plank can be fitted to the damaged boat.')]
events=[]
for (eid,trig,effect),(title,condition,copy,flavor) in zip(event_rows,event_copy):
    events.append({'id':eid,'title':title,'condition':condition,'effect':copy,'flavor':flavor,
       'optional':eid in ['E02','E03'],'source_trigger':trig,'source_effect':effect,'rule_source':'7. Events; 9. Arrival order'})
nodes=[{'id':k,'name':n,'base_fog':f} for k,n,f in [
 ('shore','Starting Shore',0),('elysium','Elysium',0),('asphodel','Asphodel',1),('tartarus','Tartarus',2),('haven','Haven',0)]]
edges={n['id']:([x for x in ['elysium','asphodel','tartarus'] if x!=n['id']]+([] if n['id']=='shore' else
                   (['shore'] if n['id']=='haven' else ['haven','shore']))) for n in nodes}
data={
 'version':'0.3','kit_revision':'workshop-1','language':'en','rules_sha256':expected,
 'production':{'page_mm':[210,297],'margin_mm':10,'card_mm':[63,88],'card_safe_mm':3,
               'starter_cohorts':['C01','C02'],'starter_souls':24,'starter_memory_fronts':32,'starter_memory_backs':24,
               'continuation_souls':12,'continuation_memory_fronts':16,'continuation_memory_backs':12,
               'minimum_rules_pt':10,'default_rules_pt':11,'calibration_mm':50},
 'resources':{'light_start':2,'light_max':6,'obols_start':2,'hull_start':3,'hull_max':3,'reprimands_start':0,'dismissal_at':3,'seats':4},
 'actions':{'calm':{'obols':1,'limit_per_cycle':1,'where':['shore']},'repair':{'obols':1,'hull_gain':1,'where':['shore','haven']},
            'release':{'light':2,'reprimands_removed':1,'where':'any stop, preparation','repeatable':True},
            'memory':{'cost':0,'per_crossing':1,'hand_draw_to':3,'draws_per_stop':1}},
 'cycle':{'quota_obols':2,'quota_every':3,'recovery_light':1,'normal_anger':1,'separation_anger':1,'wraith_at_anger':3,
           'rocky_from':3,'rocky_base_reduction':1,'rocky_hull_damage':1,'modifier_from':5,'modifier':1,
           'favor_from':6,'favor_order':['elysium','asphodel','tartarus'],'refill_toward':5},
 'souls':souls,'memories':memories,'events':events,'nodes':nodes,'edges':edges,
 'tokens':{'obols':{'1':12,'5':6,'10':2},'status':{'WAIT':8,'SPLIT':8,'GUARD':8,'VISIT':4,'HERE':1,'2ND SEAT':4,'TRACK':3,'NORMAL':1,'ROCKY':1,'BLANK':10}},
 'mapping':{'resources':'3','actions':'5, 6 and 3 Repairs','souls':'6 soul table; 3 passenger effects',
            'nodes_edges':'2','cycle_escalation':'8','anger_supply':'4','memories':'6','events':'7','phase_order':'9'}
}
data['soul_instances']=[dict(s,id=f'{cohort}-{s["id"]}',template=s['id'],cohort=cohort,
       partner=f'{cohort}-{s["partner"]}' if s['partner'] else None,
       opponent=f'{cohort}-{s["opponent"]}' if s['opponent'] else None) for cohort in ['C01','C02'] for s in souls]
data['memory_instances']=[{'id':f'M-{s["id"]}-{rid}','source_id':s['id'],'source_name':s['name'],'template':rid,
                          'alternative':len(s['memory_options'])>1} for s in data['soul_instances'] for rid in s['memory_options']]
data['phase_order']={}
for key,heading in [('arrival','At a destination or haven'),('return','Returning to the starting shore')]:
    block=raw.split('### '+heading+'\n',1)[1].split('\n##',1)[0]
    data['phase_order'][key]=re.findall(r'^\d+\. (.*)$',block,re.M)
assert len(data['phase_order']['arrival'])==6 and len(data['phase_order']['return'])==7
(HERE/'components.json').write_text(json.dumps(data,indent=2)+'\n')
print('Structured source: 12 soul templates, 24 starter souls, 32 memory fronts, 6 effects, 4 events, 19 directed edges.')
