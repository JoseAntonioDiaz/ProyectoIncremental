// Tablero visual con Phaser 3: banquillo (abajo) + tablero (arriba), drag & drop
const CELL=76,PAD=10,BOARD_ROWS=Math.ceil(BOARD_MAX/BOARD_COLS);
const BOARD_W=BOARD_COLS*CELL+PAD*2;
const BENCH_ROWS=2,BENCH_COLS=6;
const BENCH_Y0=BOARD_ROWS*CELL+PAD*3+10;
const GAME_H=BENCH_Y0+BENCH_ROWS*CELL+PAD;

let scene=null;
const sprites={}; // unit index -> {bg,emo,star,home:{x,y}}

function slotXY(i){
  const col=i%BOARD_COLS,row=(i/BOARD_COLS)|0;
  return{x:PAD+CELL*col+CELL/2,y:PAD+CELL*row+CELL/2};
}
function benchXY(idx){
  const col=idx%BENCH_COLS,row=(idx/BENCH_COLS)|0;
  const startX=(BOARD_W-BENCH_COLS*CELL)/2;
  return{x:startX+CELL*col+CELL/2,y:BENCH_Y0+CELL*row+CELL/2};
}

function nearestBoardSlot(x,y){
  let best=-1,bd=CELL*0.8;
  for(let i=0;i<boardSize();i++){
    const p=slotXY(i);const d=Math.hypot(p.x-x,p.y-y);
    if(d<bd){bd=d;best=i}
  }
  return best;
}
function inBenchArea(x,y){
  return y>BOARD_ROWS*CELL+PAD*2;
}

function starStr(o){
  return "★"+o[0]+"  ★★"+o[1]+"  ★★★"+o[2];
}

function ensureSprite(u){
  if(sprites[u])return sprites[u];
  const EMOJI_FONT='"Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",system-ui,sans-serif';
  const bg=scene.add.circle(0,0,CELL/2-6,0x000000,0).setStrokeStyle(2,TRAIT_COLOR[u>>2],0.9);
  const emo=scene.add.text(0,0,EMO[u],{fontSize:"30px",fontFamily:EMOJI_FONT}).setOrigin(0.5);
  const star=scene.add.text(0,CELL/2-10,"",{fontSize:"9px",fontFamily:EMOJI_FONT,color:"#ffffff",backgroundColor:"#00000088",padding:{x:3,y:1}}).setOrigin(0.5);
  const cont=scene.add.container(0,0,[bg,emo,star]);
  cont.setSize(CELL-8,CELL-8);
  cont.setInteractive({draggable:true,useHandCursor:true});
  scene.input.setDraggable(cont);
  cont.unit=u;
  cont.on("dragstart",()=>{scene.children.bringToTop(cont);cont.setScale(1.15);cont.setData("dragging",true);});
  cont.on("drag",(p,dx,dy)=>{cont.x=dx;cont.y=dy;});
  cont.on("dragend",()=>{cont.setScale(1);cont.setData("dragging",false);onDragEnd(cont)});
  sprites[u]={cont,bg,emo,star};
  return sprites[u];
}

function onDragEnd(cont){
  const u=cont.unit;
  const slot=nearestBoardSlot(cont.x,cont.y);
  const curSlot=Object.keys(S.placements).find(k=>S.placements[k]===u);
  if(slot>=0){
    const occupant=S.placements[slot];
    if(occupant!==undefined&&occupant!==u){
      // swap: el ocupante pasa al hueco anterior de u (si u venía del tablero) o al banquillo
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
    this.benchLabel=this.add.text(PAD,BENCH_Y0-18,"Banquillo",{fontSize:"11px",color:"#9a9fb8"});
    redrawSlots();
    renderBoard();
  }
}

function redrawSlots(){
  if(!scene)return;
  scene.slotsLayer.removeAll(true);
  for(let i=0;i<BOARD_MAX;i++){
    const p=slotXY(i);
    const active=i<boardSize();
    const r=scene.add.circle(p.x,p.y,CELL/2-4,active?0x000000:0x000000,active?0.04:0.02)
      .setStrokeStyle(1,active?0x8b8bff:0x555566,active?0.5:0.25);
    scene.slotsLayer.add(r);
  }
}

function flashTeam(){
  if(!scene)return;
  placedUnits().forEach(u=>{
    const sp=sprites[u];if(!sp)return;
    scene.tweens.add({targets:sp.cont,scaleX:1.25,scaleY:1.25,yoyo:true,duration:160,ease:"Quad.easeOut"});
  });
}

let lastBoardSize=0;
function renderBoard(){
  if(!scene)return;
  if(boardSize()!==lastBoardSize){lastBoardSize=boardSize();redrawSlots();}
  const placed={};
  Object.keys(S.placements).forEach(k=>placed[S.placements[k]]=+k);
  const bench=benchUnits();
  NAMES.forEach((_,u)=>{
    const owned=cnt(u)>0;
    if(!owned){if(sprites[u])sprites[u].cont.setVisible(false);return}
    const sp=ensureSprite(u);
    sp.cont.setVisible(true);
    sp.star.setText(starStr(S.own[u]));
    let pos;
    if(placed[u]!=null)pos=slotXY(placed[u]);
    else pos=benchXY(bench.indexOf(u));
    if(!sp.cont.getData("dragging")){sp.cont.x=pos.x;sp.cont.y=pos.y;}
  });
}
