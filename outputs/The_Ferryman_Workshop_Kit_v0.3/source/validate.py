"""Static component and PDF checks. These are not a game engine or human playtest."""
from pathlib import Path
import json, re, hashlib, subprocess, collections, os
from pypdf import PdfReader
import pdfplumber
from reportlab.lib.units import mm

ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'source/components.json').read_text())
INDEX=json.loads((ROOT/'source/page_index.json').read_text())
LAYOUT=json.loads((ROOT/'validation/layout.json').read_text())
WORK=Path(os.environ.get('CHARON_WORK_DIR',str(ROOT.parents[1]/'work/workshop-kit-v0.3')))
WORK.mkdir(parents=True,exist_ok=True); (WORK/'fontcache').mkdir(exist_ok=True)
config=WORK/'fontconfig.xml'
config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>'+str(ROOT/'assets/fonts')+'</dir><cachedir>'+str(WORK/'fontcache')+'</cachedir></fontconfig>')
ENV={**os.environ,'FONTCONFIG_FILE':str(config)}
rules=(ROOT/'source/references/Decided_Rules.md').read_text()
checks=[]
def check(name,fn):
    try: details=fn(); checks.append({'check':name,'status':'PASS','details':details})
    except Exception as e: checks.append({'check':name,'status':'FAIL','details':str(e)})
def require(value,message):
    if not value: raise AssertionError(message)
    return True

def rules_tables():
    rows=re.findall(r'^\| (S\d{2}) \| (.*?) \| (\d) \| (.*?) \| (.*?) \| (.*?) \|$',rules,re.M)
    memnames={'R01':'Steadiness','R02':'Vigil','R03':'Recollection','R04':'Accord','R05':'Joined','R06':'Faint'}
    for s,row in zip(D['souls'],rows):
        sid,name,seats,reward,wish,mem=row
        require((s['id'],s['name'],s['seats'],s['reward']['type'],s['wish'])==(sid,name,int(seats),reward.lower(),wish.lower()),sid)
        require([memnames[x] for x in s['memory_options']]==[x.strip() for x in mem.split('/')],sid+' memory')
    require(len(rows)==len(D['souls'])==12,'soul count')
    for m in D['memories']:
        require(f'| {m["name"]} | {m["source_effect"]} |' in rules,m['id'])
    for e in D['events']:
        require(f'| {e["id"]} | {e["source_trigger"]} | {e["source_effect"]} |' in rules,e['id'])
    return '12 source soul rows, 6 exact memory effects and 4 exact trigger/effect rows matched.'
check('Source rules tables and effect provenance',rules_tables)

def identities():
    ids={s['id']:s for s in D['soul_instances']}; require(len(ids)==24,'unique souls')
    mids=[m['id'] for m in D['memory_instances']]; require(len(mids)==len(set(mids))==32,'unique memory options')
    for s in ids.values():
        for field in ['partner','opponent']:
            if s[field]:
                require(s[field] in ids,s['id']+' missing pair')
                require(ids[s[field]]['cohort']==s['cohort'],s['id']+' wrong cohort')
                require(ids[s[field]][field]==s['id'],s['id']+' pair not reciprocal')
        options=[m for m in D['memory_instances'] if m['source_id']==s['id']]
        require(len(options)==len(s['memory_options']),s['id']+' missing memory alternative')
    require(sum(len(s['memory_options'])==2 for s in ids.values())==8,'linked option count')
    require(D['production']['starter_memory_backs']==len(ids),'one common back per possible earned memory')
    return {'starterSouls':24,'memoryFronts':32,'maximumEarnedFromStarter':24,'unusedAlternativesAfterAllDeliveries':8,'backs':24}
check('Unique cohorts, scoped pairs and adequate memory alternatives',identities)

def graph():
    expected={'shore':['elysium','asphodel','tartarus'],
      'elysium':['asphodel','tartarus','haven','shore'],
      'asphodel':['elysium','tartarus','haven','shore'],
      'tartarus':['elysium','asphodel','haven','shore'],
      'haven':['elysium','asphodel','tartarus','shore']}
    require(D['edges']==expected,'directed adjacency')
    require({n['id']:n['base_fog'] for n in D['nodes']}=={'shore':0,'elysium':0,'asphodel':1,'tartarus':2,'haven':0},'base fog')
    return '19 directed edges; no shore-to-haven or self-loop; revisits gated by printed travel instructions.'
check('Directed map and base route values',graph)

def pdf_files():
    total=0; details=[]
    for item in INDEX+[{'file':'Print_and_Play_Workshop_v0.3.pdf','pages':36}]:
        reader=PdfReader(ROOT/item['file']); require(len(reader.pages)==item['pages'],item['file']+' pages')
        for i,page in enumerate(reader.pages):
            require(abs(float(page.mediabox.width)/mm-210)<.02 and abs(float(page.mediabox.height)/mm-297)<.02,'not A4')
            text=page.extract_text(); require('v0.3 workshop prototype' in text,item['file']+f':{i+1} missing version')
            require('50 mm' in text,item['file']+f':{i+1} missing calibration label')
            require('\u2014' not in text and '\ufffd' not in text,'bad glyph')
        fonts=subprocess.check_output(['pdffonts',str(ROOT/item['file'])],text=True,env=ENV)
        for row in fonts.splitlines()[2:]:
            cols=row.split()
            if cols: require(cols[-5]=='yes',item['file']+' unembedded font')
        details.append({'file':item['file'],'pages':len(reader.pages)})
        total+=len(reader.pages)
    require(total==72,'36 section pages + 36 master pages')
    return details
