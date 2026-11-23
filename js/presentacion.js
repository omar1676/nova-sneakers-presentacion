// NOVA Sneakers · Presentación comercial
// Modo deslizar (como TikTok): cada diapositiva ocupa la pantalla entera y se pasa a la siguiente
// deslizando hacia arriba (dedo, rueda del ratón o panel táctil): un gesto, una diapositiva. También con el teclado:
// → / ↓ / Espacio / AvPág avanzan, ← / ↑ / RePág retroceden, Inicio / Fin,
// F pantalla completa, N notas del orador, P vista del orador en otra ventana, I índice, Esc cierra.
// En las diapositivas con visor (compra y código), → recorre primero sus pasos; en pantallas
// táctiles, los pasos se cambian deslizando a izquierda y derecha o tocándolos.

const diapos = [...document.querySelectorAll(".diapo")];
const escenario = document.getElementById("escenario");
const contador = document.getElementById("contador");
const progreso = document.getElementById("progreso");
const panelNotas = document.getElementById("notas");
const indice = document.getElementById("indice");
const botonIndice = document.getElementById("indice-abrir");
// Modo lectura (diapositivas en columna) solo con la pantalla en vertical; en horizontal, modo deslizar
const modoLectura = window.matchMedia("screen and (max-aspect-ratio: 1/1)");
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
let actual = 0;
let destino = null;          // diapositiva a la que nos estamos desplazando por teclado, índice o enlace
let temporizadorDestino;

// ---------- Cada diapositiva: cabecera (logo y sección) y lienzo de 1600 x 900 ----------
// La diapositiva ocupa toda la pantalla con su fondo (sin bandas negras) y el lienzo se escala dentro.
diapos.forEach((diapo, i) => {
  diapo.id = "diapo-" + (i + 1);
  diapo.setAttribute("aria-roledescription", "diapositiva");
  diapo.setAttribute("aria-label", `${i + 1} de ${diapos.length}: ${diapo.dataset.titulo}`);
  if (i > 0) { // la portada ya lleva el logo grande
    const cabecera = document.createElement("div");
    cabecera.className = "diapo__cabecera";
    cabecera.innerHTML = '<img src="assets/marca/logo-nova.png" alt="NOVA Sneakers"><span></span>';
    cabecera.querySelector("span").textContent = diapo.dataset.seccion;
    diapo.prepend(cabecera);
  }
  const lienzo = document.createElement("div");
  lienzo.className = "diapo__lienzo";
  lienzo.append(...diapo.childNodes);
  diapo.append(lienzo);
});

// Aviso de la portada: «Desliza»
const pista = document.createElement("p");
pista.className = "pista";
pista.setAttribute("aria-hidden", "true");
pista.innerHTML = "<span>Desliza</span><i>↑</i>";
diapos[0].append(pista);

// En vertical (móvil): aviso para girar la pantalla y verla a pantalla completa
const girar = document.createElement("p");
girar.className = "girar";
girar.textContent = "Gira el móvil para verla a pantalla completa y pasar las diapositivas deslizando.";
document.body.prepend(girar);

// Carril de puntos a la derecha: dónde estás y salto directo
const carril = document.createElement("nav");
carril.className = "carril";
carril.setAttribute("aria-label", "Diapositivas");
diapos.forEach((diapo, i) => {
  const punto = document.createElement("button");
  punto.type = "button";
  punto.setAttribute("aria-label", `Ir a la diapositiva ${i + 1}: ${diapo.dataset.titulo}`);
  punto.title = `${i + 1} · ${diapo.dataset.titulo}`;
  punto.addEventListener("click", () => irA(i));
  carril.append(punto);
});
document.body.append(carril);
const puntos = [...carril.children];

