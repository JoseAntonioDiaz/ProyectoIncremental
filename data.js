// Datos estáticos del juego
const NAMES=["Tuerquito","Engranajo","Pistón","Robotín","Brujilla","Runito","Nigromín","Astrólogo","Gruñón","Zarpas","Cuernito","Wyvernito"];
const EMO=["🔩","⚙️","🦾","🤖","🧙","🔮","💀","🌟","🐺","🐗","🦌","🐲"];
const TRAITS=["Mecánicos","Hechiceros","Bestias"];
const TRAIT_COLOR=[0x5b8def,0x9d5bd6,0xd65b7a];
const BC=[15,100,600,4000],BP=[.5,3.5,24,170];
const RANKS=["Hierro","Bronce","Plata","Oro","Platino","Esmeralda","Diamante","Maestro","Gran Maestro","Maetlo Chan"];
const UPS=[["Producción +25%",1],["Unidades -10% de coste",2],["Reroll a mitad de precio",3],["Empiezas con 100 de oro",5]];
const BOARD_COLS=6,BOARD_ROWS=5,BOARD_SIZE=BOARD_COLS*BOARD_ROWS;
const KEY="rerollidle_v1";

// Combate: cada campeón tiene un rol FIJO (no depende de dónde lo coloques).
// Los de coste bajo/alto (tier par) son tanques; los de coste medio (tier impar) son de daño.
const ATK=[4,28,180,1200],HP=[20,140,900,6000];
const roleOf=u=>(u&3)%2===0?"tank":"dps";
const ROLE_MULT={tank:{hp:1.8,atk:0.55},dps:{hp:0.5,atk:1.8}};
const ROLE_ICON={tank:"🛡️",dps:"⚔️"};
const ENEMY_NAMES=["Slime","Goblin","Esqueleto","Orco","Troll","Dragón novato","Behemoth","Archidemonio"];
const ENEMY_EMO=["🟢","👺","💀","👹","🧌","🐉","🦣","😈"];
