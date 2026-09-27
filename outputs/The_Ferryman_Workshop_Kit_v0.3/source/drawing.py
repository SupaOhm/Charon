"""A4 layout helpers and a small SVG path renderer for the reused icon set."""
from pathlib import Path
from math import sin, cos, atan2, sqrt, pi, ceil
import re, json, xml.etree.ElementTree as ET, io
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parents[1]
for name,file in [('Vera','Vera.ttf'),('VeraB','VeraBd.ttf'),('VeraI','VeraIt.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(ROOT/'assets/fonts'/file)))
pdfmetrics.registerFontFamily('Vera',normal='Vera',bold='VeraB',italic='VeraI',boldItalic='VeraB')
INK='#20383a'; BRONZE='#85633c'; PALE='#f5f2e9'; LINE='#a99f8e'; MUTED='#4a5958'; ALERT='#773d2d'
W,H=210,297
assets={r['key']:r for r in json.loads((ROOT/'source/asset_manifest.json').read_text())}
rasters={r['key']:r for r in json.loads((ROOT/'source/asset_manifest.json').read_text()) if r['file'].endswith('.png')}

def svg_path(c,d):
    tokens=re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',d)
    p=c.beginPath(); i=0; cmd=None; x=y=sx=sy=0; lastq=None
    counts={'M':2,'L':2,'H':1,'V':1,'C':6,'Q':4,'T':2,'A':7}
    while i<len(tokens):
        if tokens[i].isalpha():
            cmd=tokens[i]; i+=1
            if cmd.upper()=='Z': p.close(); x,y=sx,sy; lastq=None; continue
        upper=cmd.upper(); rel=cmd.islower(); n=counts[upper]
        v=list(map(float,tokens[i:i+n])); i+=n; ox,oy=x,y
        def xy(a,b): return (a+ox,b+oy) if rel else (a,b)
        if upper in ['M','L','T']:
            x,y=xy(*v)
            if upper=='M': p.moveTo(x,y); sx,sy=x,y; cmd='l' if rel else 'L'
            elif upper=='L': p.lineTo(x,y)
            else:
                q=(2*ox-lastq[0],2*oy-lastq[1]) if lastq else (ox,oy)
                p.curveTo(ox+2*(q[0]-ox)/3,oy+2*(q[1]-oy)/3,x+2*(q[0]-x)/3,y+2*(q[1]-y)/3,x,y); lastq=q
        elif upper=='H': x=v[0]+ox if rel else v[0]; p.lineTo(x,y)
        elif upper=='V': y=v[0]+oy if rel else v[0]; p.lineTo(x,y)
        elif upper=='C':
            a,b=xy(*v[:2]); d,e=xy(*v[2:4]); x,y=xy(*v[4:]); p.curveTo(a,b,d,e,x,y)
        elif upper=='Q':
            q=xy(*v[:2]); x,y=xy(*v[2:]); p.curveTo(ox+2*(q[0]-ox)/3,oy+2*(q[1]-oy)/3,x+2*(q[0]-x)/3,y+2*(q[1]-y)/3,x,y); lastq=q
        elif upper=='A':
            rx,ry,rotation,large,sweep,ex,ey=v; x,y=xy(ex,ey); rx,ry=abs(rx),abs(ry)
            assert rotation==0, 'Only unrotated source arcs are used by this kit.'
            xp,yp=(ox-x)/2,(oy-y)/2; lam=xp*xp/(rx*rx)+yp*yp/(ry*ry)
            if lam>1: rx*=sqrt(lam); ry*=sqrt(lam)
            factor=sqrt(max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp)))
            if bool(large)==bool(sweep): factor=-factor
            cxp=factor*rx*yp/ry; cyp=-factor*ry*xp/rx
            cx,cy=cxp+(ox+x)/2,cyp+(oy+y)/2
            a=atan2((yp-cyp)/ry,(xp-cxp)/rx); b=atan2((-yp-cyp)/ry,(-xp-cxp)/rx); delta=b-a
            if sweep and delta<0: delta+=2*pi
            if not sweep and delta>0: delta-=2*pi
            # The two cycle-icon circular arcs remain vector paths.
            for k in range(1,max(2,ceil(abs(delta)/(pi/48)))+1):
                t=a+delta*k/max(2,ceil(abs(delta)/(pi/48))); p.lineTo(cx+rx*cos(t),cy+ry*sin(t))
        if upper not in ['Q','T']: lastq=None
    return p

def icon(c,key,x,y,size):
    node=ET.parse(ROOT/assets[key]['file']).getroot()
    c.saveState(); c.translate(x*mm,(H-y-size)*mm)
    c.setFillColor(HexColor(INK)); c.roundRect(0,0,size*mm,size*mm,1*mm,stroke=0,fill=1)
    c.translate(size*.08*mm,size*.92*mm); c.scale(size*.84*mm/64,-size*.84*mm/64)
    def walk(e,style):
        style=dict(style); style.update(e.attrib); tag=e.tag.split('}')[-1]
        c.setLineWidth(float(style.get('stroke-width',1))); c.setLineCap(1); c.setLineJoin(1)
        fill=style.get('fill','none'); stroke=style.get('stroke','none')
        if fill!='none': c.setFillColor(HexColor(fill))
        if stroke!='none': c.setStrokeColor(HexColor(stroke))
        if tag=='path': c.drawPath(svg_path(c,style['d']),fill=fill!='none',stroke=stroke!='none')
        elif tag=='circle': c.circle(float(style['cx']),float(style['cy']),float(style['r']),fill=fill!='none',stroke=stroke!='none')
        elif tag=='ellipse':
            cx,cy,rx,ry=[float(style[k]) for k in ['cx','cy','rx','ry']]
            c.ellipse(cx-rx,cy-ry,cx+rx,cy+ry,fill=fill!='none',stroke=stroke!='none')
        for child in e: walk(child,style)
    walk(node,{})
    c.restoreState()