// ---------- Escala del lienzo de 1600 x 900 (cabe entero, centrado) ----------
function ajustarEscala() {
  if (modoLectura.matches) {
    document.documentElement.style.removeProperty("--escala");
    return;
  }
  const escala = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
  document.documentElement.style.setProperty("--escala", escala.toFixed(4));
}
window.addEventListener("resize", () => {
  ajustarEscala();
  if (!modoLectura.matches) escenario.scrollTo({ top: diapos[actual].offsetTop });
});
modoLectura.addEventListener("change", () => { ajustarEscala(); irA(actual, { suave: false }); });

// ---------- Visores por pasos ----------
function visorDe(diapo) {
  const visor = diapo.querySelector("[data-visor]");
  if (!visor) return null;
  return {
    pasos: [...visor.querySelectorAll(".visor__paso")],
    vistas: [...visor.querySelectorAll(".visor__vista")],
  };
}

function elegirPaso(diapo, n) {
  const visor = visorDe(diapo);
  if (!visor) return;
  visor.pasos.forEach((paso, i) => {
    paso.setAttribute("aria-selected", String(i === n));
    paso.tabIndex = i === n ? 0 : -1;
  });
  visor.vistas.forEach((vista, i) => vista.classList.toggle("activa", i === n));
  diapo.dataset.paso = n;
}

diapos.forEach((diapo) => {
  const visor = visorDe(diapo);
  if (!visor) return;
  visor.pasos.forEach((paso, i) => paso.addEventListener("click", () => elegirPaso(diapo, i)));
  elegirPaso(diapo, 0);
});

// ---------- Estado: qué diapositiva se está viendo ----------
function mostrar(n, desdeAtras = false) {
  actual = Math.max(0, Math.min(diapos.length - 1, n));
  const diapo = diapos[actual];
  diapos.forEach((d, i) => d.classList.toggle("activa", i === actual));
  puntos.forEach((p, i) => p.setAttribute("aria-current", String(i === actual)));
  const visor = visorDe(diapo);
  if (visor) elegirPaso(diapo, desdeAtras ? visor.pasos.length - 1 : 0);
  if (actual > 0) pista.classList.add("pista--oculta");
  contador.textContent = `${actual + 1} / ${diapos.length}`;
  progreso.style.width = `${((actual + 1) / diapos.length) * 100}%`;
  botonIndice.textContent = `${String(actual + 1).padStart(2, "0")} · ${diapo.dataset.seccion}`;
  try { if (location.hash !== "#" + (actual + 1)) history.replaceState(null, "", "#" + (actual + 1)); } catch { /* visor sin historial */ }
  if (!panelNotas.hidden) pintarNotas();
  pintarOrador();
}

// Ir a una diapositiva: se desplaza hasta ella (suave si es la de al lado)
function irA(n, { suave = true, desdeAtras = false } = {}) {
  cerrarIndice();
  n = Math.max(0, Math.min(diapos.length - 1, n));
  const cerca = Math.abs(n - actual) <= 1;
  mostrar(n, desdeAtras);
  if (modoLectura.matches) {
    diapos[n].scrollIntoView({ block: "start" });
    return;
  }
  destino = n;
  clearTimeout(temporizadorDestino);
  temporizadorDestino = setTimeout(() => { destino = null; }, 1200);
  escenario.scrollTo({ top: diapos[n].offsetTop, behavior: suave && cerca && !sinMovimiento.matches ? "smooth" : "auto" });
}

function siguiente() {
  const diapo = diapos[actual];
  const visor = visorDe(diapo);
  const paso = Number(diapo.dataset.paso || 0);
  if (visor && paso < visor.pasos.length - 1) return elegirPaso(diapo, paso + 1);
  if (actual < diapos.length - 1) irA(actual + 1);
}

function anterior() {
  const diapo = diapos[actual];
  const visor = visorDe(diapo);
  const paso = Number(diapo.dataset.paso || 0);
  if (visor && paso > 0) return elegirPaso(diapo, paso - 1);
  if (actual > 0) irA(actual - 1, { desdeAtras: true });
}

