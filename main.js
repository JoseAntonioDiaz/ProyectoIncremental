// Arranque: configura Phaser y conecta el bucle de juego con la UI
onChange=()=>{drawUI();renderBoard();};

const game=new Phaser.Game({
  type:Phaser.AUTO,
  parent:"boardHost",
  width:BOARD_W,
  height:GAME_H,
  transparent:true,
  scene:[BoardScene]
});

let last=Date.now();
setInterval(()=>{
  const n=Date.now(),dt=(n-last)/1000;last=n;
  tick(dt);
  onChange();
},250);
setInterval(save,5000);

onChange();
