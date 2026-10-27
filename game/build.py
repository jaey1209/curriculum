from pathlib import Path
import json,base64
r=Path(__file__).resolve().parent
m=json.loads((r/'asset-manifest.json').read_text(encoding='utf-8'))
assets={}
for key,rel in m['assets'].items():
 p=r/rel;mime='image/webp' if p.suffix=='.webp' else 'image/png'
 assets[key]='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
def read(n):return (r/'src'/n).read_text(encoding='utf-8')
parts={'ASSETS':json.dumps(assets),'FRAMES':json.dumps(m['frames']),'PEOPLE':json.dumps(m['people'],ensure_ascii=False),'ICONS':json.dumps(m['icons']),'CSS':read('v4.css'),'STORY':read('v4-story.js'),'CORE':read('v4-core.js')+'\n'+read('v4-rewards.js'),'TASKS':read('v4-tasks.js')}
html=read('v4-index.html')
for k,v in parts.items():html=html.replace('__'+k+'__',v)
html=html.replace('</head>','<!-- Lucide icons license\n'+(r/'LUCIDE-LICENSE').read_text(encoding='utf-8')+'\n--></head>')
(r/'dist-v4').mkdir(exist_ok=True)
(r/'dist-v4/index.html').write_text(html,encoding='utf-8')
print('Built dist-v4/index.html')
