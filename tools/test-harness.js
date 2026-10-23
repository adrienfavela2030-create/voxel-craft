// Headless logic test: stubs DOM/THREE, runs the real game script, validates registries.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
let code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).pop();
code += `\n;globalThis.__T={NAMES,TX,TP,ITEM,DROP,HD,NID,RC,MD,gen,colH,bio,TOOLDEF,SMELT,painterFor,NEWBLOCKS,match,cg};`;

function ctx2d(){return{fillStyle:'',globalAlpha:1,fillRect(){},clearRect(){},drawImage(){},fillText(){},setTransform(){},measureText:()=>({width:10}),canvas:null}}
function canvas(){const c={width:0,height:0,style:{},getContext:()=>ctx2d(),toDataURL:()=>'data:,',addEventListener(){}};return c}
class El{
  constructor(){this.style={};this.children=[];this.dataset={};this.classList={add(){},remove(){},toggle(){},contains:()=>false};this.value='';this.textContent='';this.innerHTML='';}
  getContext(){return ctx2d()} addEventListener(){} appendChild(){} prepend(){} querySelector(){return new El()} closest(){return null} focus(){} blur(){} setSelectionRange(){} getBoundingClientRect(){return{left:0,top:0,width:100,height:100}}
}
const els={};
const documentStub={querySelector:s=>els[s]||(els[s]=new El()),createElement:t=>t==='canvas'?canvas():new El(),body:new El(),documentElement:new El(),addEventListener(){}};
documentStub.body.prepend=()=>{}; documentStub.documentElement.style={setProperty(){}};
class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}lerp(v,f){return this}}
class Color{constructor(c){this.c=c}set(){return this}setRGB(){return this}copy(){return this}setScalar(){return this}setHex(){return this}}
class Geo{constructor(...a){this.parameters={width:a[0]||1,height:a[1]||1,depth:a[2]||1};this.attributes={uv:{count:24,getX:()=>0,getY:()=>0,setXY(){}}}}setAttribute(){}setIndex(){}dispose(){}}
class Mat{constructor(o={}){Object.assign(this,o)}dispose(){}}
class Mesh{constructor(g,m){this.geometry=g;this.material=m;this.position=new V3();this.rotation={x:0,y:0,z:0};this.scale={setScalar(){},set(){}}}lookAt(){}}
class Group{constructor(){this.children=[];this.position=new V3();this.rotation={x:0,y:0,z:0};this.scale={setScalar(){}}}add(m){this.children.push(m)}}
const THREE={WebGLRenderer:class{constructor(){this.domElement=canvas()}setPixelRatio(){}setSize(){}render(){}},
Scene:class{constructor(){this.background=new Color();this.fog={color:new Color()}}add(){}},
PerspectiveCamera:class{constructor(){this.position=new V3();this.rotation={order:'',set(x,y,z){this.x=x;this.y=y;this.z=z}}}updateProjectionMatrix(){}getWorldDirection(v){v.set(0,0,-1);return v}},
CanvasTexture:class{constructor(c){this.repeat={set(){}};this.offset={x:0};this.wrapS=0;this.wrapT=0}},
MeshBasicMaterial:Mat,MeshLambertMaterial:Mat,LineBasicMaterial:Mat,SpriteMaterial:Mat,
Mesh,Group,BoxGeometry:Geo,EdgesGeometry:Geo,PlaneGeometry:Geo,BufferGeometry:Geo,LineSegments:Mesh,
Float32BufferAttribute:class{},AmbientLight:class{constructor(){this.intensity=1}},DirectionalLight:class{constructor(){this.intensity=1;this.position=new V3()}},
Color,V3:undefined,Vector3:V3,Fog:class{constructor(){this.color=new Color()}},Sprite:class extends Mesh{}};
const sandbox={console,Math,JSON,Object,Array,Map,Set,Uint16Array,Number,String,Boolean,Date,performance:{now:()=>0},devicePixelRatio:1,innerWidth:800,innerHeight:600,
document:documentStub,THREE,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){},removeItem(){}},BroadcastChannel:class{constructor(){}postMessage(){}close(){}set onmessage(f){}},
addEventListener(){},requestAnimationFrame(){},setTimeout:()=>0,clearTimeout(){},location:{},navigator:{}};
sandbox.window=sandbox; sandbox.globalThis=sandbox; sandbox.self=sandbox;
els['#seed']=Object.assign(new El(),{value:'12345'}); els['#gm']=Object.assign(new El(),{value:'creative'});
vm.createContext(sandbox);
try{ vm.runInContext(code,sandbox,{filename:'game.js'}); }catch(e){ console.error('RUNTIME ERROR:',e); process.exit(1); }
const T=sandbox.__T; let fail=0; const bad=m=>{console.log('FAIL',m);fail++};
// registry integrity
console.log('NAMES',T.NAMES.length,'tiles TP',T.TP.length,'recipes',T.RC.length,'mobs',Object.keys(T.MD).length);
for(let i=1;i<T.NAMES.length;i++){ if(i==14||i==17)continue; if(!T.TX[i]){bad('missing TX '+i+' '+T.NAMES[i]);continue}
  for(const t of T.TX[i]) if(t==null||t<0||t>=T.TP.length) bad('bad tile idx '+T.NAMES[i]+' '+t);
  if(T.DROP[i]!=null&&T.DROP[i]<0) bad('bad drop '+T.NAMES[i]); }