// Al deslizar a mano, la diapositiva actual es la que cruza el centro de la pantalla
const observador = new IntersectionObserver((entradas) => {
  for (const entrada of entradas) {
    if (!entrada.isIntersecting) continue;
    const n = diapos.indexOf(entrada.target);
    if (destino !== null) {
      if (n === destino) destino = null;   // ha llegado el desplazamiento pedido
      continue;
    }
    if (n !== actual) mostrar(n, n < actual);
  }
}, { rootMargin: "-45% 0px -45% 0px" });
diapos.forEach((diapo) => observador.observe(diapo));

// ---------- Notas del orador ----------
function pintarNotas() {
  const nota = diapos[actual].querySelector(".notas-diapo");
  panelNotas.replaceChildren();
  if (!nota) { panelNotas.textContent = "Esta diapositiva no tiene notas."; return; }
  const cabecera = document.createElement("b");
  cabecera.textContent = `${nota.dataset.orador} · ${nota.dataset.tiempo} — `;
  panelNotas.append(cabecera, nota.textContent);
}

function alternarNotas() {
  panelNotas.hidden = !panelNotas.hidden;
  document.querySelector('[data-accion="notas"]')?.setAttribute("aria-pressed", String(!panelNotas.hidden));
  if (!panelNotas.hidden) pintarNotas();
}
document.querySelectorAll(".notas-diapo").forEach((nota) => (nota.hidden = true));

// ---------- Índice por secciones ----------
function construirIndice() {
  const contenido = document.getElementById("indice-contenido");
  const grupos = new Map();
  diapos.forEach((diapo, i) => {
    const grupo = diapo.dataset.grupo;
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push(i);
  });
  for (const [grupo, numeros] of grupos) {
    const titulo = document.createElement("h2");
    titulo.textContent = grupo;
    const lista = document.createElement("div");
    lista.className = "indice__grupo";
    for (const i of numeros) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.dataset.ir = i;
      boton.innerHTML = "<span></span><b></b>";
      boton.querySelector("span").textContent = String(i + 1).padStart(2, "0");
      boton.querySelector("b").textContent = diapos[i].dataset.titulo;
      boton.addEventListener("click", () => irA(i, { suave: false }));
      lista.append(boton);
    }
    contenido.append(titulo, lista);
  }
}

function abrirIndice() {
  indice.hidden = false;
  indice.querySelectorAll("[data-ir]").forEach((b) => b.setAttribute("aria-current", String(Number(b.dataset.ir) === actual)));
  (indice.querySelector('[aria-current="true"]') || indice.querySelector("button")).focus();
}

function cerrarIndice() {
  if (indice.hidden) return;
  indice.hidden = true;
  botonIndice.focus();
}

// ---------- Pantalla completa ----------
function alternarPantalla() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

// ---------- Vista del orador (ventana aparte, tecla P) ----------
// Para proyectar con la pantalla extendida: el público ve las diapositivas y el orador,
// en su pantalla, las notas, la siguiente diapositiva y el tiempo.
let ventanaOrador = null;
let inicioOrador = 0;

function abrirOrador() {
  if (ventanaOrador && !ventanaOrador.closed) { ventanaOrador.focus(); return; }
  ventanaOrador = window.open("", "nova-orador", "width=760,height=560");
  if (!ventanaOrador) { alternarNotas(); return; } // ventana bloqueada: se usan las notas de abajo
  const doc = ventanaOrador.document;
  doc.title = "NOVA · Vista del orador";
  const estilo = doc.createElement("style");
  estilo.textContent = `body{margin:0;padding:28px;background:#171719;color:#f4f0ea;font:18px/1.5 Arial,sans-serif}
    small{color:#b6ada9;letter-spacing:.12em;text-transform:uppercase;font-size:13px}
    h1{font-size:30px;margin:6px 0 14px}#reloj{float:right;font-size:28px;color:#e5a168;font-variant-numeric:tabular-nums}
    #orador{color:#f6c696;font-weight:bold}#texto{font-size:20px;margin:10px 0 22px;white-space:pre-line}
    #siguiente{border-top:1px solid #ffffff33;padding-top:14px;color:#b6ada9}`;
  doc.head.append(estilo);
  doc.body.innerHTML = '<div id="reloj">0:00</div><small id="posicion"></small><h1 id="titulo"></h1>' +
    '<p><span id="orador"></span></p><p id="texto"></p><p id="siguiente"></p>';
  doc.addEventListener("keydown", manejarTecla);
  inicioOrador = Date.now();
  pintarOrador();
}

