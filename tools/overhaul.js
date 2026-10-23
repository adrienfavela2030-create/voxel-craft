/* ============================================================
   VOXEL WILDS OVERHAUL — original Minecraft-inspired pixel art.
   Every block gets its OWN procedurally-painted 16x16 tile(s)
   (no shared tiles between unrelated blocks), distinct faces
   for grass/logs/furnaces/etc, drawn item icons (tools, armor,
   food, materials), plus functional tools, smelting, water,
   lava, new biomes flora, and an expanded bestiary.
   ============================================================ */
const DYE16={White:[236,236,236],Orange:[216,118,52],Magenta:[178,76,180],LightBlue:[95,156,205],'Light Blue':[95,156,205],Yellow:[238,205,45],Lime:[112,185,45],Pink:[225,140,165],Gray:[70,70,70],LightGray:[160,165,165],'Light Gray':[160,165,165],Cyan:[35,135,155],Purple:[120,60,180],Blue:[50,70,180],Brown:[110,70,40],Green:[80,115,35],Red:[165,40,35],Black:[28,25,30]};
const WOOD16={Oak:{bark:[106,84,50],bark2:[88,68,40],plank:[176,142,88],leaf:[62,142,44]},Birch:{bark:[216,210,200],bark2:[180,175,165],plank:[198,182,130],leaf:[86,160,60]},Spruce:{bark:[66,48,30],bark2:[52,38,24],plank:[112,80,48],leaf:[38,92,40]},Jungle:{bark:[92,74,42],bark2:[74,58,32],plank:[168,128,82],leaf:[52,150,40]},Acacia:{bark:[104,96,90],bark2:[86,78,72],plank:[176,100,54],leaf:[94,148,44]},'Dark Oak':{bark:[58,42,26],bark2:[44,32,20],plank:[76,54,30],leaf:[44,110,34]},Mangrove:{bark:[96,70,52],bark2:[78,56,42],plank:[142,62,52],leaf:[64,130,44]},Cherry:{bark:[52,38,44],bark2:[40,28,34],plank:[232,178,178],leaf:[240,170,195]},Bamboo:{bark:[150,160,70],bark2:[120,132,54],plank:[196,178,96],leaf:[90,170,60]},Crimson:{bark:[92,32,52],bark2:[72,24,40],plank:[150,52,78],leaf:[170,40,60]},Warped:{bark:[24,92,92],bark2:[18,72,72],plank:[44,150,140],leaf:[30,170,150]},'Pale Oak':{bark:[196,190,178],bark2:[168,162,150],plank:[206,198,184],leaf:[150,168,140]}};
const MINERAL={Coal:[38,38,38],Iron:[216,165,133],Copper:[224,122,79],Gold:[252,238,94],Diamond:[95,242,224],Emerald:[47,211,95],Lapis:[47,95,208],'Lapis Lazuli':[47,95,208],Redstone:[255,26,26],Quartz:[238,230,220],'Ancient Debris':[120,80,66]};
const shs=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const dk=(c,f)=>c.map(v=>Math.max(0,Math.min(255,v*f|0)));
const NZ=(c,v,r)=>nz(c,v,r);
/* generic painter factory: spec -> (x,y,r)=>rgba */
function pBase(c,v=26,seed=1){return (x,y,r)=>NZ(c,v,hash(x,y,seed)+r*.6)}
function pSpeck(c,spots,v=22){return (x,y,r)=>{const h=hash(x>>1,y>>1,shs(c.join())&63);for(const[s,col]of spots)if(h<s)return NZ(col,18,r);return NZ(c,v,r)}}
function pOre(host,mineral,seed){return (x,y,r)=>{const cx=x>>1,cy=y>>1,h=hash(cx,cy,seed);if(h>.62){const edge=(x%2==0&&hash(cx-1,cy,seed)<=.62)||(y%2==0&&hash(cx,cy-1,seed)<=.62);return NZ(edge?dk(mineral,.72):mineral,20,r)}return NZ(host,20,r)}}
function pPlanks(c,seed){return (x,y,r)=>{if(y%4==3)return NZ(dk(c,.62),14,r);if((x+((y>>2)%2)*5)%8==7&&y%4!=3)return NZ(dk(c,.7),14,r);const g=hash(x,y>>1,seed);return NZ(g>.86?dk(c,1.12):c,20,r)}}
function pLogSide(bark,bark2,seed){return (x,y,r)=>{const s=hash(x,0,seed);const c=(x%4==0||s>.82)?bark2:bark;return NZ(x%4==0?dk(c,.8):c,22,r)}}
function pLogTop(c,bark){return (x,y,r)=>{const d=Math.max(Math.abs(x-7.5),Math.abs(y-7.5))|0;if(d>=7)return NZ(bark,18,r);return NZ(d%2?dk(c,1.06):dk(c,.88),16,r)}}
function pLeaves(c,seed){return (x,y,r)=>{const h=hash(x,y,seed);if(h>.93)return[0,0,0,0];if(h>.62)return NZ(dk(c,.62),30,r);if(h<.16)return NZ(dk(c,1.25),26,r);return NZ(c,30,r)}}
function pBricks(c,mortar,seed,bw=8,bh=4){return (x,y,r)=>{const row=y/bh|0;if(y%bh==bh-1||(x+((row%2)*bw/2))%bw==bw-1)return NZ(mortar,14,r);return NZ(c,22,hash(x>>2,y>>1,seed)*.5+r*.5)}}
function pGlass(c){return (x,y,r)=>{if(x==0||y==0||x==15||y==15)return[...dk(c,1.05),230];if(x==y&&x>2&&x<7||x==y-1&&x>8&&x<12)return[235,250,255,120];return[...c,36]}}
function pCross(draw){return (x,y,r)=>draw(x,y,r)||[0,0,0,0]}
function plantPainter(stem,petal,seed){return pCross((x,y,r)=>{if(x==7&&y>7)return NZ(stem,16,r);if(y>9&&(x==5||x==9))return NZ(dk(stem,1.15),16,r);const d=Math.hypot(x-7.5,y-4.5);if(d<3.1)return NZ(petal,18,r);if(d<4.1&&hash(x,y,seed)>.35)return NZ(dk(petal,.8),18,r);if(Math.hypot(x-7.5,y-4.5)<1.1)return[250,220,90,255];return null})}
function pGrassSide(seed){return (x,y,r)=>{const depth=3+((hash(x,0,seed)*3)|0);if(y<depth)return NZ(y<depth-1?[86,166,58]:[74,140,48],26,r);return NZ([134,96,67],30,hash(x,y,seed)*.6+r*.4)}}
function pMetal(c,seed){return (x,y,r)=>{if(x==0||y==0||x==15||y==15)return NZ(dk(c,.66),12,r);if(x==1||y==1||x==14||y==14)return NZ(dk(c,1.18),12,r);if((x==3||x==12)&&(y==3||y==12))return NZ(dk(c,.6),10,r);return NZ(c,14,r)}}
function pWater(seed){return (x,y,r)=>{const w=Math.sin((x+y*.5)/3+seed)*10;return[64+w,140+w,235,205]}}
function pLava(seed){return (x,y,r)=>{const h=hash(x>>1,y>>1,seed);return NZ(h>.75?[255,205,60]:h>.4?[248,120,25]:[215,60,12],26,r)}}
/* choose a unique painter for a block name + face (0 top,1 bottom,2 side) */
function painterFor(name,face){
  const n=name,seed=shs(n)%90+3;
  let woodKey=Object.keys(WOOD16).find(w=>n.startsWith(w+' ')||n==w);
  if(/Grass Block|^Grass$/.test(n))return face==0?pBase([94,172,60],30,seed):face==1?pBase([134,96,67],32,seed):pGrassSide(seed);
  if(n=='Dirt')return pSpeck([134,96,67],[[.14,[112,78,52]],[.08,[160,120,86]]],30);
  if(n=='Coarse Dirt')return pSpeck([122,88,60],[[.25,[104,72,46]],[.12,[168,132,96]]],32);
  if(n=='Podzol')return face==2?pGrassSide(seed):pSpeck([106,80,44],[[.3,[86,62,34]]],28);
  if(n=='Mycelium')return face==2?pGrassSide(seed):pSpeck([128,110,122],[[.2,[240,240,230]],[.3,[105,88,102]]],24);
  if(woodKey&&(n.includes('Log')||n.includes('Wood')||n.includes('Stem'))){const W=WOOD16[woodKey];return face==0||face==1?pLogTop(W.plank,W.bark):pLogSide(W.bark,W.bark2,seed)}
  if(woodKey&&n.includes('Leaves'))return pLeaves(WOOD16[woodKey].leaf,seed);
  if(woodKey&&n.includes('Planks'))return pPlanks(WOOD16[woodKey].plank,seed);
  if(n.includes('Leaves'))return pLeaves([62,142,44],seed);
  if(n=='Stone')return pSpeck([128,128,128],[[.12,[112,112,112]],[.06,[145,145,145]]],20);
  if(n=='Cobblestone')return (x,y,r)=>{const cx=x>>2,cy=y>>2,h=hash(cx,cy,seed);if(x%4==3||y%4==3)return NZ([88,88,88],16,r);return NZ(h>.5?[138,138,138]:[118,118,118],24,r)};
  if(n=='Mossy Cobblestone')return (x,y,r)=>{const cx=x>>2,cy=y>>2,h=hash(cx,cy,seed);if(x%4==3||y%4==3)return NZ([80,88,66],16,r);return NZ(h>.45?[120,128,104]:[116,116,116],24,r)};
  if(n=='Deepslate'||n=='Polished Deepslate')return (x,y,r)=>NZ(y%4==1?[86,86,96]:[72,72,82],18,hash(x,y>>1,seed)*.6+r*.4);
  if(n=='Cobbled Deepslate')return (x,y,r)=>{if(x%4==3||y%4==3)return NZ([52,52,62],14,r);return NZ([78,78,90],20,hash(x>>2,y>>2,seed)*.5+r*.5)};
  if(n.includes('Deepslate')&&n.includes('Ore')){const m=Object.keys(MINERAL).find(k=>n.includes(k))||'Iron';return pOre([74,74,84],MINERAL[m],seed)}
  if(n.includes('Ore')||n=='Ancient Debris'){const m=Object.keys(MINERAL).find(k=>n.includes(k));if(m)return pOre(n.startsWith('Nether')?[122,52,44]:[128,128,128],MINERAL[m],seed)}
  if(n=='Bedrock')return (x,y,r)=>NZ(hash(x>>2,y>>2,seed)>.5?[86,86,86]:[52,52,52],26,r);
  if(n=='Sand')return pSpeck([219,207,164],[[.12,[198,184,138]],[.05,[150,60,40]]],18);
  if(n=='Red Sand')return pSpeck([190,100,55],[[.12,[170,84,44]]],18);
  if(n=='Gravel')return pSpeck([132,126,124],[[.2,[104,98,96]],[.14,[168,160,154]],[.08,[88,80,76]]],24);
  if(n=='Sandstone')return face==0?pSpeck([218,206,158],[[.1,[200,188,140]]],16):(x,y,r)=>y<2||y>13?NZ([196,184,136],14,r):NZ([216,204,156],16,r);
  if(n=='Obsidian')return pSpeck([22,18,34],[[.14,[52,38,78]],[.06,[80,60,110]]],18);
  if(n=='Glowstone')return pSpeck([230,180,90],[[.3,[255,220,130]],[.15,[190,130,60]]],28);
  if(n.includes('Glass')){const dk2=Object.keys(DYE16).find(k=>n.startsWith(k));return pGlass(n=='Tinted Glass'?[96,86,112]:dk2?DYE16[dk2]:[214,238,242])}
  if(n=='Ice'||n=='Packed Ice'||n=='Blue Ice'){const c=n=='Blue Ice'?[110,165,235]:n=='Packed Ice'?[150,195,240]:[175,215,245];return (x,y,r)=>{const h=hash(x,y,seed);return[...(h>.9?[240,250,255]:c),n=='Ice'?215:255]}}
  if(n=='Snow Block'||n=='Snow')return pBase([242,248,248],10,seed);
  if(n=='Clay')return pBase([160,166,182],14,seed);
  if(n=='Terracotta')return pBase([152,94,68],20,seed);
  const dye=Object.keys(DYE16).find(k=>n.startsWith(k+' ')||n.startsWith(k+'Terracotta'));
  if(dye&&n.includes('Wool'))return (x,y,r)=>NZ(DYE16[dye],16,hash(x>>1,y,seed)*.7+r*.3);
  if(dye&&n.includes('Concrete'))return pBase(DYE16[dye],9,seed);
  if(dye&&n.includes('Terracotta'))return pSpeck(DYE16[dye],[[.12,dk(DYE16[dye],.8)]],18);
  if(dye&&n.includes('Carpet'))return pBase(DYE16[dye],14,seed);
  if(n.includes('Wool'))return (x,y,r)=>NZ([236,236,236],16,hash(x>>1,y,seed)*.7+r*.3);
  if(n.includes('Bricks')){const base=n.includes('Mud')?[142,104,78]:n.includes('Nether')?[112,38,38]:n.includes('Stone')?[122,122,122]:n.includes('Deepslate')?[74,74,84]:[152,96,88];return pBricks(base,[178,172,164],seed)}
  if(n.includes('Stone Bricks')||n=='Stone Bricks')return pBricks([122,122,122],[100,100,100],seed,8,4);
  if(n=='Bookshelf')return face==2?(x,y,r)=>{if(y<2||y>13)return pPlanks([176,142,88],seed)(x,y,r);const cols=[[190,60,50],[60,90,170],[70,160,80],[210,180,70],[140,70,160]];if((x%4)==3)return NZ([120,86,50],12,r);return NZ(cols[(x>>2)%5],16,r)}:pPlanks([176,142,88],seed);
  if(n=='Crafting Table')return face==0?(x,y,r)=>{if(x%5==0||y%5==0)return NZ([150,116,70],12,r);return NZ([188,152,96],16,r)}:face==2?(x,y,r)=>{if(y>9)return NZ([120,70,40],14,r);if(x%4==0)return NZ([110,80,48],12,r);return pPlanks([176,142,88],seed)(x,y,r)}:pPlanks([176,142,88],seed);
  if(n=='Furnace')return face==2?(x,y,r)=>{if(x>4&&x<11&&y>8&&y<14)return NZ([30,26,26],10,r);if(x>5&&x<10&&y>2&&y<6)return NZ([70,66,66],10,r);return pSpeck([118,118,118],[[.1,[100,100,100]]],18)(x,y,r)}:pSpeck([118,118,118],[[.1,[100,100,100]]],18);
  if(n=='Chest'||n=='Barrel')return face==2&&n=='Chest'?(x,y,r)=>{if(y==7)return NZ([90,64,36],12,r);if(x==7&&y>6&&y<10)return NZ([180,180,185],10,r);return pPlanks([168,128,70],seed)(x,y,r)}:pPlanks(n=='Barrel'?[140,104,62]:[168,128,70],seed);
  if(n=='Torch'||n=='Soul Torch')return pCross((x,y)=>{if(x>=7&&x<=8&&y>6)return[122,88,48,255];if(x>=6&&x<=9&&y>=3&&y<=6)return n=='Soul Torch'?[90,220,220,255]:[255,190,60,255];return null});
  if(n=='Lantern')return pCross((x,y)=>{if(x>4&&x<11&&y>4&&y<13)return y>6&&y<11?[255,214,110,255]:[70,70,76,255];return null});
  if(n.includes('Door')||n.includes('Trapdoor'))return (x,y,r)=>{if(x<2||x>13||y<2||y>13)return NZ([140,108,64],14,r);if((x==11||x==12)&&(y==7||y==8))return[200,200,205,255];return pPlanks(woodKey?WOOD16[woodKey].plank:[160,128,76],seed)(x,y,r)};
  if(/Dandelion|Poppy|Tulip|Orchid|Allium|Bluet|Cornflower|Lily|Rose|Sunflower|Lilac|Peony|Torchflower|Eyeblossom|Flower/.test(n)){const petal=n.includes('Poppy')||n.includes('Red')?[215,45,40]:n.includes('Dandelion')||n.includes('Sunflower')?[245,205,45]:n.includes('Blue')||n.includes('Cornflower')?[70,110,220]:n.includes('Pink')?[240,150,190]:n.includes('Orange')?[240,130,40]:n.includes('Purple')||n.includes('Allium')?[180,110,220]:[245,245,245];return plantPainter([62,130,46],petal,seed)}
  if(/Tall Grass|Short Grass|Fern|Grass$/.test(n)&&n!='Grass')return pCross((x,y,r)=>{if(hash(x,15-Math.abs(x-7),seed)>.3&&y>4+Math.abs(x-7))return NZ([78,160,54],22,r);return null});
  if(/Mushroom/.test(n)&&!n.includes('Block'))return pCross((x,y,r)=>{if(x>=7&&x<=8&&y>8)return[225,215,195,255];if(y>=5&&y<=8&&x>3&&x<12)return NZ(n.includes('Red')?[198,40,34]:[150,116,84],18,r);return null});
  if(n=='Cactus')return face==0?pBase([70,140,52],18,seed):(x,y,r)=>{if(x==0||x==15)return NZ([54,112,42],16,r);if(x%5==2&&y%4==1)return[210,235,190,255];return NZ([70,140,52],20,r)};
  if(n=='Sugar Cane')return pCross((x,y,r)=>{if(x>=6&&x<=9&&y%5!=4)return NZ(y%5==0?[150,190,90]:[105,175,70],18,r);return null});
  if(n=='Wheat')return pCross((x,y,r)=>{if(y>5&&Math.abs(x-7.5)<4-hash(0,y,seed)*2)return NZ(y<8?[105,175,70]:[215,185,95],20,r);return null});
  if(n.includes('Pumpkin'))return face==2?(x,y,r)=>{if(x%4==0)return NZ([190,110,20],14,r);if(n=='Carved Pumpkin'&&((x>3&&x<6&&y>5&&y<8)||(x>9&&x<12&&y>5&&y<8)||(x>5&&x<10&&y>10&&y<13)))return[40,22,10,255];return NZ([225,135,28],18,r)}:(x,y,r)=>NZ(x==7&&y==7?[90,120,50]:[225,135,28],16,r);
  if(n=='Melon')return (x,y,r)=>{if(x%4==0)return NZ([120,170,55],14,r);return NZ([150,195,70],18,r)};
  if(n=='Water')return pWater(seed);
  if(n=='Lava')return pLava(seed);
  if(n=='Netherrack')return pSpeck([122,52,44],[[.2,[102,40,36]],[.1,[150,70,58]]],24);
  if(n=='Soul Soil')return pSpeck([84,62,50],[[.18,[64,46,38]],[.08,[120,95,75]]],20);
  if(n=='End Stone')return pSpeck([220,224,165],[[.16,[198,200,140]]],20);
  if(n=='Magma Block')return pSpeck([150,60,20],[[.3,[255,140,30]],[.12,[255,200,70]]],24);
  if(n=='TNT')return face==2?(x,y,r)=>{if(y<3||y>12)return NZ([198,70,40],16,r);if(y>=6&&y<=9)return NZ(Math.abs(x-7.5)<4?[28,24,24]:[236,230,220],10,r);return NZ([198,70,40],18,r)}:pBase([198,70,40],18,seed);
  if(n=='Slime Block')return (x,y,r)=>{if(x==0||y==0||x==15||y==15)return[120,215,110,220];return[150,230,135,180]};
  if(n=='Honey Block')return (x,y,r)=>{if(x==0||y==0||x==15||y==15)return[225,160,30,230];return[245,185,50,190]};
  if(!n.startsWith('Raw ')&&n.includes('Block')&&(Object.keys(MINERAL).some(k=>n.startsWith(k))||/Gold|Iron|Diamond|Emerald|Lapis|Copper|Netherite/.test(n))){const m=Object.keys(MINERAL).find(k=>n.includes(k));return pMetal(m?MINERAL[m]:[200,200,200],seed)}
  if(n.includes('Prismarine'))return pSpeck(n.includes('Dark')?[38,90,80]:[96,172,158],[[.18,[70,140,130]],[.1,[170,220,205]]],22);
  if(n=='Sea Lantern')return pSpeck([210,230,220],[[.2,[170,205,195]]],14);

  if(n=='Log')return face==2?pLogSide(WOOD16.Oak.bark,WOOD16.Oak.bark2,seed):pLogTop(WOOD16.Oak.plank,WOOD16.Oak.bark);
  if(n=='Planks')return pPlanks(WOOD16.Oak.plank,seed);
  if(n=='Tuff')return pSpeck([124,130,114],[[.22,[105,112,95]],[.1,[150,155,138]]],24);
  if(n=='Andesite')return pSpeck([136,136,138],[[.2,[112,112,116]],[.1,[168,168,170]]],20);
  if(n=='Diorite')return pSpeck([208,208,206],[[.22,[120,120,122]],[.08,[70,70,72]]],18);
  if(n=='Granite')return pSpeck([172,124,110],[[.2,[140,95,85]],[.1,[205,160,145]]],22);
  if(n=='Calcite')return pSpeck([228,224,208],[[.16,[200,196,178]]],14);
  if(n=='Dripstone Block')return pSpeck([150,124,102],[[.2,[124,100,80]],[.08,[180,152,124]]],22);
  if(n=='Basalt')return (x,y,r)=>NZ(x%4==0?[52,50,54]:[72,70,74],18,hash(x>>2,y,seed)*.5+r*.5);
  if(n=='Polished Basalt')return (x,y,r)=>NZ(x%5==0?[64,62,66]:[88,86,90],14,r);
  if(n=='Blackstone')return pSpeck([32,28,34],[[.18,[52,46,54]],[.05,[80,70,84]]],16);
  if(n=='Gilded Blackstone')return pOre([32,28,34],[252,238,94],seed);
  if(n=='Smooth Stone')return pBase([160,160,160],8,seed);
  if(n=='Hay Bale')return face==2?(x,y,r)=>NZ(y==7||y==8?[170,60,45]:[225,195,85],20,hash(x,y>>1,seed)*.5+r*.5):(x,y,r)=>NZ(Math.max(Math.abs(x-7.5),Math.abs(y-7.5))%2?[225,195,85]:[205,172,70],16,r);
  if(n=='Soul Sand')return (x,y,r)=>{const f=(Math.hypot(x-4.5,y-5)<1.8||Math.hypot(x-11,y-10)<1.8);return NZ(f?[52,38,30]:[88,66,54],22,r)};
  if(n.startsWith('Raw ')&&n.includes('Block'))return pSpeck(n.includes('Gold')?[232,188,105]:n.includes('Copper')?[205,130,90]:[214,178,158],[[.25,[170,130,105]]],24);
  const suf=n.match(/^(.*?) (Stairs|Slab|Wall|Fence Gate|Fence|Trapdoor|Door|Button|Pressure Plate)$/);
  if(suf){let base=suf[1];if(base=='Stone Brick')base='Stone Bricks';if(!base)base='Oak Planks';if(WOOD16[base])base=base+' Planks';if(base=='Stone')base='Stone';const bp=painterFor(base,face);const sh2=suf[2]=='Slab'?.82:suf[2]=='Stairs'?.9:1;return (x,y,r)=>{const c=bp(x,y,r);if(c[3]!=null&&c[3]<250)return c;const f=sh2*(y>13?.78:1);return[ c[0]*f|0,c[1]*f|0,c[2]*f|0,c[3]??255]}}

  if(n=='Lily Pad')return pCross((x,y)=>{if(y>9&&Math.hypot((x-7.5)/1.4,y-11.5)<3.4)return[70,150,60,255];return null});
  if(n=='Vines')return pCross((x,y,r)=>{if((x==3||x==7||x==11)&&y>2&&hash(x,y,seed)>.15)return NZ([58,125,48],20,r);return null});
  if(n.includes('Coral Block')){const cc=n.includes('Tube')?[70,110,230]:n.includes('Brain')?[215,130,165]:n.includes('Bubble')?[170,90,210]:n.includes('Fire')?[215,70,50]:[225,185,70];return pSpeck(cc,[[.25,dk(cc,.7)],[.12,dk(cc,1.3)]],24)}
  if(n=='Moss Block')return pSpeck([88,140,52],[[.3,[66,112,40]],[.12,[130,180,90]]],26);
  if(n=='Pale Moss Block')return pSpeck([150,168,138],[[.3,[118,138,108]],[.12,[190,205,180]]],24);
  if(n=='Mud')return pSpeck([112,88,66],[[.2,[88,66,48]],[.08,[150,125,95]]],20);
  if(n=='Packed Mud')return pSpeck([152,120,90],[[.2,[128,98,70]],[.1,[180,148,112]]],22);
  if(n=='Dirt Path')return face==0?pSpeck([164,138,88],[[.14,[140,114,70]]],16):pGrassSide(seed);
  if(/Button$/.test(n))return pCross((x,y,r)=>{if(x>5&&x<10&&y>6&&y<10)return NZ(n.includes('Stone')?[120,120,120]:[150,110,62],12,r);return null});
  if(/Pressure Plate$/.test(n))return pCross((x,y,r)=>{if(x>2&&x<13&&y>10&&y<14)return NZ(n.includes('Stone')?[125,125,125]:[168,132,76],12,r);return null});
  if(/Rail$/.test(n))return pCross((x,y,r)=>{if(y%4==3)return NZ([130,95,55],12,r);if(x==4||x==11)return NZ(n=='Powered Rail'&&y%8<4?[250,200,60]:[185,188,195],10,r);return null});
  if(n=='Anvil')return (x,y,r)=>{if(y<4&&x>1&&x<14)return NZ([74,74,80],12,r);if(y>=4&&y<10&&x>5&&x<10)return NZ([64,64,70],12,r);if(y>=10&&x>3&&x<12)return NZ([74,74,80],12,r);return[0,0,0,0]};
  if(n=='Iron Bars')return pCross((x,y)=>{if(x==2||x==7||x==12)return[198,202,208,255];if(y==1||y==14)return[170,174,182,255];return null});
  if(n=='Chain')return pCross((x,y)=>{if(x>=7&&x<=8&&y>0)return(y%3==0?[150,154,162,255]:[110,114,122,255]);return null});
  if(/ Bed$/.test(n)||n=='White Bed'){const bc=(Object.keys(DYE16).find(k=>n.startsWith(k))&&DYE16[Object.keys(DYE16).find(k=>n.startsWith(k))])||[200,50,45];return face==2?(x,y,r)=>{if(y<6)return NZ([238,238,238],12,r);if(y<8)return NZ([120,86,50],12,r);return NZ(bc,18,r)}:pPlanks([150,110,62],seed)}
  if(n=='Campfire')return pCross((x,y,r)=>{if(y>11)return NZ([105,72,42],14,r);if(Math.abs(x-7.5)<2.5&&y>5&&y<12)return NZ(y<8?[255,205,70]:[240,110,30],16,r);if(y>9&&Math.abs(x-7.5)<5)return NZ([90,60,35],14,r);return null});
  if(/ Table$/.test(n)&&n!='Crafting Table')return face==0?pBricks([120+seed%60,95,70],[80,60,45],seed,16,16):(x,y,r)=>{if(y<3)return NZ([110,82,52],14,r);if(x<2||x>13)return NZ([80,58,36],14,r);return pPlanks([150,112,64],seed)(x,y,r)};
  if(n=='Jukebox')return face==0?(x,y,r)=>Math.hypot(x-7.5,y-7.5)<5?NZ([30,28,30],10,r):pPlanks([150,105,58],seed)(x,y,r):(x,y,r)=>{if(Math.hypot(x-7.5,y-7.5)<3.4)return NZ([35,32,35],10,r);return pPlanks([150,105,58],seed)(x,y,r)};
  if(n=='Beehive'||n=='Bee Nest')return (x,y,r)=>{if(y%4==3)return NZ([170,125,45],14,r);if(x>6&&x<9&&y>7&&y<11)return[60,40,20,255];return NZ([215,165,70],18,r)};
  if(n=='Ender Chest')return (x,y,r)=>{if(y==7)return NZ([200,170,60],10,r);if(x==7&&y>6&&y<10)return NZ([220,220,120],10,r);return NZ([28,24,38],16,hash(x,y,seed)*.5+r*.5)};
  if(n=='Shulker Box')return pSpeck([150,105,165],[[.2,[125,82,140]]],18);
  if(n=='Conduit')return (x,y,r)=>{if(Math.hypot(x-7.5,y-7.5)<3)return NZ([90,220,200],10,r);return pSpeck([105,175,160],[[.2,[75,140,128]]],18)(x,y,r)};
  if(n=='Lodestone')return (x,y,r)=>{if(x==0||x==15||y==0||y==15)return NZ([150,150,158],10,r);return NZ([70,70,78],14,r)};
  if(n=='Sculk')return pSpeck([18,42,46],[[.2,[30,80,84]],[.07,[110,240,220]]],18);
  if(n.includes('Purpur'))return pBricks([172,138,178],[140,105,145],seed,8,8);
  if(n=='End Rod')return pCross((x,y)=>{if(x>=7&&x<=8)return[238,238,230,255];if(y>12&&x>5&&x<10)return[200,180,150,255];return null});
  if(n=='Crafter')return face==2?(x,y,r)=>{if(x%5==0||y%5==0)return NZ([90,90,95],10,r);return NZ([130,130,135],14,r)}:pSpeck([125,125,130],[[.12,[105,105,110]]],16);
  if(n=='Respawn Anchor')return (x,y,r)=>{if(Math.hypot(x-7.5,y-6)<3)return NZ([255,165,60],12,r);return pSpeck([80,45,110],[[.2,[60,32,85]]],18)(x,y,r)};
  if(n=='Piston'||n=='Sticky Piston')return face==0?(n=='Sticky Piston'?pSpeck([105,180,80],[[.2,[85,150,62]]],18):pPlanks([176,142,88],seed)):pSpeck([122,122,122],[[.12,[102,102,102]]],18);
  if(n=='Observer')return face==2?(x,y,r)=>{if((x==4||x==11)&&y==6)return NZ([200,40,35],8,r);if(x>5&&x<10&&y>9&&y<13)return NZ([40,36,36],8,r);return pSpeck([118,118,118],[[.1,[100,100,100]]],16)(x,y,r)}:pSpeck([118,118,118],[[.1,[100,100,100]]],16);
  if(n=='Mob Spawner')return (x,y,r)=>{if(x==0||x==15||y==0||y==15||x%5==0)return NZ([45,60,80],10,r);if(Math.hypot(x-7.5,y-7.5)<3)return NZ([255,120,40],14,r);return[20,28,40,160]};
  if(n=='Daylight Detector')return face==0?(x,y,r)=>{if(x%4==0||y%4==0)return NZ([150,115,70],10,r);return NZ([70,90,140],12,r)}:pPlanks([150,112,64],seed);
  if(n=='Hopper')return (x,y,r)=>{if(y<6)return NZ([70,70,76],12,r);if(y<12&&x>3&&x<12)return NZ([60,60,66],12,r);if(x>6&&x<9)return NZ([52,52,58],12,r);return[0,0,0,0]};
  if(n=='Cauldron')return (x,y,r)=>{if(y<3)return NZ([70,70,76],12,r);if(y>11&&x>1&&x<14)return NZ([60,60,66],12,r);if(x<2||x>13)return NZ([66,66,72],12,r);return[0,0,0,0]};
  if(n=='Composter')return (x,y,r)=>{if(y%3==2)return NZ([95,66,38],12,r);return NZ([135,95,55],16,r)};
  if(n=='Enchanting Table')return face==0?(x,y,r)=>{if(x>4&&x<11&&y>5&&y<10)return NZ([235,230,215],10,r);return NZ([35,28,45],14,r)}:(x,y,r)=>{if(y>9)return NZ([150,35,35],14,r);return NZ([35,28,45],16,r)};
  if(n=='Brewing Stand')return pCross((x,y,r)=>{if(x>=7&&x<=8)return NZ([150,150,155],10,r);if(y>12&&x>3&&x<12)return NZ([90,90,95],10,r);if(y>5&&y<9&&(x==4||x==11))return NZ([255,170,60],12,r);return null});
  if(n=='Flower Pot')return pCross((x,y,r)=>{if(y>8&&x>4&&x<11)return NZ([165,95,70],14,r);if(y>5&&y<=8&&Math.abs(x-7.5)<2)return NZ([205,60,55],14,r);if(x==7&&y>7)return[70,140,55,255];return null});
  if(n=='Painting')return (x,y,r)=>{if(x<2||x>13||y<2||y>13)return NZ([150,115,65],12,r);return NZ([120+seed*3%100,90+seed%70,60+seed%50],16,hash(x>>2,y>>2,seed))};
  if(n=='Item Frame')return (x,y,r)=>{if(x<3||x>12||y<3||y>12)return NZ([160,125,75],12,r);if(Math.hypot(x-7.5,y-7.5)<2.5)return NZ([200,80,60],12,r);return NZ([190,170,140],12,r)};
  if(n=='Target')return (x,y,r)=>{const d=Math.hypot(x-7.5,y-7.5);return NZ(d<2?[215,45,40]:d<4.5?[238,238,238]:d<7?[215,45,40]:[225,215,170],12,r)};
  if(n=='Bell')return pCross((x,y)=>{if(x>5&&x<10&&y>4&&y<11)return[240,200,70,255];if(y>=11&&x>4&&x<11)return[210,170,50,255];return null});
  if(n=='Sea Pickle')return pCross((x,y)=>{if(x>6&&x<9&&y>6)return[150,190,80,255];if(x>=6&&x<=9&&y==6)return[220,235,150,255];return null});
  if(n=='Dead Bush')return pCross((x,y,r)=>{if(Math.abs(x-7.5-(y-8)*.2)<1&&y>4||(y==12&&Math.abs(x-7.5)<4))return NZ([130,95,60],14,r);return null});
  if(n=='Repeater'||n=='Comparator')return face==0?(x,y,r)=>{if((x==4||x==11)&&y>3&&y<7)return NZ([220,50,40],10,r);return NZ([150,150,150],12,r)}:pBase([145,145,145],12,seed);
  if(n=='Fence Gate')return (x,y,r)=>{if(y<3||y>12)return NZ([150,112,62],12,r);if(Math.abs(x-y)<1||Math.abs(x+y-15)<1)return NZ([130,95,50],12,r);return pPlanks([170,132,80],seed)(x,y,r)};
  /* unique fallback: keyword-tinted, name-seeded pattern — never a copy of another block */
  const tint=/Sand|Dirt|Mud/.test(n)?[150,118,80]:/Stone|Deepslate|Tuff|Basalt|Blackstone/.test(n)?[105,105,112]:/Nether|Magma|Lava/.test(n)?[140,60,45]:/End|Purpur|Chorus/.test(n)?[170,140,170]:/Ice|Snow|Prismarine|Sea/.test(n)?[140,190,210]:/Leaf|Leaves|Moss|Vine|Kelp|Coral/.test(n)?[80,150,80]:/Wood|Log|Plank|Bamboo/.test(n)?[160,125,78]:[128+seed%50,118+seed%40,105+seed%30];
  return pSpeck(tint,[[.16,dk(tint,.72)],[.09,dk(tint,1.28)]],22+seed%8);
}
/* ---- item icon painters: real silhouettes, not blobs ---- */
const TOOLBMP={
Pickaxe:["....hhhh......","...hMMMMh.....","..hMMMMMMh....","..Mh....hM....",".M......h.....","........h.....",".......h......","......h.......",".....h........","....h.........","...h..........","..h...........","..h...........",".h............",".h............","hh............"],
Axe:["...MMMM.......","..MMMMMM......","..MMhhMM......","....hh........","....hh........","...hh.........","...hh.........","..hh..........","..hh..........","..hh..........",".hh...........",".hh...........",".hh...........","hh............","hh............",".............."],
Shovel:[".....MM.......","....MMMM......","....MMMM......","....MMMM......",".....hh.......",".....hh.......",".....hh.......","....hh........","....hh........","...hh.........","...hh.........","..hh..........","..hh..........",".hh...........",".hh...........","hh............"],
Sword:[".............M","............MM","...........MMM","..........MMM.","....h....MMM..",".....h..MMM...","......hMMM....",".....hhh......","....h.h.h.....","...h..h..h....","..hh...hh.....",".hh...........","hh............","..............","..............",".............."],
Hoe:["..MMMMMM......","..Mhh.........","....hh........","....hh........","...hh.........","...hh.........","...hh.........","..hh..........","..hh..........","..hh..........",".hh...........",".hh...........",".hh...........","hh............","hh............",".............."]};
const MATC={Wooden:[168,132,80],Stone:[128,128,128],Iron:[225,228,232],Golden:[250,214,64],Diamond:[95,235,225],Netherite:[74,58,62],Copper:[224,122,79],Leather:[166,108,62]};
function itemPainter(name){
  const seed=shs(name)%80+5;
  const tm=name.match(/^(Wooden|Stone|Iron|Golden|Diamond|Netherite|Copper|Leather) (Pickaxe|Axe|Shovel|Sword|Hoe|Helmet|Chestplate|Leggings|Boots)$/);
  if(tm){const mat=MATC[tm[1]],tool=tm[2];
    if(TOOLBMP[tool]){const bmp=TOOLBMP[tool];return (x,y,r)=>{const ch=(bmp[y]||'')[x];if(ch=='M')return NZ(mat,14,r);if(ch=='h')return NZ([134,96,54],14,r);return[0,0,0,0]}}
    return (x,y,r)=>{ /* armor silhouettes */
      if(tool=='Helmet'&&y>3&&y<9&&x>3&&x<12)return NZ(y==4?dk(mat,.75):mat,14,r);
      if(tool=='Chestplate'&&y>3&&y<13&&x>3&&x<12&&(y<6||x>4&&x<11))return NZ(mat,14,r);
      if(tool=='Leggings'&&y>3&&y<14&&x>4&&x<11&&x!=7&&x!=8)return NZ(mat,14,r);
      if(tool=='Boots'&&y>9&&y<14&&x>3&&x<12)return NZ(mat,14,r);
      return[0,0,0,0]}}
  if(name=='Trident')return (x,y,r)=>{if(x==7&&y>4)return NZ([70,190,180],12,r);if(y<=4&&(x==4||x==7||x==10))return NZ([70,190,180],12,r);if(y==4&&x>=4&&x<=10)return NZ([70,190,180],12,r);return[0,0,0,0]};
  if(name=='Shield')return (x,y,r)=>{if(x>3&&x<12&&y>1&&y<14)return NZ(x>5&&x<10&&y>5&&y<10?[200,200,205]:[150,105,60],14,r);return[0,0,0,0]};
  if(name=='Bow'||name=='Crossbow')return (x,y,r)=>{const d=Math.abs(Math.hypot(x-8,y-7.5)-6);if(d<1.1)return NZ([140,100,55],12,r);if(x>3&&x<13&&Math.abs(y-7.5)<.6)return[230,230,230,255];return[0,0,0,0]};
  if(/Bucket/.test(name))return (x,y,r)=>{if(y>4&&y<13&&x>3&&x<12)return NZ(y==5?[170,175,185]:[150,155,165],12,r);if(name.includes('Water')&&y>4&&y<8&&x>4&&x<11)return[60,130,230,255];if(name.includes('Lava')&&y>4&&y<8&&x>4&&x<11)return[245,110,20,255];if(name.includes('Milk')&&y>4&&y<8&&x>4&&x<11)return[245,245,240,255];return[0,0,0,0]};
  if(/Ingot|Nugget/.test(name)){const c=name.includes('Gold')?[250,214,64]:name.includes('Netherite')?[74,58,62]:name.includes('Copper')?[224,122,79]:[225,228,232];return (x,y,r)=>{if(y>5&&y<11&&x>2&&x<13&&Math.abs(x-7.5)+Math.abs(y-8)<7)return NZ(y<8?dk(c,1.15):c,12,r);return[0,0,0,0]}}
  if(/Raw (Iron|Gold|Copper)/.test(name)){const c=name.includes('Gold')?[235,190,90]:name.includes('Copper')?[215,130,85]:[216,180,160];return (x,y,r)=>{if(hash(x>>1,y>>1,seed)>.35&&Math.hypot(x-7.5,y-8)<5.5)return NZ(c,20,r);return[0,0,0,0]}}
  if(/Diamond$|Emerald$|Nether Star|Prismarine Crystal/.test(name)){const c=name.includes('Emerald')?[50,210,95]:name.includes('Star')?[240,245,210]:[110,230,220];return (x,y,r)=>{if(Math.abs(x-7.5)+Math.abs(y-7.5)<6)return NZ(x<7&&y<8?dk(c,1.2):c,12,r);return[0,0,0,0]}}
  if(/Apple|Berries|Melon Slice|Carrot|Potato|Beetroot|Cookie|Bread|Cake|Pie|Cod|Salmon|Fish|Pufferfish|Porkchop|Beef|Steak|Chicken|Mutton|Rabbit|Flesh|Egg|Honey|Milk|Bowl|Stew|Soup/.test(name)){
    const c=name.includes('Apple')?[215,35,35]:name.includes('Carrot')?[240,130,25]:name.includes('Cooked')||name.includes('Steak')||name.includes('Bread')||name.includes('Cake')||name.includes('Pie')||name.includes('Cookie')?[185,120,62]:name.includes('Raw')||name.includes('Porkchop')||name.includes('Beef')||name.includes('Mutton')?[215,90,90]:name.includes('Fish')||name.includes('Cod')||name.includes('Salmon')?[110,170,200]:name.includes('Berries')?[200,50,70]:name.includes('Egg')?[232,208,168]:[205,165,105];
    return (x,y,r)=>{if(Math.hypot((x-7.5)/1.15,y-8.5)<4.6)return NZ(x<7?dk(c,1.12):c,16,r);if(name.includes('Apple')&&x==8&&y<4)return[90,60,35,255];if(name.includes('Carrot')&&y<4&&x>6&&x<10)return[70,160,60,255];return[0,0,0,0]}}
  const c=[120+seed%90,110+seed%80,95+seed%60];
  return (x,y,r)=>{if(Math.hypot(x-7.5,y-7.5)<4.8)return NZ(hash(x,y,seed)>.8?dk(c,.7):c,18,r);return[0,0,0,0]};
}
/* register a block with freshly painted faces; returns id */
function regBlock(name,hard=1){
  const id=NAMES.length;NAMES.push(name);
  const t0=painterFor(name,0),t1=painterFor(name,1),t2=painterFor(name,2);
  const i0=TP.push(t0)-1;let i1,i2;
  if(t1===t0||name.length&&painterFor.length)i1=i0;
  /* paint distinct bottom/side only when painter differs by construction */
  i1=TP.push(painterFor(name,1))-1; i2=TP.push(painterFor(name,2))-1;
  TX[id]=[i0,i1,i2];HD[id]=hard;DROP[id]=id;return id;
}
function repaintAtlas(){
  ac.width=1024;ac.height=1024;const X=ac.getContext('2d');X.clearRect(0,0,1024,1024);
  TP.forEach((f,t)=>{const ox=(t%64)*16,oy=((t/64)|0)*16;for(let y=0;y<16;y++)for(let x=0;x<16;x++){const c=f(x,y,hash(x,y,t+1));X.fillStyle=`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${(c[3]??255)/255})`;X.fillRect(ox+x,oy+y,1,1)}});
  tex.needsUpdate=true;
}
/* 1) repaint ALL pre-existing blocks with unique tiles (kills duplicate EXTRA textures) */
for(let id=1;id<NAMES.length;id++){
  if(ITEM[id]||!TX[id])continue;
  TX[id]=[TP.push(painterFor(NAMES[id],0))-1,TP.push(painterFor(NAMES[id],1))-1,TP.push(painterFor(NAMES[id],2))-1];
}
/* core face fixes kept explicit: grass/log/planks ids 1,5,7 */
TX[1]=[TP.push(painterFor('Grass',0))-1,TP.push(painterFor('Dirt',1))-1,TP.push(painterFor('Grass',2))-1];
/* 2) brand-new blocks */
const NEWBLOCKS=['Water','Lava','Copper Ore','Nether Quartz Ore','Deepslate Coal Ore','Deepslate Iron Ore','Deepslate Copper Ore','Deepslate Gold Ore','Deepslate Diamond Ore','Deepslate Emerald Ore','Deepslate Lapis Lazuli Ore','Deepslate Redstone Ore','Coal Block','Redstone Block','Netherite Block','Coarse Dirt','Podzol','Mycelium','Dirt Path','Cornflower','Oxeye Daisy','Lily of the Valley','Wither Rose','Torchflower','Pink Petals','Short Grass','Large Fern','Tube Coral Block','Brain Coral Block','Bubble Coral Block','Fire Coral Block','Horn Coral Block','Azalea Leaves','Flowering Azalea Leaves','Cherry Leaves','Mangrove Log','Mangrove Leaves','Mangrove Planks','Pale Oak Log','Pale Oak Planks','Pale Oak Leaves','Oak Wood','Spruce Wood','Striped Oak Log','Crimson Stem','Warped Stem','Crimson Planks','Warped Planks','Sculk','Crying Obsidian','Basalt','Polished Basalt','Blackstone','Gilded Blackstone','Chiseled Nether Bricks','Cracked Nether Bricks','Quartz Bricks','Smooth Stone','Stone Slab','Oak Slab','Spruce Slab','Sandstone Slab','Cobblestone Slab','Brick Slab','Oak Stairs','Cobblestone Stairs','Stone Brick Stairs','Sandstone Stairs','Oak Fence','Spruce Fence','Cobblestone Wall','Stone Brick Wall','Iron Bars','Oak Trapdoor','Spruce Trapdoor','Oak Door','Spruce Door','White Stained Glass','Blue Stained Glass','Red Stained Glass','Green Stained Glass','Tinted Glass','White Carpet','Red Carpet','Blue Carpet','Lantern','Soul Lantern','End Rod','Sea Lantern','Jack o Lantern','Beehive','Bee Nest','Honeycomb Block','Ancient Debris','Respawn Anchor','Lodestone','Conduit','Ender Chest','Shulker Box','White Bed','Red Bed','Blue Bed','Black Bed','Cake','Cauldron','Composter','Lectern','Smithing Table','Cartography Table','Fletching Table','Loom','Stonecutter','Grindstone','Blast Furnace','Smoker','Brewing Stand','Enchanting Table'];
const NEWBLOCK_IDS={};for(const n of NEWBLOCKS)if(!NAMES.includes(n))NEWBLOCK_IDS[n]=regBlock(n,n=='Water'||n=='Lava'?0.05:1);
/* dedupe: blocks already in EXTRA (Crimson Planks etc) just get unique TX above */
/* 3) new items: full tool/armor/material/food sets with drawn icons */
const NEWITEMS=['Wooden Pickaxe','Wooden Axe','Wooden Shovel','Wooden Sword','Wooden Hoe','Stone Pickaxe','Stone Axe','Stone Shovel','Stone Sword','Stone Hoe','Iron Pickaxe','Iron Axe','Iron Shovel','Iron Sword','Iron Hoe','Golden Pickaxe','Golden Axe','Golden Shovel','Golden Sword','Golden Hoe','Diamond Pickaxe','Diamond Axe','Diamond Shovel','Diamond Sword','Diamond Hoe','Netherite Pickaxe','Netherite Axe','Netherite Shovel','Netherite Sword','Netherite Hoe','Leather Helmet','Leather Chestplate','Leather Leggings','Leather Boots','Iron Helmet','Iron Chestplate','Iron Leggings','Iron Boots','Golden Helmet','Golden Chestplate','Golden Leggings','Golden Boots','Diamond Helmet','Diamond Chestplate','Diamond Leggings','Diamond Boots','Netherite Helmet','Netherite Chestplate','Netherite Leggings','Netherite Boots','Shield','Trident','Crossbow','Raw Iron','Raw Gold','Raw Copper','Netherite Ingot','Netherite Scrap','Cooked Mutton','Cooked Rabbit','Cooked Cod','Cooked Salmon','Cod','Salmon','Tropical Fish','Pufferfish','Sweet Berries','Glow Berries','Honey Bottle','Water Bucket','Lava Bucket','Milk Bucket','Wheat','Wheat Seeds','Sugar','Bowl','Mushroom Stew','Beetroot Soup','Rabbit Stew','Saddle','Totem of Undying','Enchanted Book','Experience Bottle','Flint and Steel','Lead','Name Tag','Ender Eye','Blaze Powder','Magma Cream','Ghast Tear','Phantom Membrane','Shulker Shell','Heart of the Sea','Prismarine Shard','Prismarine Crystal','Ink Sac','Cocoa Beans','Bamboo','Kelp','Seagrass','Scute','Turtle Egg','Bee Spawn Egg'];
const ITEMFOOD={'Cooked Mutton':8,'Cooked Rabbit':5,'Cooked Cod':5,'Cooked Salmon':6,'Cod':2,'Salmon':2,'Tropical Fish':1,'Pufferfish':1,'Sweet Berries':2,'Glow Berries':2,'Honey Bottle':6,'Wheat Seeds':0,'Mushroom Stew':6,'Beetroot Soup':6,'Rabbit Stew':10};
for(const n of NEWITEMS){if(NAMES.includes(n))continue;const id=NAMES.length;NAMES.push(n);const t=TP.push(itemPainter(n))-1;TX[id]=[t,t,t];HD[id]=1;DROP[id]=id;ITEM[id]=1;if(ITEMFOOD[n])FOOD[id]=ITEMFOOD[n]}
/* repaint old item icons too */
for(let id=1;id<NAMES.length;id++)if(ITEM[id]){const t=TP.push(itemPainter(NAMES[id]))-1;TX[id]=[t,t,t]}
repaintAtlas();
Object.keys(ICC).forEach(k=>delete ICC[k]);
/* transparency + fluid registry */
TR[NID('Water')]=1;TR[NID('Lava')]=1;TR[NID('Tinted Glass')]=1;
/* sensible ore / block drops */
const DROPMAP={'Coal Ore':'Coal','Deepslate Coal Ore':'Coal','Iron Ore':'Raw Iron','Deepslate Iron Ore':'Raw Iron','Gold Ore':'Raw Gold','Deepslate Gold Ore':'Raw Gold','Nether Gold Ore':'Raw Gold','Copper Ore':'Raw Copper','Deepslate Copper Ore':'Raw Copper','Diamond Ore':'Diamond','Deepslate Diamond Ore':'Diamond','Emerald Ore':'Emerald','Deepslate Emerald Ore':'Emerald','Lapis Lazuli Ore':'Lapis Lazuli','Deepslate Lapis Lazuli Ore':'Lapis Lazuli','Redstone Ore':'Redstone Dust','Deepslate Redstone Ore':'Redstone Dust','Nether Quartz Ore':'Quartz','Ancient Debris':'Netherite Scrap','Wheat':'Wheat','Grass':'Dirt','Stone':'Cobblestone','Deepslate':'Cobbled Deepslate'};
for(const k in DROPMAP)DROP[NID(k)]=NID(DROPMAP[k]);
DROP[18]=NID('Coal');DROP[19]=NID('Raw Iron');DROP[20]=NID('Diamond');
/* tools: tier, speed, damage */
const TOOLDEF={};{const tiers={Wooden:1,Stone:2,Iron:3,Golden:2,Diamond:4,Netherite:5},dmgs={Sword:[4,5,6,7,8,9],Axe:[5,6,7,8,9,10]};
for(let id=1;id<NAMES.length;id++){const m=NAMES[id].match(/^(Wooden|Stone|Iron|Golden|Diamond|Netherite) (Pickaxe|Axe|Shovel|Sword|Hoe)$/);if(m)TOOLDEF[id]={type:m[2],tier:tiers[m[1]],speed:1+tiers[m[1]]*1.6,dmg:(dmgs[m[2]]||[2,3,4,5,6,7])[tiers[m[1]]-1]||3+tiers[m[1]]}}}
function blockToolCat(name){if(/Ore|Stone|Deepslate|Cobble|Brick|Basalt|Blackstone|Obsidian|Quartz|Amethyst|Prismarine|Concrete|Terracotta|Furnace|Anvil/.test(name))return'Pickaxe';if(/Log|Plank|Wood|Bamboo|Chest|Crafting|Bookshelf|Fence|Door|Trapdoor|Sign|Loom|Barrel/.test(name))return'Axe';if(/Dirt|Sand|Gravel|Clay|Mud|Soul|Snow|Grass Block|Farmland|Path/.test(name))return'Shovel';if(/Leaves|Wool|Carpet|Web|Vine/.test(name))return'Sword';return''}
function heldTool(){return TOOLDEF[held()]||null}
function armorPoints(){let p=0;const mats={Leather:1,Iron:2,Golden:1,Diamond:3,Netherite:4};for(const slot of['Helmet','Chestplate','Leggings','Boots']){let best=0;for(const m in mats)if((inv[NID(m+' '+slot)]||0)>0)best=Math.max(best,mats[m]);p+=best}return p}
/* smelting map: raw -> cooked/ingot (used at a Furnace) */
const SMELT={'Raw Iron':'Iron Ingot','Raw Gold':'Gold Ingot','Raw Copper':'Copper Ingot','Raw Porkchop':'Cooked Porkchop','Raw Beef':'Steak','Raw Chicken':'Cooked Chicken','Mutton':'Cooked Mutton','Raw Rabbit':'Cooked Rabbit','Cod':'Cooked Cod','Salmon':'Cooked Salmon','Sand':'Glass','Cobblestone':'Stone','Clay Ball':'Terracotta'};
/* extra crafting recipes (shapeless-count system) */
{const R=(out,n,ing)=>RC.push([NID(out),n,Object.fromEntries(Object.entries(ing).map(([k,v])=>[NID(k),v]))]);
for(const w of['Oak','Birch','Spruce','Jungle','Acacia','Dark Oak','Mangrove','Cherry','Bamboo','Crimson','Warped','Pale Oak']){if(NAMES.includes(w+' Log')||NAMES.includes(w+' Stem')){const log=NAMES.includes(w+' Log')?w+' Log':w+' Stem';if(NAMES.includes(w+' Planks'))R(w+' Planks',4,{[log]:1})}if(NAMES.includes(w+' Planks'))R('Stick',4,{[w+' Planks']:2})}
const MATFOR={Wooden:'Oak Planks',Stone:'Cobblestone',Iron:'Iron Ingot',Golden:'Gold Ingot',Diamond:'Diamond'};
for(const m in MATFOR){R(m+' Pickaxe',1,{[MATFOR[m]]:3,'Stick':2});R(m+' Axe',1,{[MATFOR[m]]:3,'Stick':2});R(m+' Shovel',1,{[MATFOR[m]]:1,'Stick':2});R(m+' Sword',1,{[MATFOR[m]]:2,'Stick':1});R(m+' Hoe',1,{[MATFOR[m]]:2,'Stick':2})}
R('Netherite Pickaxe',1,{'Diamond Pickaxe':1,'Netherite Ingot':1});R('Netherite Sword',1,{'Diamond Sword':1,'Netherite Ingot':1});R('Netherite Axe',1,{'Diamond Axe':1,'Netherite Ingot':1});
R('Furnace',1,{'Cobblestone':8});R('Chest',1,{'Oak Planks':8});R('Torch',4,{'Coal':1,'Stick':1});R('Bread',1,{'Wheat':3});R('Shield',1,{'Oak Planks':6,'Iron Ingot':1});R('Bow',1,{'Stick':3,'String':3});R('Crossbow',1,{'Stick':3,'String':2,'Iron Ingot':1});R('Water Bucket',1,{'Bucket':1});R('Iron Helmet',1,{'Iron Ingot':5});R('Iron Chestplate',1,{'Iron Ingot':8});R('Iron Leggings',1,{'Iron Ingot':7});R('Iron Boots',1,{'Iron Ingot':4});R('Diamond Helmet',1,{'Diamond':5});R('Diamond Chestplate',1,{'Diamond':8});R('Diamond Leggings',1,{'Diamond':7});R('Diamond Boots',1,{'Diamond':4});R('Lantern',1,{'Torch':1,'Iron Nugget':8});R('Glass',1,{'Sand':1});}
/* tiny synth sounds (no assets) */
let ACX=null;function sfx(f=440,d=.12,type='square',g=.05){try{ACX=ACX||new(window.AudioContext||window.webkitAudioContext)();const o=ACX.createOscillator(),gn=ACX.createGain();o.type=type;o.frequency.value=f;gn.gain.setValueAtTime(g,ACX.currentTime);gn.gain.exponentialRampToValueAtTime(.001,ACX.currentTime+d);o.connect(gn).connect(ACX.destination);o.start();o.stop(ACX.currentTime+d)}catch(e){}}
