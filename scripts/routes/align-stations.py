#!/usr/bin/env python3
"""
Keeps station dots on the lines drawn for them.

For every city: a station further than TOL from its own line's route is moved
onto it; stations of an interchange whose lines run side by side (within PAR)
are centred between those lines; a terminus a little past the end of its line
gets the line drawn on to it. Anything that would need a bigger move is only
reported (usually a missing stretch of route or a misplaced station).

  python3 scripts/routes/align-stations.py               # dry run, report only
  python3 scripts/routes/align-stations.py --write       # apply
  python3 scripts/routes/align-stations.py --write gba   # one city (path substring)
"""
import json,math,sys,os,glob,re,collections

def proj(lon,lat,lat0): return (lon*math.cos(math.radians(lat0))*111320, lat*110540)
def segdist(p,a,b):
    ax,ay=a;bx,by=b;px,py=p
    dx,dy=bx-ax,by-ay
    L=dx*dx+dy*dy
    t=0 if L==0 else max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L))
    cx,cy=ax+t*dx,ay+t*dy
    return math.hypot(px-cx,py-cy),(cx,cy),t
def lines_of(geom):
    if geom['type']=='LineString': return [geom['coordinates']]
    if geom['type']=='MultiLineString': return geom['coordinates']
    return []

ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','src','app','(game)')
WRITE='--write' in sys.argv
only=[a for a in sys.argv[1:] if not a.startswith('--')]
TOL=12        # leave stations closer than this to their line alone (m)
PAR=45        # lines whose drawn routes are this close at a station are "parallel"
GROUP=400     # same-name stations this close are one interchange
MAXMOVE=300   # never move a station further than this; report instead
EXT_MIN=40     # a terminus this far past its line's end: draw the line on to it
EXT_MAX=300   # ...but no more than this; longer gaps are reported
COORD_RE=re.compile(r'("coordinates"\s*:\s*\[\s*)(-?[0-9.eE+-]+)(\s*,\s*)(-?[0-9.eE+-]+)')

def norm(n): return re.sub(r'\s+',' ',(n or '').strip().lower())

def nearest(P,segs):
    best=(1e18,None)
    for s in segs:
        for a,b in zip(s,s[1:]):
            d,q,_=segdist(P,a,b)
            if d<best[0]: best=(d,q)
    return best

def fmt(v): return ('%.6f'%v).rstrip('0').rstrip('.')

