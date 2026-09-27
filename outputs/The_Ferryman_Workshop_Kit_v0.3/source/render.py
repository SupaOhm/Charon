"""Render every PDF page and compare section pages with the complete kit.
Poppler must already be available. Final sheet previews stay in previews/.
Duplicate section renders and review spreads stay in the chosen scratch directory.
"""
from pathlib import Path
import json, os, subprocess, hashlib, concurrent.futures
from PIL import Image, ImageOps, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
WORK=Path(os.environ.get('CHARON_WORK_DIR',str(ROOT.parents[1]/'work/workshop-kit-v0.3')))
WORK.mkdir(parents=True,exist_ok=True)
(WORK/'fontcache').mkdir(exist_ok=True)
config=WORK/'fontconfig.xml'
config.write_text('<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>'+str(ROOT/'assets/fonts')+'</dir><cachedir>'+str(WORK/'fontcache')+'</cachedir></fontconfig>')
ENV={**os.environ,'FONTCONFIG_FILE':str(config)}
INDEX=json.loads((ROOT/'source/page_index.json').read_text())
font=ImageFont.truetype(str(ROOT/'assets/fonts/Vera.ttf'),23)
bold=ImageFont.truetype(str(ROOT/'assets/fonts/VeraBd.ttf'),28)

def run(item):
    prefix=ROOT/'previews/sheet' if item['file']=='Print_and_Play_Workshop_v0.3.pdf' else WORK/item['name']/'page'
    prefix.parent.mkdir(parents=True,exist_ok=True)
    proc=subprocess.run(['pdftoppm','-png','-r','150',str(ROOT/item['file']),str(prefix)],env=ENV,capture_output=True,text=True)
    if proc.returncode: raise RuntimeError(proc.stderr)
    files=sorted(prefix.parent.glob(prefix.name+'-*.png'))
    assert len(files)==item['pages'],(item['file'],len(files))
    return {'file':item['file'],'pages':len(files),'prefix':str(prefix),'stderr':proc.stderr.strip()}

if __name__=='__main__':
    jobs=INDEX+[{'name':'complete','file':'Print_and_Play_Workshop_v0.3.pdf','pages':36}]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: reports=list(pool.map(run,jobs))
    images=sorted((ROOT/'previews').glob('sheet-*.png'))
    matched=[]
    for item in INDEX:
        local=sorted((WORK/item['name']).glob('page-*.png'))
        for i,file in enumerate(local):
            master=images[item['first_page']-1+i]
            a,b=Image.open(file),Image.open(master)
            assert a.size==b.size and a.tobytes()==b.tobytes(),('section rendering mismatch',file,master)
            matched.append({'section':item['file'],'page':i+1,'masterPage':item['first_page']+i})
    for i in range(0,36,2):
        spread=Image.new('RGB',(1830,1320),'#e9e6dd'); draw=ImageDraw.Draw(spread)
        for j in range(2):
            im=Image.open(images[i+j]).convert('RGB'); im.thumbnail((890,1260))
            spread.paste(im,(15+j*915,45)); draw.text((18+j*915,10),f'Complete kit page {i+j+1}',font=font,fill='#20383a')
        spread.save(WORK/f'review-{i+1:02}-{i+2:02}.jpg',quality=94)
    for page in [3,7,13,18]:
        ImageOps.grayscale(Image.open(images[page-1])).save(ROOT/'previews'/f'grayscale-{page:02}.png')
    # Actual render crops, not newly illustrated components.
    scale=150/25.4
    for page,label in [(3,'soul'),(6,'memory'),(26,'event')]:
        im=Image.open(images[page-1]); x,y=10.5,18
        im.crop((round(x*scale),round(y*scale),round((x+63)*scale),round((y+88)*scale))).save(ROOT/'previews'/f'{label}-card-detail.png')
    table=Image.new('RGB',(2060,1580),'#e6dfd0'); draw=ImageDraw.Draw(table)
    draw.text((35,20),'THE FERRYMAN | suggested station layout',font=bold,fill='#20383a')
    draw.text((35,60),'Arrangement guide, not a physical rehearsal or a measured table footprint.',font=font,fill='#20383a')
    placements=[(13,35,145,'1  Route board'),(14,445,145,'2  Four-seat boat'),(16,855,145,'3  Memories'),(19,1265,145,'4  Resources'),
                (15,35,800,'5  Waiting + storage'),(23,445,800,'6  Player reference'),(20,855,800,'7  Facilitator ledgers'),(27,1265,800,'8  Private event sheet')]
    for page,x,y,title in placements:
        draw.text((x,y-36),title,font=font,fill='#20383a'); im=Image.open(images[page-1]).convert('RGB'); im.thumbnail((370,523)); table.paste(im,(x,y))
    draw.text((1690,150),'Loose components',font=font,fill='#20383a')
    for i,label in enumerate(['soul','memory','event']):
        im=Image.open(ROOT/'previews'/f'{label}-card-detail.png').convert('RGB'); im.thumbnail((120,168)); table.paste(im,(1700+i%2*145,200+i//2*215))
    token=Image.open(images[16]); token=token.crop((round(17*scale),round(41*scale),round(48*scale),round(72*scale))); token.thumbnail((95,95)); table.paste(token,(1850,425))
    notes=['Extend waiting and','wraith areas onto','the table as needed.','','Keep observation and','feedback forms with','the facilitator.','','Cover event faces;','the full reference','is an opt-in spoiler.']
    for i,line in enumerate(notes): draw.text((1690,700+i*32),line,font=font,fill='#20383a')
    draw.text((35,1490),'v0.3 workshop prototype | match fresh cohort IDs | no finite supply or token cap',font=bold,fill='#20383a')
    table.save(ROOT/'previews/table-layout-overview.png')
    report={'renderDpi':150,'pdfsRendered':11,'pagesRendered':72,'masterPages':36,'sectionPagesPixelMatched':len(matched),
            'reports':reports,'matches':matched,'grayscaleMasterPages':[3,7,13,18],
            'physicalPrinterCheck':'NOT_RUN','visualReview':'Pending separate agent inspection'}
    (ROOT/'validation/render_checks.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['reports','matches']},indent=2))
