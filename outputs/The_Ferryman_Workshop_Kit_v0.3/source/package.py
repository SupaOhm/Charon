"""Package reviewed files only, then compare every archived byte to the delivery."""
from pathlib import Path
import json,hashlib,zipfile,sys

ROOT=Path(__file__).resolve().parents[1]
ZIP=ROOT.parent/(ROOT.name+'.zip')
MANIFEST=ROOT/'PACKAGE_MANIFEST.json'
RECEIPT=ROOT/'validation/package_check.json'
def sha(data): return hashlib.sha256(data).hexdigest()
def payload():
    return sorted(p for p in ROOT.rglob('*') if p.is_file() and p not in [MANIFEST,RECEIPT]
                  and '__pycache__' not in p.parts and p.name!='.DS_Store' and p.suffix not in ['.pyc','.zip'])
def review_current():
    pdfsha=sha((ROOT/'Print_and_Play_Workshop_v0.3.pdf').read_bytes())
    static=json.loads((ROOT/'validation/static_checks.json').read_text())
    assert static['failed']==0 and static['passed']==8,'static checks not complete'
    render=json.loads((ROOT/'validation/render_checks.json').read_text())
    assert render['pdfsRendered']==11 and render['pagesRendered']==72 and render['sectionPagesPixelMatched']==36
    visual=json.loads((ROOT/'validation/visual_review.json').read_text())
    assert visual['status']=='PASS' and visual['pdfSha256']==pdfsha,'stale or missing visual review'
    assert visual['masterPagesInspected']==list(range(1,37))
    for name,digest in visual['previewHashes'].items():
        assert sha((ROOT/'previews'/name).read_bytes())==digest,'preview changed since review: '+name
    desk=json.loads((ROOT/'validation/component_walkthrough.json').read_text())
    assert desk['failed']==0 and desk['passed']==13 and desk['pdfSha256']==pdfsha,'stale desk walkthrough'
    for name in ['README.md','COMPONENT_INVENTORY.md','PROVENANCE.md','VALIDATION.md','handoff.md']:
        assert (ROOT/name).is_file(),name

review_current()
if '--verify' not in sys.argv:
    records=[{'file':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in payload()]
    manifest={'kit':'The Ferryman v0.3 workshop-1','algorithm':'SHA-256','payloadFileCount':len(records),
              'excluded':['PACKAGE_MANIFEST.json (self)','validation/package_check.json (external ZIP receipt)',
                          '__pycache__','*.pyc','.DS_Store','*.zip','scratch work outside kit'], 'files':records}
    MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
    with zipfile.ZipFile(ZIP,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in payload()+[MANIFEST]: z.write(p,ROOT.name+'/'+str(p.relative_to(ROOT)))

manifest=json.loads(MANIFEST.read_text())
assert {r['file'] for r in manifest['files']}=={str(p.relative_to(ROOT)) for p in payload()},'manifest file set is stale'
with zipfile.ZipFile(ZIP) as z:
    assert z.testzip() is None,'ZIP CRC failure'
    expected={ROOT.name+'/'+r['file'] for r in manifest['files']}|{ROOT.name+'/PACKAGE_MANIFEST.json'}
    assert len(z.namelist())==len(expected) and set(z.namelist())==expected,'ZIP file set mismatch'
    for r in manifest['files']:
        local=(ROOT/r['file']).read_bytes(); archived=z.read(ROOT.name+'/'+r['file'])
        assert len(local)==r['bytes'] and sha(local)==r['sha256'],'changed local file: '+r['file']
        assert archived==local,'ZIP byte mismatch: '+r['file']
    assert z.read(ROOT.name+'/PACKAGE_MANIFEST.json')==MANIFEST.read_bytes()
result={'status':'PASS','zipFile':ZIP.name,'zipBytes':ZIP.stat().st_size,'zipSha256':sha(ZIP.read_bytes()),
        'payloadFilesVerified':len(manifest['files']),'archiveFilesVerifiedIncludingManifest':len(expected),
        'crcCheck':'PASS','allArchivedFilesMatchDelivery':True,'unexpectedFiles':0,
        'receiptLocation':'Outside the ZIP intentionally; manifest is inside the ZIP.',
        'physicalPrinterCheck':'NOT_RUN','humanPlaytest':'NOT_RUN'}
RECEIPT.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