EXT=[];MOVES=[];report=[];totals=collections.Counter()
for rp in sorted(glob.glob(ROOT+'/**/routes.json',recursive=True)):
    d=os.path.dirname(rp); fp=os.path.join(d,'features.json')
    city=os.path.relpath(d,ROOT)
    if only and not any(o in city for o in only): continue
    if not os.path.exists(fp): continue
    raw=open(fp).read(); f=json.loads(raw); r=json.load(open(rp))
    feats=f['features']
    if not feats: continue
    lat0=feats[0]['geometry']['coordinates'][1]
    k=math.cos(math.radians(lat0))*111320
    toP=lambda c:(c[0]*k,c[1]*110540)
    toLL=lambda q:(q[0]/k,q[1]/110540)
    routes={}
    for x in r.get('features',[]):
        ln=x['properties'].get('line')
        for seg in lines_of(x['geometry']):
            seg=[pt for pt in seg if isinstance(pt,list) and len(pt)>=2]
            if len(seg)>=2: routes.setdefault(ln,[]).append([toP(pt) for pt in seg])
    # dangling ends: line ends that no other piece of the same line touches
    ends={}
    for ln,segs in routes.items():
        cand=[s[0] for s in segs]+[s[-1] for s in segs]
        dang=[]
        bbs=[(min(p[0] for p in s)-3,min(p[1] for p in s)-3,max(p[0] for p in s)+3,max(p[1] for p in s)+3) for s in segs]
        for e in cand:
            touching=sum(1 for s,bb in zip(segs,bbs) if bb[0]<=e[0]<=bb[2] and bb[1]<=e[1]<=bb[3] for a,b in zip(s,s[1:]) if segdist(e,a,b)[0]<3)
            if touching<=1: dang.append(e)
        ends[ln]=dang
    pts=[toP(x['geometry']['coordinates']) for x in feats]
    lines=[x['properties'].get('line') for x in feats]
    # interchange groups: same name, close together
    byname=collections.defaultdict(list)
    for i,x in enumerate(feats): byname[norm(x['properties'].get('name'))].append(i)
    parent=list(range(len(feats)))
    def find(i):
        while parent[i]!=i: parent[i]=parent[parent[i]]; i=parent[i]
        return i
    for idx in byname.values():
        for a in idx:
            for b in idx:
                if a<b and math.dist(pts[a],pts[b])<=GROUP: parent[find(a)]=find(b)
    groups=collections.defaultdict(list)
    for i in range(len(feats)): groups[find(i)].append(i)
    target={}
    for members in groups.values():
        members=[i for i in members if lines[i] in routes]
        if not members: continue
        # each member's foot on its own line
        foot={i:nearest(pts[i],routes[lines[i]]) for i in members}
        # cluster members that sit together on lines running within PAR of
        # each other; at most one member per line, every pair close
        def compatible(x,y):
            if lines[x]==lines[y]: return False
            if math.dist(foot[x][1],foot[y][1])>2*PAR: return False
            return nearest(foot[x][1],routes[lines[y]])[0]<=PAR and nearest(foot[y][1],routes[lines[x]])[0]<=PAR
        assigned={}
        cl_list=[]
        for i in sorted(members,key=lambda i:foot[i][0]):
            for cl in cl_list:
                if all(compatible(i,j) for j in cl):
                    cl.append(i);break
            else: cl_list.append([i])
        clusters={id(cl):cl for cl in cl_list}
        for cl in clusters.values():
            cl_lines=sorted(set(lines[i] for i in cl))
            if len(cl_lines)==1:
                for i in cl:
                    dist,q=foot[i]
                    atend=any(math.dist(q,e)<1 for e in ends.get(lines[i],[]))
                    target[i]=(q,dist,'extend' if atend and dist>EXT_MIN else 'snap')
                continue
            c=(sum(pts[i][0] for i in cl)/len(cl),sum(pts[i][1] for i in cl)/len(cl))
            # start from the members' feet, then centre between the lines
            c=(sum(foot[i][1][0] for i in cl)/len(cl),sum(foot[i][1][1] for i in cl)/len(cl))
            qs=[nearest(c,routes[L])[1] for L in cl_lines]
            t=(sum(q[0] for q in qs)/len(qs),sum(q[1] for q in qs)/len(qs))
            for i in cl: target[i]=(t,foot[i][0],'centre')
    moved=0;flagged=[]
    newc={};extend={}
    for i,(t,dist,kind) in target.items():
        mv=math.dist(pts[i],t)
        if kind=='snap' and dist<TOL: continue
        if kind=='extend':
            if dist<=EXT_MAX:
                EXT.append((city,feats[i]['properties'].get('name'),lines[i],round(dist)))
                extend.setdefault(lines[i],[]).append((t,pts[i]))
            else:
                flagged.append((feats[i]['properties'].get('name'),lines[i],round(mv)))
            continue
        if kind=='centre' and mv<TOL: continue
        if mv>MAXMOVE:
            flagged.append((feats[i]['properties'].get('name'),lines[i],round(mv)));continue
        newc[i]=toLL(t); moved+=1; MOVES.append((city,feats[i]['properties'].get('name'),lines[i],kind,round(mv),round(dist)))
    totals['moved']+=moved; totals['flagged']+=len(flagged)
    report.append((city,moved,len(feats),flagged))
    if WRITE and extend:
        rraw=open(rp).read()
        def styles(o):
            yield json.dumps(o,indent=2,ensure_ascii=False)+'\n'
            yield json.dumps(o,indent=2,ensure_ascii=False)
            yield json.dumps(o,ensure_ascii=False,separators=(',',':'))
            yield json.dumps(o,indent=2)+'\n'
        dump=None
        for i,v in enumerate(styles(r)):
            if v==rraw: dump=i;break
        if dump is None:
            print('  (routes format unknown, extensions skipped)',city)
        else:
            for ln,items in extend.items():
                base=next(x['properties'] for x in r['features'] if x['properties'].get('line')==ln)
                for t,pt in items:
                    a=[round(c,6) for c in toLL(t)];b=[round(c,6) for c in toLL(pt)]
                    props={k:v for k,v in base.items() if k not in ('osm_route',)}
                    props['auto_filled']='station-extension'
                    r['features'].append({'type':'Feature','geometry':{'type':'LineString','coordinates':[a,b]},'properties':props})
            open(rp,'w').write(list(styles(r))[dump])
    if WRITE and newc:
        ms=list(COORD_RE.finditer(raw))
        assert len(ms)==len(feats),(city,len(ms),len(feats))
        out=[];last=0
        for i,m in enumerate(ms):
            if i not in newc: continue
            assert abs(float(m.group(2))-feats[i]['geometry']['coordinates'][0])<1e-9
            out.append(raw[last:m.start(2)]); out.append(fmt(newc[i][0])); out.append(m.group(3)); out.append(fmt(newc[i][1]))
            last=m.end(4)
        out.append(raw[last:])
        new=''.join(out)
        chk=json.loads(new)
        assert len(chk['features'])==len(feats)
        open(fp,'w').write(new)
for city,moved,n,fl in report:
    if moved or fl: print(f'{city.replace("/data",""):45s} moved {moved:4d}/{n:4d}  flagged {len(fl)}')
print(totals)

print('extensions',len(EXT))
