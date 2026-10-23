#!/usr/bin/env python3
"""Build the overhauled index.html from the original single-file game.
Original game: tools/base-original.html. Overhaul JS: tools/overhaul.js
Output: index.html in repo root. All artwork is original procedural
pixel art inspired by Minecraft's style — no Mojang assets are copied.
"""
import pathlib, re, sys
base = pathlib.Path(__file__).with_name('base-original.html').read_text()
over = pathlib.Path(__file__).with_name('overhaul.js').read_text()
s = base

def rep(old, new, n=1):
    global s
    assert s.count(old) >= 1, f"NOT FOUND: {old[:90]!r}"
    s = s.replace(old, new, n)

# ---------- 1. texture atlas becomes a 64x64 grid (4096 tiles) ----------
rep("ac.width=2048;ac.height=16", "ac.width=1024;ac.height=1024")
rep("ax.fillRect(t*16+x,y,1,1)", "ax.fillRect((t%64)*16+x,((t/64)|0)*16+y,1,1)")
rep("U.push((t+UVQ[k][0]*.98+.01)/128,UVQ[k][1])",
    "U.push(((t%64)+UVQ[k][0]*.98+.01)/64,((63-((t/64)|0))+UVQ[k][1]*.98+.01)/64)")
rep("(t+u.getX(i))/128,u.getY(i)", "((t%64)+u.getX(i))/64,((63-((t/64)|0))+u.getY(i))/64")
rep("x.drawImage(ac,t*16,0,16,16,0,0,16,16)", "x.drawImage(ac,(t%64)*16,((t/64)|0)*16,16,16,0,0,16,16)")

rep("const colH=(x,z)=>flat?20:Math.floor(16+fbm(x/96,z/96)*16+Math.pow(fbm(x/45+50,z/45),2)*28);",
    "const colH=(x,z)=>flat?20:Math.floor(13+fbm(x/96,z/96)*18+Math.pow(fbm(x/45+50,z/45),2)*30);")