check('PDF page counts, A4 size, selectable text and fonts',pdf_files)

def actual_pdf_geometry():
    smallest=100; measured=[]
    with pdfplumber.open(ROOT/'Print_and_Play_Workshop_v0.3.pdf') as pdf:
        for i,page in enumerate(pdf.pages):
            require(bool(page.chars),'empty text page')
            for char in page.chars:
                smallest=min(smallest,char['size'])
                require(char['x0']/mm>=9.99 and char['x1']/mm<=200.01,'text outside horizontal safe margin')
                require(char['top']/mm>=9.99 and char['bottom']/mm<=287.01,'text outside vertical safe margin')
            lines=[line for line in page.lines if abs(line['width']/mm-50)<.01 and line['height']<.01]
            require(bool(lines),'missing actual 50 mm vector line on page '+str(i+1))
            measured.append(round(lines[0]['width']/mm,4))
    require(smallest>=9.999,'actual PDF type below 10 pt')
    return {'pagesInspected':36,'minimumExtractedFontPt':round(smallest,4),'calibrationLengthsMm':measured,'textMarginMm':10}
check('Actual PDF glyph bounds and measured calibration lines',actual_pdf_geometry)

def geometry():
    minimum=100; dpi=9999; overlaps=[]; semantic=['text','para','image','icon']; counts=collections.Counter()
    for page in LAYOUT:
        elems=[e for e in page['elements'] if e['kind'] in semantic]
        for e in page['elements']:
            x,y,w,h=e['box_mm']; require(x>=9.7 and y>=9.7 and x+w<=200.3 and y+h<=287.3,'unsafe page margin')
            if e['kind'] in ['text','para']: minimum=min(minimum,e['size_pt'])
            if e['kind']=='image': dpi=min(dpi,e['effective_dpi'])
            if e['kind']=='box' and abs(w-63)<.001 and abs(h-88)<.001: counts[page['section']]+=1
        for i,a in enumerate(elems):
            for b in elems[i+1:]:
                ax,ay,aw,ah=a['box_mm']; bx,by,bw,bh=b['box_mm']
                wi=min(ax+aw,bx+bw)-max(ax,bx); hi=min(ay+ah,by+bh)-max(ay,by)
                if wi>.25 and hi>.25:
                    overlaps.append({'page':page['section']+':'+str(page['page']),'a':a.get('text',a.get('asset')),
                                     'b':b.get('text',b.get('asset')),'overlap_mm':[round(wi,2),round(hi,2)]})
    (ROOT/'validation/overlaps.json').write_text(json.dumps(overlaps,indent=2)+'\n')
    require(minimum>=10,'text too small'); require(dpi>=300,'image resolution below 300 dpi')
    require(not overlaps,f'{len(overlaps)} potential content overlaps; see overlaps.json')
    require(counts['02_Soul_Cards']==24 and counts['03_Memory_Cards']==56,'starter cut counts')
    require(counts['10_Continuation']==40,'continuation cut counts')
    return {'minimumTextPt':minimum,'minimumEmbeddedImageDpi':dpi,'safeMarginsMm':10,'cutCardMm':[63,88], 'cutBoxes':dict(counts)}
check('Page/card geometry, minimum type size, image DPI and overlap scan',geometry)

def secrecy():
    player=PdfReader(ROOT/'print/07_References.pdf').pages[0].extract_text()
    for e in D['events']: require(e['title'] not in player and e['condition'] not in player,'player reference spoiler')
    backs=[e for page in LAYOUT if page['section']=='03_Memory_Cards' and page['page']>=5 for e in page['elements'] if e['kind']=='image']
    require(len(backs)==24 and all(e['asset']=='memoryBack' for e in backs),'memory back image variation')
    require(len({(e['box_mm'][2],e['box_mm'][3]) for e in backs})==1,'memory back size variation')
    return 'Player reference excludes event titles/conditions. 24 starter backs use the same image, dimensions and source layout.'
check('Spoiler separation and uniform memory backs',secrecy)

def source_files():
    records=json.loads((ROOT/'source/asset_manifest.json').read_text())
    for row in records: require(hashlib.sha256((ROOT/row['file']).read_bytes()).hexdigest()==row['sha256'],row['file']+' changed')
    for row in json.loads((ROOT/'source/source_snapshot.json').read_text()):
        require(hashlib.sha256((ROOT/'source/references'/row['file']).read_bytes()).hexdigest()==row['sha256'],row['file']+' changed')
    return f'{len(records)} reused art files and all source snapshots retain their hashes.'
check('Asset and source preservation',source_files)

result={'scope':'Automated component/PDF checks only. No browser gameplay, printer or human playtest.',
        'passed':sum(x['status']=='PASS' for x in checks),'failed':sum(x['status']=='FAIL' for x in checks),'checks':checks}
(ROOT/'validation/static_checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
raise SystemExit(1 if result['failed'] else 0)
