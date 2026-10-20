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
    placements:{} // slot(string index) -> unit index
  };
}

try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!S.own)S=fresh();
S.rr=S.rr||0;
S.placements=S.placements||{};

const f=n=>n<1e3?n.toFixed(n<10?1:0):(()=>{const s=["","K","M","B","T","Qa"];let i=0;while(n>=1e3&&i<s.length-1){n/=1e3;i++}return n.toFixed(2)+s[i]})();
const has=i=>S.ups.includes(i);
const cnt=u=>S.own[u].reduce((a,b)=>a+b,0);
const boardSize=()=>has(4)?BOARD_MAX:BOARD_BASE;
const placedUnits=()=>Object.values(S.placements);
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