# ---------- 2. world generation: biomes, deepslate, ores, lakes, species trees, flora ----------
old_gen_start = s.index("function gen(cx,cz)")
old_gen_end = s.index("return d}", old_gen_start) + len("return d}")
new_gen = r"""function gen(cx,cz){const d=new Uint16Array(CS*CS*H);
const WID=NID('Water'),LID=NID('Lava'),DS=NID('Deepslate');
const ORE=(deep,n)=>NID((deep?'Deepslate ':'')+n+' Ore');
for(let x=0;x<CS;x++)for(let z=0;z<CS;z++){const wx=cx*CS+x,wz=cz*CS+z,h=colH(wx,wz),B=bio(wx,wz);for(let y=0;y<=h;y++){let id=3;if(y==0)id=16;else if(y==h){id=flat?1:(h<=19?4:B==2?4:B==3||h>46?22:1)}else if(y>=h-3)id=h<=19||B==2?4:2;else{const deep=y<12,r=hash(wx,y,wz);id=deep?DS:3;
if(y>4&&y<h-4&&vn(wx/9+y/6,wz/9-y/5)>.7&&vn(wx/7+y/5+9,wz/7+y/9)>.5){if(y<7)d[(y*CS+z)*CS+x]=LID;continue}
if(deep){if(r>.9965)id=ORE(1,'Diamond');else if(r>.992)id=ORE(1,'Redstone');else if(r>.988)id=ORE(1,'Lapis Lazuli');else if(r>.982)id=ORE(1,'Gold');else if(r>.972)id=ORE(1,'Iron');else if(r>.962)id=ORE(1,'Copper');else if(r>.955&&y<8)id=ORE(1,'Emerald');else if(r>.945)id=ORE(1,'Coal')}
else{if(y<24&&r<.003)id=15;else if(y<14&&r>.9987)id=21;else if(y<30&&r>.996)id=NID('Gold Ore');else if(y<32&&r>.99)id=NID('Redstone Ore');else if(y<36&&r>.984)id=NID('Lapis Lazuli Ore');else if(y<40&&r>.978)id=NID('Copper Ore');else if(r>.968)id=20;else if(r>.958)id=19;else if(r>.945)id=18;else if(r>.90&&r<.915)id=NID(B==3?'Granite':B==2?'Sandstone':'Andesite')}}
d[(y*CS+z)*CS+x]=id}
if(!flat&&h<19)for(let y=h+1;y<=19;y++)d[(y*CS+z)*CS+x]=WID}
const put=(x,y,z,id)=>{x-=cx*CS;z-=cz*CS;if(x<0||z<0||x>=CS||z>=CS||y>=H)return;const i=(y*CS+z)*CS+x;if(!d[i]||id==5)d[i]=id};
/* trees & flora per biome */
for(let wx=cx*CS-2;wx<cx*CS+CS+2;wx++)for(let wz=cz*CS-2;wz<cz*CS+CS+2;wz++){const h=colH(wx,wz),B=bio(wx,wz);if(flat||h<20||h>44)continue;const rh=hash(wx,wz,77);
if(B==2){ /* desert: cactus + dead bush */
  if(rh<.008){const ch=3+(hash(wx,wz,79)*2|0);for(let i=1;i<=ch;i++)put(wx,h+i,wz,NID('Cactus'))}
  else if(rh<.02)put(wx,h+1,wz,NID('Dead Bush'));continue}
const density=[.012,.045,0,.007][B];if(rh>density){ /* ground flora */
  if(B!=3&&rh<density+.05){const fl=['Dandelion','Poppy','Cornflower','Oxeye Daisy','Azure Bluet','Red Tulip','Orange Tulip','White Tulip','Pink Tulip','Allium','Blue Orchid','Lily of the Valley'][hash(wx,wz,81)*12|0];put(wx,h+1,wz,NID(fl)||NID('Poppy'))}
  else if(B!=3&&rh<density+.11)put(wx,h+1,wz,NID(hash(wx,wz,82)>.5?'Tall Grass':'Fern'));continue}
const spruce=B==3,birch=B==1&&hash(wx,wz,83)>.55;
const LOG=NID(spruce?'Spruce Log':birch?'Birch Log':'Oak Log'),LEAF=NID(spruce?'Spruce Leaves':birch?'Birch Leaves':'Oak Leaves');
const th=spruce?6+(hash(wx,wz,78)*3|0):4+Math.floor(hash(wx,wz,78)*2);
for(let i=1;i<=th;i++)put(wx,h+i,wz,LOG);
if(spruce){for(let c=th-2;c<=th+2;c++){const rad=c>th?0:c>th-1?1:2;for(let a=-rad;a<=rad;a++)for(let b=-rad;b<=rad;b++){if(Math.abs(a)==rad&&Math.abs(b)==rad&&hash(wx+a,wz+b,c)>.5)continue;put(wx+a,h+1+c,wz+b,LEAF)}}}
else{for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(let c=th-1;c<=th+1;c++){if(c==th+1&&(Math.abs(a)>1||Math.abs(b)>1))continue;if(Math.abs(a)==2&&Math.abs(b)==2)continue;put(wx+a,h+1+c,wz+b,LEAF)}}}
return d}"""
s = s[:old_gen_start] + new_gen + s[old_gen_end:]

# flowers name used above that may not exist -> add Oxeye Daisy via overhaul NEWBLOCKS check in overhaul.js

# ---------- 3. fluids are non-solid, not ray targets; swimming ----------
rep("for(let k=Math.floor(z-w);k<=Math.floor(z+w);k++)if(get(i,j,k))return true;return false}",
    "for(let k=Math.floor(z-w);k<=Math.floor(z+w);k++){const b=get(i,j,k);if(b&&b!=NID('Water')&&b!=NID('Lava'))return true}return false}")
rep("if(get(x,y,z))return{x,y,z,px,py,pz}",
    "const _b=get(x,y,z);if(_b&&_b!=NID('Water')&&_b!=NID('Lava'))return{x,y,z,px,py,pz}")
rep("if(P.fly)P.vy=((keys.Space?1:0)-(sneak?1:0))*sp*.6;else{P.vy=Math.max(P.vy-32*dt,-60);if(keys.Space&&P.g)P.vy=9}",
    """const _bw=get(Math.floor(P.x),Math.floor(P.y+.4),Math.floor(P.z)),_inW=_bw==NID('Water'),_inL=_bw==NID('Lava');
if(P.fly)P.vy=((keys.Space?1:0)-(sneak?1:0))*sp*.6;else if(_inW||_inL){P.vy=Math.max(P.vy-10*dt,-3);if(keys.Space)P.vy=3.6;if(_inL&&mode=='survival'){P._lt=(P._lt||0)+dt;if(P._lt>.5){P._lt=0;dmg(2)}}}else{P.vy=Math.max(P.vy-32*dt,-60);if(keys.Space&&P.g)P.vy=9}""")

