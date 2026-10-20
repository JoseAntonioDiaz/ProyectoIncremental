// Renderizado del HUD / tienda / sinergias / prestigio (DOM)
function drawUI(){
  const $=id=>document.getElementById(id);
  $("gold").textContent="🪙 "+f(S.gold);
  $("gps").textContent=f(gps())+" oro/s";
  $("clk").textContent="👆 Jugar partida (+"+f(cv())+" oro)";
  const pi=Math.min(S.pres,39);$("rank").textContent="Rango: "+RANKS[pi>>2]+" "+(4-(pi&3));
  $("lp").textContent=S.lp+" LP (+"+(S.lp*2)+"%)";

  $("shop").innerHTML=S.shop.map((u,i)=>u==null?'<div class="card slot mu">vendido</div>':
    `<div class="card slot"><div class="e">${EMO[u]}</div><b>${NAMES[u]}</b><div class="mu">${TRAITS[u>>2]}<br>${f(BP[u&3])}/s</div><button data-b="${i}" ${S.gold<ucost(u)?"disabled":""}>🪙 ${f(ucost(u))}</button></div>`
  ).join("");

  $("rr").dataset.r=1;
  $("rr").textContent="🎲 Reroll (🪙 "+f(rcost())+")";
  $("rr").disabled=S.gold<rcost();

  $("syn").innerHTML=syn().map((s,t)=>`<div class="card ${s.m>1?"on":""}"><b>${TRAITS[t]}</b> ${s.c}/4<div class="mu">×${s.m} (2→×1.5, 3→×2.5, 4→×5)</div></div>`).join("");

  const g=gain();
  $("pres").innerHTML=`Al subir de rango reinicias la partida y ganas <b>${g} LP</b> (mínimo 1, hace falta 100K de oro total). <button data-p="1" ${g<1?"disabled":""}>⬆️ Subir de rango</button>`;
  $("ups").innerHTML=UPS.map((u,i)=>`<div class="card slot"><div>${u[0]}</div><button data-u="${i}" ${has(i)||S.lp<u[1]?"disabled":""}>${has(i)?"Comprada":u[1]+" LP"}</button></div>`).join("");

  $("boardHint").textContent=`Tablero: ${placedUnits().length}/${boardSize()} activos. Arrastra para colocar, reordenar o quitar unidades.`;
}

document.addEventListener("click",e=>{
  const t=e.target.closest("button");if(!t)return;
  if(t.dataset.b!=null)buy(+t.dataset.b);
  else if(t.dataset.r)reroll();
  else if(t.dataset.c)click();
  else if(t.dataset.p)prestige();
  else if(t.dataset.u!=null)upg(+t.dataset.u);
  else if(t.id=="reset"){
    if(!window._rs){
      window._rs=1;t.textContent="¿Seguro? Pulsa otra vez";
      setTimeout(()=>{window._rs=0;t.textContent="Borrar partida"},4000);
    }else{
      window._rs=0;t.textContent="Borrar partida";resetGame();
    }
  }
});