// duplicate tile sets between blocks (excluding item/flat icons & intentional face variants)
const seen=new Map(); let dup=0;
for(let i=1;i<T.NAMES.length;i++){ if(T.ITEM[i]||!T.TX[i])continue; const k=T.TX[i].join(','); if(seen.has(k)){dup++; if(dup<8)console.log('dup tiles:',T.NAMES[seen.get(k)],'==',T.NAMES[i])} else seen.set(k,i); }
console.log('blocks sharing identical face-tile sets:',dup);
// painter distinctness: sample output hash per block side tile painter
function sig(f){let h=0;for(let y=0;y<16;y+=3)for(let x=0;x<16;x+=3){const c=f(x,y,.37);h=(h*31+((c[0]|0)*3+(c[1]|0)*5+(c[2]|0)*7+((c[3]??255))))>>>0}return h}
const sigs=new Map(); let psame=0;
for(let i=1;i<T.NAMES.length;i++){ if(T.ITEM[i]||!T.TX[i])continue; const sg=sig(T.TP[T.TX[i][2]]); if(sigs.has(sg)){psame++; if(psame<8)console.log('same-looking side:',T.NAMES[sigs.get(sg)],'~',T.NAMES[i])} else sigs.set(sg,i); }
console.log('blocks with identical sampled side pixels:',psame);
// mob drops resolve
for(const k in T.MD) for(const d of T.MD[k].dr) if(T.NID(d)<0) bad(`mob ${k} drop '${d}' not an item/block`);
// recipes resolve
for(const r of T.RC){ if(r[0]<0)bad('recipe output -1'); for(const k in r[2]) if(+k<0)bad('recipe ingredient -1 in '+T.NAMES[r[0]]); }
// tools
console.log('tools defined:',Object.keys(T.TOOLDEF||{}).length);
// terrain gen: spawn chunk contents census
const d=T.gen(0,0); const census={}; for(const v of d) census[v]=(census[v]||0)+1;
const names=Object.entries(census).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([id,c])=>`${T.NAMES[id]||id}:${c}`);
console.log('chunk(0,0) top blocks:',names.join(' '));
if(!census[T.NID('Water')]) console.log('note: no water in chunk 0,0 (check other chunks)');
let waterChunks=0,trees=0; for(let a=-3;a<4;a++)for(let b=-3;b<4;b++){const dd=T.gen(a,b);let w=0;for(const v of dd){if(v==T.NID('Water'))w++;if(v==T.NID('Oak Log')||v==T.NID('Spruce Log')||v==T.NID('Birch Log'))trees++} if(w)waterChunks++}
console.log('chunks with water (of 49):',waterChunks,'tree log blocks:',trees);
console.log(fail?`\n${fail} FAILURES`:'\nALL CHECKS PASSED');
process.exit(fail?1:0);