# ---------- 4. tools: mining speed + weapon damage + armor ----------
rep("const need=mode=='creative'?.2:hd*1.5;",
    "let need=mode=='creative'?.2:hd*1.5;{const _t=heldTool(),_cat=blockToolCat(NAMES[id]);if(_t&&mode!='creative')need/=_t.type==_cat?_t.speed:.8}")
rep("best.hp-=mode=='creative'?20:2;",
    "best.hp-=mode=='creative'?20:(heldTool()?heldTool().dmg:2);sfx(best.t=='creeper'?180:320,.08,'square',.04);")
rep("function dmg(n){if(mode!='survival')return;",
    "function dmg(n){if(mode!='survival')return;n=Math.max(1,Math.round(n*(1-Math.min(.6,armorPoints()*.04))));sfx(120,.15,'sawtooth',.05);")

# ---------- 5. block interactions: furnace smelting, beds, chests ----------
rep("if(!sneak){if(id==14){m.on^=1;setB(h.x,h.y,h.z,14,m);return}",
    """if(!sneak){if(id==NID('Furnace')){const _in=held(),_out=_in&&SMELT[NAMES[_in]];if(_out&&have(_in)){if((inv[NID('Coal')]||0)>0||mode=='creative'){if(mode=='survival'){inv[_in]--;if((inv[NID('Coal')]||0)>0)inv[NID('Coal')]--}inv[NID(_out)]=(inv[NID(_out)]||0)+1;sfx(520,.2,'triangle',.05);msg('Smelted → '+_out);hud()}else msg('Furnace needs Coal as fuel')}else msg('Hold something smeltable (raw ore / food / sand…)');return}
if(id==NID('White Bed')||id==NID('Red Bed')||id==NID('Blue Bed')||id==NID('Black Bed')){T=1000;msg('You slept until morning');return}
if(id==NID('Chest')||id==NID('Barrel')){const _m=m&&m.items?m:{items:[]};if(t&&have(t)&&!ITEM[t]||t&&have(t)){_m.items.push(t);if(mode=='survival')inv[t]--;setB(h.x,h.y,h.z,id,_m);msg('Stored '+NAMES[t]+' ('+_m.items.length+' inside)')}else if(_m.items&&_m.items.length){const _g=_m.items.pop();inv[_g]=(inv[_g]||0)+1;setB(h.x,h.y,h.z,id,_m);msg('Took '+NAMES[_g])}hud();return}
if(id==14){m.on^=1;setB(h.x,h.y,h.z,14,m);return}""")

