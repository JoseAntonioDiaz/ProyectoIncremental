// Tablero visual con Phaser 3: zona de enemigo (arriba) + tablero 6x5 + banquillo, drag & drop
const CELL=58,PAD=8;
const ENEMY_H=96;
const BOARD_W=BOARD_COLS*CELL+PAD*2;
const BOARD_Y0=ENEMY_H+PAD;
const BENCH_ROWS=2,BENCH_COLS=BOARD_COLS;
const BENCH_Y0=BOARD_Y0+BOARD_ROWS*CELL+PAD*2+16;
const GAME_H=BENCH_Y0+BENCH_ROWS*CELL+PAD;
const EMOJI_FONT='"Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",system-ui,sans-serif';

let scene=null;
const sprites={}; // unit index -> {cont,bg,emo,star,role,hpBg,hpFill}
let enemySprite=null;

function slotXY(i){
  const col=i%BOARD_COLS,row=(i/BOARD_COLS)|0;
  return{x:PAD+CELL*col+CELL/2,y:BOARD_Y0+CELL*row+CELL/2};
}
function benchXY(idx){
  const col=idx%BENCH_COLS,row=(idx/BENCH_COLS)|0;
  return{x:PAD+CELL*col+CELL/2,y:BENCH_Y0+CELL*row+CELL/2};
}
const enemyHomeXY=()=>({x:BOARD_W/2,y:ENEMY_H/2});

function nearestBoardSlot(x,y){
  let best=-1,bd=CELL*0.8;
  for(let i=0;i<boardSize();i++){
    const p=slotXY(i);const d=Math.hypot(p.x-x,p.y-y);
    if(d<bd){bd=d;best=i}
  }
  return best;
}
function inBenchArea(x,y){return y>BOARD_Y0+BOARD_ROWS*CELL+PAD}

function starStr(o){return "★"+o[0]+"  ★★"+o[1]+"  ★★★"+o[2]}

function ensureSprite(u){
  if(sprites[u])return sprites[u];
  const bg=scene.add.circle(0,0,CELL/2-5,0x000000,0).setStrokeStyle(2,TRAIT_COLOR[u>>2],0.9);
  const emo=scene.add.text(0,-3,EMO[u],{fontSize:"24px",fontFamily:EMOJI_FONT}).setOrigin(0.5);
  const role=roleOf(u);
  const badge=scene.add.circle(CELL/2-11,-CELL/2+9,5,role==="tank"?0xf0b23c:0xe05959).setStrokeStyle(1,0x000000,0.4);
  const star=scene.add.text(0,CELL/2-8,"",{fontSize:"8px",fontFamily:EMOJI_FONT,color:"#ffffff",backgroundColor:"#00000088",padding:{x:2,y:1}}).setOrigin(0.5);
  const hpBg=scene.add.rectangle(0,-CELL/2+4,CELL-16,4,0x000000,0.55).setOrigin(0.5);
  const hpFill=scene.add.rectangle(-((CELL-16)/2),-CELL/2+4,CELL-16,4,0x4cd68a,1).setOrigin(0,0.5);
  hpBg.setVisible(false);hpFill.setVisible(false);
  const cont=scene.add.container(0,0,[bg,emo,badge,star,hpBg,hpFill]);
  cont.setSize(CELL-6,CELL-6);
  cont.setInteractive({draggable:true,useHandCursor:true});
  scene.input.setDraggable(cont);
  cont.unit=u;
  cont.on("dragstart",()=>{scene.children.bringToTop(cont);cont.setScale(1.15);cont.setData("dragging",true);});
  cont.on("drag",(p,dx,dy)=>{cont.x=dx;cont.y=dy;});
  cont.on("dragend",()=>{cont.setScale(1);cont.setData("dragging",false);onDragEnd(cont)});
  sprites[u]={cont,bg,emo,star,hpBg,hpFill,home:{x:0,y:0}};
  return sprites[u];
}

function onDragEnd(cont){
  const u=cont.unit;
  const slot=nearestBoardSlot(cont.x,cont.y);
  const curSlot=Object.keys(S.placements).find(k=>+S.placements[k]===u);
  if(slot>=0){
    const occupant=S.placements[slot];
    if(occupant!=null&&+occupant!==u){
      if(curSlot!=null)S.placements[curSlot]=occupant;else delete S.placements[slot];
    }else if(curSlot!=null){
      delete S.placements[curSlot];
    }
    S.placements[slot]=u;
  }else if(inBenchArea(cont.x,cont.y)){
    if(curSlot!=null)delete S.placements[curSlot];
  }
  onChange();
}

class BoardScene extends Phaser.Scene{
  constructor(){super("board")}
  create(){
    scene=this;
    this.slotsLayer=this.add.layer();
    this.add.text(PAD,ENEMY_H-14,"Enemigo",{fontSize:"10px",color:"#9a9fb8"});
    this.benchLabel=this.add.text(PAD,BENCH_Y0-16,"Banquillo",{fontSize:"11px",color:"#9a9fb8"});
    const home=enemyHomeXY();
    const ebg=this.add.circle(home.x,home.y,30,0xd65b5b,0.12).setStrokeStyle(2,0xd65b5b,0.8);
    const eemo=this.add.text(home.x,home.y-4,"👾",{fontSize:"34px",fontFamily:EMOJI_FONT}).setOrigin(0.5);
    const ename=this.add.text(home.x,home.y+26,"",{fontSize:"10px",color:"#eceef8"}).setOrigin(0.5);
    const ehpBg=this.add.rectangle(home.x,home.y-34,70,6,0x000000,0.5).setOrigin(0.5);
    const ehpFill=this.add.rectangle(home.x-35,home.y-34,70,6,0xd65b5b,1).setOrigin(0,0.5);
    enemySprite={bg:ebg,emo:eemo,name:ename,hpBg:ehpBg,hpFill:ehpFill,home};
    redrawSlots();
    renderBoard();
  }
}

