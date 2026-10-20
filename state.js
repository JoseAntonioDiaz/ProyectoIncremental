// Estado y lógica pura del juego (sin DOM ni Phaser)
let S;

function fresh(keep){
  return{
    gold:(keep&&keep.ups.includes(3)?100:0)+20,
    total:0,
    own:NAMES.map(()=>[0,0,0]),
    shop:[],
    lp:keep?keep.lp:0,
    ups:keep?keep.ups:[],
    pres:keep?keep.pres:0,
    rr:0,
    wave:0,
    placements:{} // slot(string index) -> unit index
  };
}

try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!S.own)S=fresh();
S.rr=S.rr||0;
S.wave=S.wave||0;
S.placements=S.placements||{};

const f=n=>n<1e3?n.toFixed(n<10?1:0):(()=>{const s=["","K","M","B","T","Qa"];let i=0;while(n>=1e3&&i<s.length-1){n/=1e3;i++}return n.toFixed(2)+s[i]})();
const has=i=>S.ups.includes(i);
const cnt=u=>S.own[u].reduce((a,b)=>a+b,0);
const boardSize=()=>BOARD_SIZE;
const placedUnits=()=>Object.values(S.placements).map(Number);
const isPlaced=u=>placedUnits().includes(u);
const benchUnits=()=>NAMES.map((_,u)=>u).filter(u=>cnt(u)>0&&!isPlaced(u));
const units=()=>S.own.reduce((a,o)=>a+o[0]+o[1]+o[2],0);

function syn(){
  return TRAITS.map((_,t)=>{
    let c=0;
    for(let i=0;i<4;i++){const u=t*4+i;if(cnt(u)>0&&isPlaced(u))c++}
    return{c,m:c>=4?5:c>=3?2.5:c>=2?1.5:1};
  });
}

function gps(){
  const sy=syn();let g=0;
  S.own.forEach((o,u)=>{
    if(!isPlaced(u))return;
    const p=BP[u&3]*sy[u>>2].m;
    g+=p*(o[0]+o[1]*4+o[2]*16);
  });
  return g*(1+.02*S.lp)*(has(0)?1.25:1);
}

const ucost=u=>BC[u&3]*Math.pow(1.15,cnt(u))*(has(1)?.9:1);
const rcost=()=>(5+units()*2+gps()*3)*Math.pow(1.15,S.rr)*(has(2)?.5:1);

function roll(){S.shop=[0,1,2,3,4].map(()=>Math.floor(Math.random()*12))}
if(S.shop.length!=5)roll();

function fuse(){S.own.forEach(o=>{for(let s=0;s<2;s++)while(o[s]>=3){o[s]-=3;o[s+1]++}})}

function autoPlace(u){
  if(isPlaced(u))return;
  const size=boardSize();
  for(let i=0;i<size;i++){if(!(i in S.placements)){S.placements[i]=u;return}}
}

function buy(i){
  const u=S.shop[i];if(u==null)return;
  const c=ucost(u);if(S.gold<c)return;
  const wasOwned=cnt(u)>0;
  S.gold-=c;S.own[u][0]++;S.shop[i]=null;
  fuse();
  if(!wasOwned)autoPlace(u);
  onChange();
}

function reroll(){
  const c=rcost();if(S.gold<c)return;
  S.gold-=c;S.rr++;roll();onChange();
}

const gain=()=>Math.floor(Math.sqrt(S.total/1e4));
const cv=()=>1+gps()*.1;

function click(){const g=cv();S.gold+=g;S.total+=g;onChange()}

function prestige(){
  const g=gain();if(g<1)return;
  const k={lp:S.lp+g,ups:S.ups,pres:S.pres+1};
  S=fresh(k);roll();onChange();
}

function upg(i){
  const c=UPS[i][1];if(has(i)||S.lp<c)return;
  S.lp-=c;S.ups.push(i);if(i==3)S.gold+=100;
  onChange();
}

function slotOf(u){
  const slot=Object.keys(S.placements).find(k=>+S.placements[k]===u);
  return slot==null?null:+slot;
}
function rowOf(u){const s=slotOf(u);return s==null?null:Math.floor(s/BOARD_COLS)}

// Stats de combate de un campeón: fijas según su rol (tanque/daño), no dependen de dónde se coloque.
function unitCombat(u){
  const o=S.own[u];
  const mult=o[0]+o[1]*4+o[2]*16;
  const tier=u&3,role=roleOf(u),rm=ROLE_MULT[role];
  return{atk:ATK[tier]*mult*rm.atk,hp:HP[tier]*mult*rm.hp,role};
}

// Equipo ordenado de delante hacia atrás (fila, luego columna); así es como el enemigo elige objetivo.
function orderedTeam(){
  return placedUnits().map(u=>{
    const slot=slotOf(u),c=unitCombat(u);
    return{u,slot,row:Math.floor(slot/BOARD_COLS),col:slot%BOARD_COLS,...c};
  }).sort((a,b)=>a.row-b.row||a.col-b.col);
}

function teamStats(){
  let atk=0,hp=0;
  placedUnits().forEach(u=>{const c=unitCombat(u);atk+=c.atk;hp+=c.hp});
  return{atk,hp};
}

function enemyFor(wave){
  const scale=Math.pow(1.35,wave);
  return{
    name:ENEMY_NAMES[wave%ENEMY_NAMES.length],
    emo:ENEMY_EMO[wave%ENEMY_EMO.length],
    atk:Math.ceil(8*scale),
    hp:Math.ceil(40*scale)
  };
}

// Simulación por rondas: el enemigo golpea siempre a la unidad viva más adelantada
// (de ahí que poner tanques delante dé más posibilidades de ganar); el equipo golpea
// en conjunto con la suma de ataque de todas las unidades vivas.
function fight(){
  const order=orderedTeam();
  if(order.length===0)return null;
  const enemy=enemyFor(S.wave);
  const units=order.map(o=>({u:o.u,hp:o.hp,maxHp:o.hp,atk:o.atk,alive:true}));
  let enemyHp=enemy.hp;
  const log=[];
  let round=0,victory=false;
  while(round<200){
    round++;
    const teamAtk=units.filter(x=>x.alive).reduce((a,x)=>a+x.atk,0);
    if(teamAtk<=0)break;
    enemyHp=Math.max(0,enemyHp-teamAtk);
    log.push({type:"team",dmg:teamAtk,enemyHp});
    if(enemyHp<=0){victory=true;break}
    const target=units.find(x=>x.alive);
    if(!target)break;
    target.hp=Math.max(0,target.hp-enemy.atk);
    const died=target.hp<=0;
    if(died)target.alive=false;
    log.push({type:"enemy",unit:target.u,dmg:enemy.atk,hp:target.hp,maxHp:target.maxHp,died});
    if(!units.some(x=>x.alive))break;
  }
  let reward=0;
  if(victory){
    reward=Math.ceil(enemy.hp*0.5+enemy.atk*2);
    S.gold+=reward;S.total+=reward;S.wave++;
  }
  return{victory,log,reward,enemy,units};
}

function tick(dt){
  S.rr=Math.max(0,S.rr-dt/10);
  const g=gps()*dt;
  S.gold+=g;S.total+=g;
}

function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

function resetGame(){
  S=fresh();roll();
  try{localStorage.removeItem(KEY)}catch(e){}
  onChange();
}

// Hook sustituido por ui.js/board.js; aquí solo evita errores si se llama antes de tiempo
let onChange=()=>{};