function pintarOrador() {
  if (!ventanaOrador || ventanaOrador.closed) return;
  const doc = ventanaOrador.document;
  const diapo = diapos[actual];
  const nota = diapo.querySelector(".notas-diapo");
  const siguienteDiapo = diapos[actual + 1];
  doc.getElementById("posicion").textContent = `${actual + 1} / ${diapos.length} · ${diapo.dataset.seccion}`;
  doc.getElementById("titulo").textContent = diapo.dataset.titulo;
  doc.getElementById("orador").textContent = nota ? `${nota.dataset.orador} · ${nota.dataset.tiempo}` : "";
  doc.getElementById("texto").textContent = nota ? nota.textContent : "";
  doc.getElementById("siguiente").textContent = siguienteDiapo ? `Siguiente: ${siguienteDiapo.dataset.titulo}` : "Última diapositiva";
}

setInterval(() => {
  if (!ventanaOrador || ventanaOrador.closed) return;
  const segundos = Math.floor((Date.now() - inicioOrador) / 1000);
  ventanaOrador.document.getElementById("reloj").textContent = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}, 1000);

// ---------- Controles ----------
document.getElementById("controles").addEventListener("click", (evento) => {
  const accion = evento.target.closest("[data-accion]")?.dataset.accion;
  if (accion === "siguiente") siguiente();
  if (accion === "anterior") anterior();
  if (accion === "indice") abrirIndice();
  if (accion === "notas") alternarNotas();
  if (accion === "pantalla") alternarPantalla();
  if (accion === "orador") abrirOrador();
});
indice.querySelector('[data-accion="cerrar-indice"]').addEventListener("click", cerrarIndice);

function manejarTecla(evento) {
  if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
  const tecla = evento.key;
  if (!indice.hidden) {
    if (tecla === "Escape" || tecla.toLowerCase() === "i") { evento.preventDefault(); cerrarIndice(); }
    return;
  }
  if (tecla === "Escape" && !panelNotas.hidden) { alternarNotas(); return; }
  if (tecla.toLowerCase() === "i" || tecla.toLowerCase() === "g") { evento.preventDefault(); abrirIndice(); return; }
  if (tecla.toLowerCase() === "n") { alternarNotas(); return; }
  if (tecla.toLowerCase() === "f") { alternarPantalla(); return; }
  if (tecla.toLowerCase() === "p") { abrirOrador(); return; }
  if (modoLectura.matches) return; // en el móvil en vertical se navega desplazando la página
  if (["ArrowRight", "PageDown", " ", "ArrowDown"].includes(tecla)) { evento.preventDefault(); siguiente(); }
  if (["ArrowLeft", "PageUp", "ArrowUp", "Backspace"].includes(tecla)) { evento.preventDefault(); anterior(); }
  if (tecla === "Home") { evento.preventDefault(); irA(0, { suave: false }); }
  if (tecla === "End") { evento.preventDefault(); irA(diapos.length - 1, { suave: false }); }
}
document.addEventListener("keydown", manejarTecla);