function redrawSlots(){
  if(!scene)return;
  scene.slotsLayer.removeAll(true);
  for(let i=0;i<BOARD_SIZE;i++){
    const p=slotXY(i),row=(i/BOARD_COLS)|0;
    const front=row===0;
    const r=scene.add.circle(p.x,p.y,CELL/2-3,0x000000,front?0.07:0.03)
      .setStrokeStyle(1,front?0xd68a4c:0x8b8bff,front?0.55:0.4);
    scene.slotsLayer.add(r);
  }
}

function updateEnemyPreview(){
  if(!enemySprite)return;
  const enemy=enemyFor(S.wave);
  enemySprite.emo.setText(enemy.emo);
  enemySprite.name.setText(enemy.name);
  enemySprite.hpFill.width=70;
}

let fighting=false;

function renderBoard(){
  if(!scene||fighting)return;
  updateEnemyPreview();
  const placed={};
  Object.keys(S.placements).forEach(k=>placed[+S.placements[k]]=+k);
  const bench=benchUnits();
  NAMES.forEach((_,u)=>{
    const owned=cnt(u)>0;
    if(!owned){if(sprites[u])sprites[u].cont.setVisible(false);return}
    const sp=ensureSprite(u);
    sp.cont.setVisible(true);
    sp.star.setText(starStr(S.own[u]));
    sp.hpBg.setVisible(false);sp.hpFill.setVisible(false);sp.hpFill.scaleX=1;
    sp.bg.setStrokeStyle(2,TRAIT_COLOR[u>>2],0.9);
    let pos;
    if(placed[u]!=null)pos=slotXY(placed[u]);
    else pos=benchXY(bench.indexOf(u));
    sp.home.x=pos.x;sp.home.y=pos.y;
    if(!sp.cont.getData("dragging")){sp.cont.x=pos.x;sp.cont.y=pos.y;}
  });
}

function flashTeam(){
  if(!scene)return;
  placedUnits().forEach(u=>{
    const sp=sprites[u];if(!sp)return;
    scene.tweens.add({targets:sp.cont,scaleX:1.2,scaleY:1.2,duration:140,yoyo:true,ease:"Quad.easeOut"});
  });
}

// --- Animación de combate ---
function startFightVisual(fightRes){
  if(!scene)return;
  fighting=true;
  scene.tweens.killAll();
  placedUnits().forEach(u=>{
    const sp=sprites[u];if(!sp)return;
    sp.hpBg.setVisible(true);sp.hpFill.setVisible(true);sp.hpFill.scaleX=1;
    sp.cont.x=sp.home.x;sp.cont.y=sp.home.y;sp.cont.setScale(1);sp.cont.setAlpha(1);
  });
  enemySprite.hpFill.width=70;
  enemySprite.bg.x=enemySprite.home.x;enemySprite.bg.y=enemySprite.home.y;
  enemySprite.emo.setPosition(enemySprite.home.x,enemySprite.home.y-4);
}

function enemyLunge(targetUnit){
  if(!scene||!enemySprite)return;
  const sp=sprites[targetUnit];
  const home=enemySprite.home;
  const toward=sp?{x:(home.x+sp.home.x)/2,y:(home.y+sp.home.y)/2}:home;
  scene.tweens.add({targets:[enemySprite.emo],x:toward.x,y:toward.y-4,duration:160,yoyo:true,ease:"Quad.easeOut"});
}

function teamAttackPulse(aliveUnits){
  if(!scene)return;
  aliveUnits.forEach(u=>{
    const sp=sprites[u];if(!sp)return;
    const home=sp.home,eh=enemySprite.home;
    const toward={x:home.x+(eh.x-home.x)*0.25,y:home.y+(eh.y-home.y)*0.25};
    scene.tweens.add({targets:sp.cont,x:toward.x,y:toward.y,duration:120,yoyo:true,ease:"Quad.easeOut"});
  });
  if(enemySprite)scene.tweens.add({targets:enemySprite.emo,scaleX:0.85,scaleY:1.15,duration:90,yoyo:true});
}

function applyEnemyHit(enemyHpRatio){
  if(!enemySprite)return;
  enemySprite.hpFill.width=Math.max(0,70*enemyHpRatio);
  scene.cameras.main.flash(80,214,91,91,false);
  scene.tweens.add({targets:enemySprite.bg,fillAlpha:0.4,duration:80,yoyo:true});
}

function applyUnitHit(u,hpRatio,died){
  const sp=sprites[u];if(!sp)return;
  sp.hpFill.scaleX=Math.max(0,hpRatio);
  scene.tweens.add({targets:sp.bg,fillAlpha:0.5,duration:90,yoyo:true});
  enemyLunge(u);
  if(died){
    scene.tweens.add({targets:sp.cont,alpha:0.25,scaleX:0.8,scaleY:0.8,duration:220});
  }
}

function endFightVisual(){
  if(!scene)return;
  fighting=false;
  placedUnits().forEach(u=>{
    const sp=sprites[u];if(!sp)return;
    sp.hpBg.setVisible(false);sp.hpFill.setVisible(false);
    sp.cont.setAlpha(1);sp.cont.setScale(1);
    sp.cont.x=sp.home.x;sp.cont.y=sp.home.y;
  });
  if(enemySprite){
    enemySprite.emo.setPosition(enemySprite.home.x,enemySprite.home.y-4);
  }
}

let lastBoardSize=BOARD_SIZE;