class Sheet:
    def __init__(self,path,section,logs):
        self.c=canvas.Canvas(str(path),pagesize=(W*mm,H*mm),pageCompression=1,invariant=1,initialFontName='Vera')
        self.c.setTitle('The Ferryman v0.3 | '+section); self.c.setAuthor('The Ferryman project | workshop kit')
        self.c.setSubject('v0.3 workshop prototype. Physical validation pending.')
        self.section=section; self.logs=logs; self.page=0; self.key=''; self.elements=[]; self.card_box=None
    def record(self,kind,x,y,w,h,**meta):
        box=[round(z,3) for z in [x,y,w,h]]
        assert x>=9.7 and y>=9.7 and x+w<=200.3 and y+h<=287.3, (self.key,kind,box,meta)
        if self.card_box and kind in ['text','para','image','icon']:
            a,b,c,d=self.card_box
            assert x>=a+2.8 and y>=b+2.8 and x+w<=a+c-2.8 and y+h<=b+d-2.8,(self.key,'card safe',box,meta)
        self.elements.append({'kind':kind,'box_mm':box,**meta})
    def text(self,x,y,text,size=11,bold=False,color=INK):
        assert size>=10
        font='VeraB' if bold else 'Vera'; width=pdfmetrics.stringWidth(text,font,size)/mm
        self.record('text',x,y,width,size*1.16/mm,text=text,size_pt=size)
        self.c.setFillColor(HexColor(color)); self.c.setFont(font,size); self.c.drawString(x*mm,(H-y)*mm-size,text)
    def para(self,x,y,w,text,size=11,bold=False,maxh=None,color=INK):
        assert size>=10
        style=ParagraphStyle('p',fontName='VeraB' if bold else 'Vera',fontSize=size,leading=size*1.23,textColor=HexColor(color),spaceAfter=0)
        p=Paragraph(text,style); _,height=p.wrap(w*mm,2000); h=height/mm
        if maxh is not None: assert h<=maxh+.05,(self.key,'paragraph overflow',h,maxh,text)
        self.record('para',x,y,w,h,text=text,size_pt=size)
        p.drawOn(self.c,x*mm,(H-y-h)*mm); return h
    def box(self,x,y,w,h,fill=PALE,stroke=LINE,radius=1.5):
        self.record('box',x,y,w,h)
        self.c.setStrokeColor(HexColor(stroke)); self.c.setFillColor(HexColor(fill)); self.c.setLineWidth(.5)
        self.c.roundRect(x*mm,(H-y-h)*mm,w*mm,h*mm,radius*mm,stroke=1,fill=1)
    def line(self,x1,y1,x2,y2,color=LINE,width=.5):
        self.c.setLineWidth(width); self.c.setStrokeColor(HexColor(color)); self.c.line(x1*mm,(H-y1)*mm,x2*mm,(H-y2)*mm)
    def image(self,key,x,y,w,h):
        a=rasters[key]; im=Image.open(ROOT/a['file']).convert('RGB'); scale=min(w/im.width,h/im.height)
        dw,dh=im.width*scale,im.height*scale; dx,dy=x+(w-dw)/2,y+(h-dh)/2
        # Preserve the original file; only the PDF embedding is resampled at up to 450 dpi.
        target=(max(1,round(dw/25.4*450)),max(1,round(dh/25.4*450)))
        im.thumbnail(target,Image.Resampling.LANCZOS)
        stream=io.BytesIO(); im.save(stream,format='JPEG',quality=94,subsampling=0); stream.seek(0)
        self.record('image',dx,dy,dw,dh,asset=key,effective_dpi=round(min(im.width/(dw/25.4),im.height/(dh/25.4)),1),contained=True)
        self.c.drawImage(ImageReader(stream),dx*mm,(H-dy-dh)*mm,dw*mm,dh*mm)
    def icon(self,key,x,y,size):
        self.record('icon',x,y,size,size,asset=key); icon(self.c,key,x,y,size)
    def new(self,title,subtitle='',cards=False):
        if self.page: self.finish_page()
        self.page+=1; self.key=f'{self.section}:{self.page}'; self.elements=[]; self.card_box=None
        self.text(10.5,10 if cards else 11,title,10 if cards else 18,bold=True)
        if subtitle: self.para(10.5,25,189,subtitle,size=10,maxh=9)
        self.line(150,15,200,15,INK,.65); self.line(150,13.5,150,16.5,INK); self.line(200,13.5,200,16.5,INK)
        self.text(164,10,'50 mm',10) if cards else self.text(164,17.5,'50 mm',10)
    def finish_page(self):
        self.card_box=None
        self.text(10.5,282.5,f'{self.section} / {self.page}',10)
        self.text(93,282.5,'v0.3 workshop prototype',10)
        self.logs.append({'section':self.section,'page':self.page,'elements':self.elements})
        self.c.showPage()
    def save(self): self.finish_page(); self.c.save()
    def card(self,x,y):
        self.box(x,y,63,88,fill='#fffef9',stroke='#746c60',radius=0)
        self.card_box=(x,y,63,88)
    def end_card(self): self.card_box=None

def card_positions():
    return [(10.5+col*63,18+row*88) for row in range(3) for col in range(3)]

def panel(p,x,y,w,title,body,h=None,size=11):
    if h: p.box(x,y,w,h)
    p.text(x+3,y+2,title,12,bold=True)
    return p.para(x+3,y+9,w-6,body,size=size,maxh=(h-11 if h else None))+11