# ---------- 6. mobs: many new species + biome/night spawn tables ----------
rep("dr:['Gunpowder']}};",
    """dr:['Gunpowder']},
cat:{hp:10,h:.7,sp:1.7,c:quad(0xd88a33,0xe09a44,.28,.55,.22,.3,[[.06,.3,.06,0,.55,-.3,0xd88a33]]),dr:['String']},
fox:{hp:10,h:.8,sp:2.2,c:quad(0xd8722c,0xf0f0f0,.32,.65,.25,.32,[[.07,.35,.07,0,.6,-.36,0xf0f0f0]]),dr:['Sweet Berries']},
goat:{hp:10,h:1.1,sp:1.6,c:quad(0xb9b3a8,0xcac4b8,.45,.8,.4,.4,[[.05,.18,.05,.1,1.0,.2,0x888078],[.05,.18,.05,-.1,1.0,.2,0x888078]]),dr:['Mutton']},
frog:{hp:10,h:.5,sp:1.4,hop:1,c:quad(0x6fae4a,0x86c45c,.4,.5,.18,.22),dr:['Slimeball']},
panda:{hp:20,h:1.3,sp:1,c:quad(0xf2f2f2,0xf8f8f8,.65,1,.5,.45,[[.16,.14,.16,.2,1.12,.18,0x222222],[.16,.14,.16,-.2,1.12,.18,0x222222]]),dr:['Bamboo']},
llama:{hp:20,h:1.7,sp:1.4,c:quad(0xd8cbb2,0xe4dac4,.5,1,.85,.4,[[.14,.5,.14,0,1.65,.42,0xd8cbb2]]),dr:['Leather']},
turtle:{hp:30,h:.6,sp:.8,swim:1,c:quad(0x5d8a4a,0x7aa85e,.7,.9,.22,.3),dr:['Seagrass']},
squid:{hp:10,h:1,sp:1.2,swim:1,c:[[.55,.7,.55,0,.55,0,0x3a5a8c],[.08,.5,.08,.2,.05,.15,0x3a5a8c],[.08,.5,.08,-.2,.05,.15,0x3a5a8c],[.08,.5,.08,.2,.05,-.15,0x3a5a8c],[.08,.5,.08,-.2,.05,-.15,0x3a5a8c]],dr:['Ink Sac']},
bee:{hp:10,h:.6,sp:1.8,fly:1,neu:1,dm:1,c:[[.42,.36,.5,0,.4,0,0xe8b830],[.46,.1,.2,0,.5,.2,0x3a2c18],[.3,.04,.24,.16,.62,.1,0xffffff],[.3,.04,.24,-.16,.62,.1,0xffffff]],dr:['Honey Bottle']},
bat:{hp:6,h:.7,sp:2.4,fly:1,c:[[.24,.3,.24,0,.45,0,0x4a3a32],[.5,.04,.3,.3,.5,.1,0x3a2c26],[.5,.04,.3,-.3,.5,.1,0x3a2c26]],dr:[]},
witch:{hp:26,h:1.9,sp:1.8,hos:1,dm:3,c:hum(0x9a7ab0,0x4a2c6a,0x3a2050),dr:['Glowstone Dust','Sugar']},
pillager:{hp:24,h:1.9,sp:2.2,hos:1,dm:3,c:hum(0x8a8a92,0x5a5a62,0x3f3f46),dr:['Emerald','Arrow']},
husk:{hp:20,h:1.9,sp:2.1,hos:1,dm:3,c:hum(0xb09a72,0x8a7a58,0x6a5c44),dr:['Rotten Flesh']},
stray:{hp:20,h:1.9,sp:2.2,hos:1,dm:2,c:hum(0xaebdc4,0x8ea2ac,0x71848f),dr:['Bone','Arrow']},
drowned:{hp:20,h:1.9,sp:2,hos:1,dm:3,swim:1,c:hum(0x4f9a8a,0x2f7a6a,0x3a5a7a),dr:['Rotten Flesh','Copper Ingot']},
cave_spider:{hp:12,h:.7,sp:3.2,hos:1,dm:2,c:[[.6,.32,.6,0,.26,0,0x2c3e50],[.4,.32,.4,0,.26,.45,0x24333f],[1.1,.05,.08,0,.18,.12,0x24333f],[1.1,.05,.08,0,.18,-.12,0x24333f],[.09,.09,.02,.1,.34,.62,0x33ccff],[.09,.09,.02,-.1,.34,.62,0x33ccff]],dr:['String','Spider Eye']},
blaze:{hp:20,h:1.8,sp:2,hos:1,dm:4,fly:1,c:[[.34,.4,.34,0,1.2,0,0xf8c832],[.08,.7,.08,.3,.5,.3,0xe89a20],[.08,.7,.08,-.3,.5,.3,0xe89a20],[.08,.7,.08,.3,.5,-.3,0xe89a20],[.08,.7,.08,-.3,.5,-.3,0xe89a20]],dr:['Blaze Rod']},
silverfish:{hp:8,h:.4,sp:2.4,hos:1,dm:1,c:quad(0x9a9aa2,0xaaaab2,.24,.5,.14,.16),dr:[]},
endermite:{hp:8,h:.4,sp:2,hos:1,dm:2,c:quad(0x5a3a7a,0x6a4a8a,.24,.45,.14,.16),dr:[]},
goat_kid:{hp:10,h:1.1,sp:1.6,c:quad(0xb9b3a8,0xcac4b8,.45,.8,.4,.4),dr:['Mutton']}};""")
rep("SPB=[['pig','cow','sheep','chicken','horse','villager'],['pig','cow','wolf','rabbit','sheep'],['rabbit','horse'],['wolf','rabbit','sheep']],NIT=['zombie','creeper','spider','skeleton','enderman','slime']",
    "SPB=[['pig','cow','sheep','chicken','horse','villager','cat','llama','goat'],['pig','cow','wolf','rabbit','sheep','fox','bee','frog','panda'],['rabbit','horse','cat','fox'],['wolf','rabbit','sheep','goat','fox']],NIT=['zombie','creeper','spider','skeleton','enderman','slime','witch','pillager','husk','stray','cave_spider','silverfish','endermite','blaze']")

