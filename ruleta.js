let ruleta = [];
let rotacionAcumulada = 0;

const SUPABASE_URL = "https://bifnkdsevykstbwzpqqp.supabase.co";
const API_KEY = "sb_publishable_FRxgP2w5yNG5sWufKCxGAg_01Z45wFL";

async function getGanadores() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ganador?select=*`, {
        headers: { "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` }
    });
    return await r.json();
}

async function getNumeros() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/numero?select=*`, {
        headers: { "apikey": API_KEY, "Authorization": `Bearer ${API_KEY}` }
    });
    return await r.json();
}

async function iniciarRuleta() {
    let ganadores = await getGanadores();
    let numeros = await getNumeros();

    const todosLosValores = numeros.map(n => n.valor).concat(ganadores.map(g => g.valor));
    ruleta = Array.from(new Set(todosLosValores));

    dibujar();
    document.getElementById("iniciar").onclick = () => girarNormal();
    cargarListaNumeros(numeros, ganadores);
}

function dibujar() {
    const c = document.getElementById("canvas");
    const ctx = c.getContext("2d");
    const t = ruleta.length;
    const a = 2 * Math.PI / t;
    const offset = -Math.PI / 2;

    ctx.clearRect(0, 0, c.width, c.height);

    for (let i = 0; i < t; i++) {
        ctx.beginPath();
        ctx.moveTo(c.width/2, c.height/2);
        ctx.fillStyle = `hsl(${i*40}, 80%, 60%)`;
        ctx.arc(c.width/2, c.height/2, c.width/2, a*i + offset, a*(i+1) + offset);
        ctx.fill();

        ctx.save();
        ctx.translate(c.width/2, c.height/2);
        ctx.rotate(a*i + a/2 + offset);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText(ruleta[i], 60, 10);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(c.width/2 - 10, 0);
    ctx.lineTo(c.width/2 + 10, 0);
    ctx.lineTo(c.width/2, 30);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();
}

function girarNormal() {
    if (ruleta.length === 0) return mostrarGanador("No hay números en la ruleta.");

    const randomIndex = Math.floor(Math.random() * ruleta.length);
    const ganadorSeleccionado = ruleta[randomIndex];

    const t = ruleta.length;
    const a = 2 * Math.PI / t;
    const spins = 5;

    const anguloGanador = randomIndex * a + a/2;
    const distanciaHastaLaCima = (2 * Math.PI) - anguloGanador;

    const rotacionActualNormalizada = rotacionAcumulada % (2 * Math.PI);

    let deltaGiro = distanciaHastaLaCima - rotacionActualNormalizada;

    if (deltaGiro < 0) {
        deltaGiro += 2 * Math.PI;
    }

    const rotacionNecesaria = (spins * 2 * Math.PI) + deltaGiro;
    const targetRotation = rotacionAcumulada + rotacionNecesaria;

    const duration = 4000;
    const start = performance.now();

    function anim(time){
        let elapsed = time - start;
        let progress = Math.min(elapsed/duration,1);
        let ease = 1 - Math.pow(1 - progress, 3);

        let currentRotation = rotacionAcumulada + rotacionNecesaria * ease;
        drawRotation(currentRotation);

        if(progress < 1) {
            requestAnimationFrame(anim);
        } else {
            rotacionAcumulada = currentRotation;
            mostrarGanador(ganadorSeleccionado);
        }
    }
    requestAnimationFrame(anim);
}

function drawRotation(rotation){
    const c = document.getElementById("canvas");
    const ctx = c.getContext("2d");
    const t = ruleta.length;
    const a = 2 * Math.PI / t;
    const offset = -Math.PI / 2;

    ctx.clearRect(0, 0, c.width, c.height);

    for(let i=0;i<t;i++){
        ctx.beginPath();
        ctx.moveTo(c.width/2, c.height/2);
        ctx.fillStyle = `hsl(${i*40}, 80%, 60%)`;
        ctx.arc(c.width/2, c.height/2, c.width/2, a*i+rotation + offset, a*(i+1)+rotation + offset);
        ctx.fill();

        ctx.save();
        ctx.translate(c.width/2, c.height/2);
        ctx.rotate(a*i + a/2 + rotation + offset);
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText(ruleta[i], 60, 10);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.moveTo(c.width/2 - 10, 0);
    ctx.lineTo(c.width/2 + 10, 0);
    ctx.lineTo(c.width/2, 30);
    ctx.closePath();
    ctx.fillStyle = "red";
    ctx.fill();
}

function mostrarGanador(valor){
    let modal = document.getElementById("modalGanador");
    if(!modal){
        modal=document.createElement("div");
        modal.id="modalGanador";
        modal.style.cssText="display:flex;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);justify-content:center;align-items:center;";
        const contenido=document.createElement("div");
        contenido.style.cssText="background:white;padding:20px;border-radius:12px;text-align:center;position:relative;";
        const texto=document.createElement("h2");
        texto.id="textoGanador";
        contenido.appendChild(texto);
        const cerrar=document.createElement("span");
        cerrar.innerHTML="&times;";
        cerrar.style.cssText="position:absolute;top:10px;right:20px;cursor:pointer;font-size:24px;";
        cerrar.onclick=()=> modal.style.display="none";
        contenido.appendChild(cerrar);
        modal.appendChild(contenido);
        document.body.appendChild(modal);
    }
    document.getElementById("textoGanador").textContent="¡Ganó el número "+valor+"!";
    modal.style.display="flex";
}

function validarNumero(valor) {
    return /^[0-9]{4}$/.test(valor);
}

async function agregarNumero() {
    let numero = document.getElementById("numeroInput").value.trim();
    let msg = document.getElementById("mensaje");
    let lista = await getNumeros();

    if(lista.some(n=>n.valor==numero)){
        msg.textContent="Este número ya fue colocado.";
        msg.style.color="red";
        return;
    }
    if(!validarNumero(numero)){
        msg.textContent="El número debe ser de 4 dígitos.";
        msg.style.color="red";
        return;
    }
    const data = { valor: numero };
    let r = await fetch(`${SUPABASE_URL}/rest/v1/numero`, {
        method:"POST",
        headers:{
            "apikey": API_KEY,
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Prefer":"return=minimal"
        },
        body: JSON.stringify(data)
    });
    if(r.ok){
        msg.textContent="Número guardado.";
        msg.style.color="green";
        document.getElementById("numeroInput").value="";
        await iniciarRuleta();
        setTimeout(() => msg.textContent = '', 3000);
    }
}

function cargarListaNumeros(numeros, ganadores) {
    let lista = document.getElementById("listaNumeros");
    lista.innerHTML="";

    numeros.forEach(n=>{
        let li=document.createElement("li");
        li.innerHTML=`${n.valor} <button onclick="borrarNumero(${n.id})">X</button>`;
        lista.appendChild(li);
    });

    ganadores.forEach(g=>{
        let li=document.createElement("li");
        li.innerHTML=`${g.valor} <button onclick="borrarGanador(${g.id})">X</button>`;
        lista.appendChild(li);
    });
}

async function borrarNumero(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/numero?id=eq.${id}`,{
        method:"DELETE",
        headers:{"apikey":API_KEY,"Authorization":`Bearer ${API_KEY}`}
    });
    await iniciarRuleta();
}

async function borrarGanador(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/ganador?id=eq.${id}`,{
        method:"DELETE",
        headers:{"apikey":API_KEY,"Authorization":`Bearer ${API_KEY}`}
    });
    await iniciarRuleta();
}

document.getElementById("numeroInput").addEventListener("input",function(){
    this.value=this.value.replace(/[^0-9]/g,"");
    if(this.value.length>4) this.value=this.value.slice(0,4);
});

document.addEventListener("DOMContentLoaded",iniciarRuleta);

