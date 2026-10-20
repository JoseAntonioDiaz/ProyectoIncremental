// Datos estáticos del juego
const NAMES=["Tuerquito","Engranajo","Pistón","Robotín","Brujilla","Runito","Nigromín","Astrólogo","Gruñón","Zarpas","Cuernito","Wyvernito"];
const EMO=["🔩","⚙️","🦾","🤖","🧙","🔮","💀","🌟","🐺","🐗","🦌","🐲"];
const TRAITS=["Mecánicos","Hechiceros","Bestias"];
const TRAIT_COLOR=[0x5b8def,0x9d5bd6,0xd65b7a];
const BC=[15,100,600,4000],BP=[.5,3.5,24,170];
const RANKS=["Hierro","Bronce","Plata","Oro","Platino","Esmeralda","Diamante","Maestro","Gran Maestro","Maetlo Chan"];
const UPS=[["Producción +25%",1],["Unidades -10% de coste",2],["Reroll a mitad de precio",3],["Empiezas con 100 de oro",5],["+4 huecos de tablero (total 12)",4]];
const BOARD_BASE=8,BOARD_MAX=12,BOARD_COLS=4;
const KEY="rerollidle_v1";

// Combate
const ATK=[4,28,180,1200],HP=[20,140,900,6000];
const ROLE_FRONT_HP=1.5,ROLE_BACK_ATK=1.3;
const ENEMY_NAMES=["Slime","Goblin","Esqueleto","Orco","Troll","Dragón novato","Behemoth","Archidemonio"];
const ENEMY_EMO=["🟢","👺","💀","👹","🧌","🐉","🦣","😈"];