# mob legs + walk phase in addMob
rep("scene.add(g);mobs.push({t,x,y,z,vy:0,hp:d.hp,g,mats,dir:Math.random()*6.28,tm:0,fuse:0,atk:0,kx:0,kz:0,gnd:0,mv:0,hurt:0,dead:0,ang:0})}",
    "scene.add(g);const legs=g.children.filter(m=>m.geometry.parameters.height>=.25&&m.geometry.parameters.width<=.32&&m.position.y<.8);mobs.push({t,x,y,z,vy:0,hp:d.hp,g,mats,legs,ph:Math.random()*6,dir:Math.random()*6.28,tm:0,fuse:0,atk:0,kx:0,kz:0,gnd:0,mv:0,hurt:0,dead:0,ang:0})}")
# aquatic / flying spawning + behaviour + walk animation
rep("if(!get(x,y,z)&&!get(x,y+1,z)){const l=nite?NIT:SPB[bio(x,z)];addMob(l[Math.random()*l.length|0],x+.5,y,z+.5)}",
    "if(!get(x,y,z)&&!get(x,y+1,z)){const inWater=get(x,y-1,z)==NID('Water');const l=inWater?['squid','turtle','drowned']:nite?NIT:SPB[bio(x,z)];addMob(l[Math.random()*l.length|0],x+.5,y,z+.5)}")
rep("m.vy=Math.max(m.vy-32*dt,-40);const ny=m.y+m.vy*dt;m.gnd=0;if(!hit(m.x,ny,m.z,.3,h))m.y=ny;else{if(m.vy<0)m.gnd=1;m.vy=0}",
    """if(d.fly){m.ph+=dt*3;m.vy=0;const ty=m.y+Math.sin(m.ph)*.35*dt*3;if(!hit(m.x,ty,m.z,.3,h))m.y=ty;m.gnd=1}
else if(d.swim&&get(Math.floor(m.x),Math.floor(m.y+.3),Math.floor(m.z))==NID('Water')){m.vy=Math.max(m.vy-6*dt,-1.2);const ny=m.y+m.vy*dt;if(!hit(m.x,ny,m.z,.3,h))m.y=ny;m.gnd=1}
else{m.vy=Math.max(m.vy-32*dt,-40);const ny=m.y+m.vy*dt;m.gnd=0;if(!hit(m.x,ny,m.z,.3,h))m.y=ny;else{if(m.vy<0)m.gnd=1;m.vy=0}}
if(sp>0)m.ph+=dt*sp*3.2;if((d.hop||m.t=='frog')&&m.gnd&&sp)m.vy=6;
m.legs&&m.legs.forEach((L,i)=>{L.rotation.x=Math.sin(m.ph+(i%2?Math.PI:0))*(sp?.55:.05)})""")
# creeper hiss
rep("if(m.t=='creeper'){if(chase&&dist<3){m.fuse+=dt;",
    "if(m.t=='creeper'){if(chase&&dist<3){if(!m._hiss){m._hiss=1;sfx(900,.4,'sawtooth',.02)}m.fuse+=dt;")

# ---------- 7. inject overhaul (textures/items/blocks/recipes) before first newWorld() ----------
rep("\nnewWorld();playing=false;hud();", "\n" + over + "\nnewWorld();playing=false;hud();")

# ---------- 8. honest title/menu copy + help ----------
rep("<title>Minecraft Java Edition 1.20.2</title>", "<title>Voxel Wilds — Expanded</title>")
rep("Minecraft 1.20.2</div>", "Voxel Wilds Expanded \u00b7 fan-made prototype</div>")
rep("Copyright Mojang AB. Do not distribute!", "Original pixel artwork \u00b7 not affiliated with Mojang")
rep("On phones: joystick, drag to look, on-screen buttons.</div>", "On phones: joystick, drag to look, on-screen buttons.<br><br>OVERHAUL: 500+ blocks/items with unique pixel-art tiles, wood/stone/ore families, lakes &amp; lava, biome trees &amp; flowers, 34 animated mobs (walk/fly/swim), working tools (mine faster, hit harder), armor that reduces damage, furnace smelting (right-click a Furnace holding raw ore/food with coal in inventory), chests that store items, and beds that skip to morning.</div>")

out = pathlib.Path('index.html')
out.write_text(s)
print("written", out, len(s))