// ---------- Deslizar: rueda del ratón, panel táctil y dedo (una diapositiva por gesto) ----------
// Rueda: un gesto = una diapositiva, aunque la rueda dé varios golpes seguidos.
let ruedaBloqueada = false;
let ruedaAcumulada = 0;
let ruedaFin;
document.addEventListener("wheel", (e) => {
  if (modoLectura.matches || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
  if (e.target.closest?.(".indice, .notas")) return; // ahí la rueda desplaza su propio contenido
  e.preventDefault();
  clearTimeout(ruedaFin);
  ruedaFin = setTimeout(() => { ruedaBloqueada = false; ruedaAcumulada = 0; }, 180); // fin del gesto
  if (ruedaBloqueada) return;
  ruedaAcumulada += e.deltaY;
  if (Math.abs(ruedaAcumulada) < 40) return;
  ruedaBloqueada = true;
  (ruedaAcumulada > 0 ? siguiente : anterior)();
}, { passive: false });

// Dedo: la diapositiva sigue al dedo y, al soltar, pasa a la siguiente si se ha movido bastante
// (o rápido); si no, vuelve a su sitio. En horizontal, sobre la compra o el código, cambia de paso.
let arrastre = null;
escenario.addEventListener("touchstart", (e) => {
  if (e.touches.length !== 1) { arrastre = null; return; }
  const t = e.touches[0];
  arrastre = { x: t.clientX, y: t.clientY, top: escenario.scrollTop, inicio: actual,
               t0: performance.now(), eje: null, lectura: modoLectura.matches };
}, { passive: true });

escenario.addEventListener("touchmove", (e) => {
  if (!arrastre) return;
  const t = e.touches[0];
  const dx = t.clientX - arrastre.x;
  const dy = t.clientY - arrastre.y;
  if (!arrastre.eje && Math.hypot(dx, dy) > 8) arrastre.eje = Math.abs(dy) >= Math.abs(dx) ? "y" : "x";
  if (arrastre.eje === "y" && !arrastre.lectura) {
    e.preventDefault();
    escenario.scrollTop = arrastre.top - dy;
  }
}, { passive: false });

function soltar(e) {
  if (!arrastre) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - arrastre.x;
  const dy = t.clientY - arrastre.y;
  const rapidez = Math.abs(dy) / Math.max(1, performance.now() - arrastre.t0);
  const { eje, inicio, lectura } = arrastre;
  arrastre = null;
  if (eje === "y" && !lectura) {
    const pasa = e.type === "touchend" && (Math.abs(dy) > window.innerHeight * 0.18 || rapidez > 0.45);
    const n = pasa ? inicio + (dy < 0 ? 1 : -1) : inicio;
    irA(n, { desdeAtras: pasa && dy > 0 });
    return;
  }
  if (!eje) { enseñarControles(); return; } // un toque: se enseñan los controles
  const diapo = diapos[actual];
  const visor = visorDe(diapo);
  if (eje === "x" && visor && Math.abs(dx) > 50) {
    const paso = Number(diapo.dataset.paso || 0);
    elegirPaso(diapo, Math.max(0, Math.min(visor.pasos.length - 1, paso + (dx < 0 ? 1 : -1))));
  }
}
escenario.addEventListener("touchend", soltar);
escenario.addEventListener("touchcancel", soltar);

// Los controles se ven al empezar y al mover el ratón; se ocultan a los 3 s sin moverlo
let temporizador;
function enseñarControles() {
  document.body.classList.add("raton");
  clearTimeout(temporizador);
  temporizador = setTimeout(() => document.body.classList.remove("raton"), 3000);
}
document.addEventListener("mousemove", enseñarControles);
enseñarControles();

// ---------- Inicio: diapositiva del enlace (#5) o la primera ----------
window.addEventListener("hashchange", () => {
  const n = parseInt(location.hash.slice(1), 10);
  if (n >= 1 && n <= diapos.length && n - 1 !== actual) irA(n - 1, { suave: false });
});

construirIndice();
ajustarEscala();
const pedida = parseInt(location.hash.slice(1), 10);
const inicial = pedida >= 1 && pedida <= diapos.length ? pedida - 1 : 0;
mostrar(inicial);
requestAnimationFrame(() => irA(inicial, { suave: false }));
