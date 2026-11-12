"use strict";
/* =====================================================================
   GAMEARENA · app.js
   Página conectada con la API REST de Spring Boot (puerto 8080).

   Antes los datos estaban escritos en arrays dentro de este archivo y se
   perdían al recargar. Ahora los arrays empiezan VACÍOS y se rellenan con
   fetch() pidiendo los datos al servidor, que los guarda en la base H2.

   HTML: estructura · CSS: presentación · JavaScript: datos e interacción.

   LAS 19 PETICIONES (búscalas en el código por "PETICIÓN n/19"):
    1  GET    /jugadores                          -> loadPlayers()
    2  GET    /jugadores/{id}                     -> playerDetail() y editar jugador
    3  POST   /jugadores                          -> formulario de jugador (alta)
    4  PUT    /jugadores/{id}                     -> formulario de jugador (edición)
    5  DELETE /jugadores/{id}                     -> botón "Eliminar jugador"
    6  GET    /jugadores/{id}/participaciones     -> playerDetail() y participations()
    7  GET    /videojuegos                        -> loadGames()
    8  GET    /videojuegos/{id}                   -> gameDetail()
    9  POST   /videojuegos                        -> formulario de videojuego
   10  GET    /torneos                            -> loadTournaments() y listado sin filtros
   11  GET    /torneos/{id}                       -> tournamentDetail(), editar e inscripción
   12  POST   /torneos                            -> formulario de torneo (alta)
   13  PUT    /torneos/{id}                       -> formulario de torneo (edición)
   14  DELETE /torneos/{id}                       -> botón "Eliminar torneo"
   15  GET    /torneos/estado/{estado}            -> filtro solo por estado
   16  GET    /torneos/videojuego/{id}            -> filtro solo por videojuego y ficha del juego
   17  GET    /torneos/videojuego/{id}/estado/{e} -> filtro por los dos (consulta compuesta)
   18  GET    /torneos/{id}/participantes         -> tournamentDetail() e inscripción
   19  POST   /participaciones                    -> formulario de inscripción
   ===================================================================== */


/* =====================================================================
   1. CONFIGURACIÓN
   ===================================================================== */

/** Dirección del servidor Spring Boot. Todas las peticiones empiezan por aquí. */
const API_URL = "http://localhost:8080";


/* =====================================================================
   2. DATOS: arrays vacíos que se rellenan con lo que devuelve la API
   ===================================================================== */

let games = [];        // videojuegos  -> GET /videojuegos
let players = [];      // jugadores    -> GET /jugadores
let tournaments = [];  // torneos      -> GET /torneos


/* =====================================================================
   3. DECORACIÓN VISUAL DE LOS VIDEOJUEGOS
   Los colores y el título de la portada son DISEÑO, no datos: por eso no
   están en la base de datos. Se buscan por el nombre del videojuego y, si
   es un juego nuevo creado desde la página, se usa una decoración por defecto.
   ===================================================================== */

const DECORACION = {
  "valorant":          { short: "VALO\nRANT",         bg: "#613d3b", fg: "#f2b8ab", description: "Precisión, estrategia y trabajo coordinado. Encuentra las competiciones de Valorant organizadas en GameArena." },
  "league of legends": { short: "LEAGUE\nOF LEGENDS", bg: "#243f44", fg: "#d5c48d", description: "La estrategia se encuentra con la competición. Consulta los torneos de League of Legends y sus participantes." },
  "rocket league":     { short: "ROCKET\nLEAGUE",     bg: "#314b69", fg: "#d4e6fc", description: "Velocidad, precisión y goles imposibles. Explora las competiciones de Rocket League." },
  "fortnite":          { short: "FORT\nNITE",         bg: "#534936", fg: "#f6d886", description: "Una nueva oportunidad en cada partida. Descubre los torneos de Fortnite." },
  "ea sports fc":      { short: "EA\nSPORTS FC",      bg: "#31533e", fg: "#d2f36b", description: "El siguiente partido empieza aquí. Participa en las competiciones de EA Sports FC de la comunidad." }
};

/**
 * Devuelve la decoración de un videojuego (colores, título de portada y texto).
 * @param {object} g videojuego tal y como llega de la API: { id, nombre, genero }
 */
function decor(g) {
  const nombre = String(g?.nombre ?? "");
  const conocida = DECORACION[nombre.toLowerCase()];
  if (conocida) return conocida;
  // Juego nuevo: partimos el nombre en dos líneas para la portada
  const palabras = nombre.toUpperCase().split(" ");
  const mitad = Math.ceil(palabras.length / 2);
  return {
    short: palabras.slice(0, mitad).join(" ") + (palabras.length > 1 ? "\n" + palabras.slice(mitad).join(" ") : ""),
    bg: "#283d3b",
    fg: "#d2f36b",
    description: `Consulta las competiciones de ${nombre} organizadas en GameArena.`
  };
}


/* =====================================================================
   4. ESTADO DE LA INTERFAZ (lo que el usuario tiene seleccionado)
   ===================================================================== */

const main = document.querySelector("main");
const modal = document.querySelector("#modal");
let tournamentFilters = { q: "", game: "", status: "", view: "cards" }; // filtros de la página Torneos
let lastTournamentList = []; // última lista de torneos recibida (el buscador de texto filtra sobre ella)
let tournamentRequest = 0;   // contador para ignorar respuestas antiguas si se cambian rápido los filtros
let playerQuery = "";        // texto del buscador de jugadores
let selectedPlayer = "";     // jugador elegido en la página Participaciones
let flash = null;            // aviso que se enseña al cambiar de pantalla: { texto, tipo: "ok" | "error" }
let lastFocus = null;        // elemento con el foco antes de abrir el modal
let renderTurn = 0;          // contador para ignorar pantallas antiguas si se navega rápido


/* =====================================================================
   5. CONEXIÓN CON LA API
   ===================================================================== */

/**
 * Función ÚNICA para hablar con el servidor. Todas las peticiones pasan por aquí.
 *
 * @param {string} metodo "GET", "POST", "PUT" o "DELETE"
 * @param {string} ruta   ruta de la API, por ejemplo "/torneos/3"
 * @param {object} [cuerpo] datos a enviar en JSON (solo en POST y PUT)
 * @returns los datos de la respuesta ya convertidos de JSON a objeto (o null si es 204)
 * @throws Error con un mensaje claro si el servidor responde 400, 404, 409, 500...
 */
async function api(metodo, ruta, cuerpo) {
  const opciones = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opciones.headers["Content-Type"] = "application/json"; // le decimos al servidor que mandamos JSON
    opciones.body = JSON.stringify(cuerpo);                 // objeto JS -> texto JSON
  }

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, opciones);
  } catch (e) {
    // fetch solo falla aquí si NO hay conexión (servidor apagado, URL mal...)
    setConnection(false);
    throw new Error(`No se puede conectar con el servidor. Comprueba que Spring Boot está arrancado en ${API_URL}.`);
  }
  setConnection(true);

  if (respuesta.status === 204) return null; // 204 No Content: borrado correcto, sin cuerpo

  // Leemos el cuerpo como texto y lo intentamos convertir a JSON
  const texto = await respuesta.text();
  let datos = null;
  try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = texto; }

  if (!respuesta.ok) {
    // respuesta.ok es false con códigos 4xx y 5xx
    const error = new Error(errorMessage(respuesta.status, datos));
    error.codigo = respuesta.status;
    throw error;
  }
  return datos;
}

/**
 * Construye el mensaje de error a partir de la respuesta del servidor.
 * Spring Boot devuelve { status, error, message, path }; "message" es el texto
 * que pusimos en el service con ResponseStatusException.
 */
function errorMessage(status, datos) {
  const delServidor = typeof datos === "string" ? datos : datos?.message;
  const porDefecto = {
    400: "Los datos enviados no son válidos.",
    404: "No se ha encontrado lo que buscas.",
    409: "La operación no está permitida.",
    500: "Error interno del servidor."
  }[status] || "Error inesperado.";
  return `Error ${status}: ${delServidor || porDefecto}`;
}

/** Cambia la etiqueta de la cabecera según haya o no conexión con la API. */
function setConnection(ok) {
  const etiqueta = $("#estado-api");
  if (!etiqueta) return;
  etiqueta.textContent = ok ? "● SERVIDOR CONECTADO" : "● SIN CONEXIÓN";
  etiqueta.style.color = ok ? "var(--open)" : "var(--error)";
}

/** PETICIÓN 7/19 · GET /videojuegos -> rellena el array games */
async function loadGames() { games = await api("GET", "/videojuegos"); }

/** PETICIÓN 1/19 · GET /jugadores -> rellena el array players */
async function loadPlayers() { players = await api("GET", "/jugadores"); }

/** PETICIÓN 10/19 · GET /torneos -> rellena el array tournaments */
async function loadTournaments() { tournaments = await api("GET", "/torneos"); }


/* =====================================================================
   6. PEQUEÑAS AYUDAS PARA PINTAR HTML
   ===================================================================== */

const $ = selector => document.querySelector(selector);
/** Escapa caracteres especiales para que un texto no pueda romper el HTML. */
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
/** "2026-11-20" -> "20 nov 2026". Si llegara como [2026,11,20] también funciona. */
const dateLabel = d => {
  if (Array.isArray(d)) d = d.map((n, i) => i ? String(n).padStart(2, "0") : n).join("-");
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};
/** 500 -> "500 €" */
const money = n => Number(n ?? 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const initials = p => String(p?.nick ?? "?").slice(0, 2).toUpperCase();
const badge = status => `<span class="badge ${esc(status)}">${esc(status)}</span>`;
const positionLabel = pos => pos ? `${pos}.º` : "—";
const statusText = s => s === "ABIERTO" ? "Inscripciones abiertas" : s === "EN_CURSO" ? "Inscripciones cerradas" : "Competición terminada";
const gameOptions = selected => games.map(g => `<option value="${g.id}" ${String(selected) === String(g.id) ? "selected" : ""}>${esc(g.nombre)}</option>`).join("");
const playerOptions = (selected, list = players) => list.map(p => `<option value="${p.id}" ${String(selected) === String(p.id) ? "selected" : ""}>${esc(p.nick)} · nivel ${esc(p.nivel)}</option>`).join("");
/** Portada tipográfica de un videojuego. */
const art = (g, extra = "") => {
  const d = decor(g);
  return `<div class="card-art ${extra}" style="--game-bg:${d.bg};--game-fg:${d.fg}" aria-hidden="true"><span class="art-number">GA / ${String(g?.id ?? 0).padStart(2, "0")}</span><span class="art-title">${esc(d.short)}</span><span class="game-type">${esc(g?.genero)}</span></div>`;
};
const empty = (title, text, action = '<a class="button" href="#torneos">Explorar torneos</a>') => `<div class="empty"><h2>${title}</h2><p>${text}</p>${action}</div>`;
const heading = (title, subtitle, action = "") => `<div class="page-heading"><div><span class="eyebrow">GameArena / Temporada 2026</span><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`;
const crumb = (section, label) => `<nav class="breadcrumb" aria-label="Ruta de navegación"><a href="#inicio">Inicio</a><span aria-hidden="true">/</span><a href="#${section.toLowerCase()}">${section}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(label)}</span></nav>`;
/** Aviso verde (ok) o rojo (error) que aparece arriba de la pantalla. */
const notice = () => flash ? `<div class="notice ${flash.tipo === "error" ? "error" : ""}" role="${flash.tipo === "error" ? "alert" : "status"}">${esc(flash.texto)}</div>` : "";
/** Bloque que se ve mientras llegan los datos del servidor. */
const loadingBlock = () => `<div class="empty" aria-busy="true"><h2>Cargando…</h2><p>Pidiendo los datos al servidor.</p></div>`;
/** Si el torneo llegara sin videojuego, evitamos que la página se rompa. */
const gameOf = t => t?.videojuego || { id: 0, nombre: "Sin videojuego", genero: "" };


/* =====================================================================
   7. PIEZAS REUTILIZABLES (tarjetas y tablas)
   ===================================================================== */

/** Tarjeta de un torneo (vista "Tarjetas"). */
function tournamentCard(t) {
  const g = gameOf(t);
  return `<article class="card" data-testid="tournament-${t.id}">${art(g)}
  <div class="card-content">${badge(t.estado)}<h3><a href="#torneo/${t.id}">${esc(t.nombre)}</a></h3><p class="muted">${esc(g.nombre)} · Individual</p>
  <div class="card-meta"><span>${dateLabel(t.fecha)}</span><span>Premio ${money(t.premio)}</span></div>
  <div class="card-bottom"><span class="muted">${statusText(t.estado)}</span><a href="#torneo/${t.id}">Ver torneo <span aria-hidden="true">↗</span></a></div></div></article>`;
}

/** Tabla de torneos (vista "Tabla"). */
function tournamentTable(list) {
  return `<div class="table-wrap"><table><caption class="sr-only" hidden>Listado de torneos</caption><thead><tr><th>Torneo / videojuego</th><th>Estado</th><th>Fecha</th><th>Premio</th><th>Acción</th></tr></thead><tbody>${list.map(t => `<tr><td><a href="#torneo/${t.id}">${esc(t.nombre)}</a><small>${esc(gameOf(t).nombre)}</small></td><td>${badge(t.estado)}</td><td>${dateLabel(t.fecha)}</td><td>${money(t.premio)}</td><td><a class="button secondary" href="#torneo/${t.id}">Ver detalle</a></td></tr>`).join("")}</tbody></table></div>`;
}

/** Tabla con las participaciones de un jugador (cada fila trae su torneo dentro). */
function participationTable(list) {
  return `<div class="table-wrap"><table><thead><tr><th>Torneo</th><th>Estado</th><th>Fecha</th><th>Puntos</th><th>Posición</th></tr></thead><tbody>${list.map(p => `<tr><td><a href="#torneo/${p.torneo.id}">${esc(p.torneo.nombre)}</a><small>${esc(gameOf(p.torneo).nombre)}</small></td><td>${badge(p.torneo.estado)}</td><td>${dateLabel(p.torneo.fecha)}</td><td>${esc(p.puntos ?? 0)}</td><td>${positionLabel(p.posicion)}</td></tr>`).join("")}</tbody></table></div>`;
}

/**
 * Crea un campo de formulario con su etiqueta, ayuda y hueco para el error.
 * @param extra atributos HTML extra, por ejemplo 'min="1" max="10"'
 */
function field(name, label, value, type = "text", hint = "", cls = "", extra = "") {
  return `<label class="${cls}">${label}<input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra} required aria-describedby="${name}-error ${name}-hint"><span class="hint" id="${name}-hint">${hint}</span><span class="field-error" id="${name}-error"></span></label>`;
}


/* =====================================================================
   8. PANTALLAS
   Cada función devuelve el HTML de una pantalla. Las que necesitan datos
   concretos (un torneo, un jugador...) son "async" y piden esos datos.
   ===================================================================== */

/** INICIO. Usa los arrays games, tournaments y players (ya cargados). */
function home() {
  return `<section class="hero"><div class="hero-content"><span class="eyebrow">Tu juego. Tu comunidad. Tu arena.</span><h1>La próxima partida<br>empieza contigo.</h1><p>Encuentra tu competición, conoce a los jugadores y haz que cada partida cuente.</p><a class="button" href="#torneos">Explorar torneos <span aria-hidden="true">↗</span></a></div><span class="season-label">SEASON 26 / 27</span></section>
 <div class="intro-strip"><span><strong>${String(games.length).padStart(2, "0")}</strong> videojuegos</span><span><strong>${String(tournaments.filter(t => t.estado === "ABIERTO").length).padStart(2, "0")}</strong> torneos abiertos</span><span><strong>${String(players.length).padStart(2, "0")}</strong> jugadores</span><span class="last">Una comunidad. Muchas formas de competir.</span></div>
 <section class="section"><div class="section-heading"><h2>Entra en la competición</h2><a href="#torneos">Todos los torneos ↗</a></div><div class="cards">${tournaments.length ? tournaments.slice(0, 3).map(tournamentCard).join("") : empty("Todavía no hay torneos", "Crea el primero para empezar la temporada.", '<a class="button" href="#torneo/nuevo">Crear torneo</a>')}</div></section>
 <section class="section"><div class="section-heading"><h2>Elige tu terreno de juego</h2><a href="#videojuegos">Ver videojuegos ↗</a></div><div class="games-strip">${games.map(g => `<a class="game-link" href="#videojuego/${g.id}"><span>${esc(g.nombre)}<span class="arrow" aria-hidden="true">↗</span></span><small>${tournaments.filter(t => gameOf(t).id === g.id).length} torneos · ${esc(g.genero)}</small></a>`).join("")}</div></section>
 <section class="home-bottom"><div><span class="eyebrow">El siguiente paso es tuyo</span><h2>Todo empieza con un nombre de jugador.</h2><p>Crea tu ficha y encuentra tu sitio en la arena.</p></div><a href="#jugador/nuevo" class="button dark-button">Añadir jugador ↗</a></section>`;
}

/** TORNEOS: estructura de la página. La lista la rellena updateTournamentResults(). */
function tournamentsPage() {
  return `${heading("Torneos", "Tu siguiente reto está aquí. Filtra, compara y elige dónde competir.", '<a class="button" href="#torneo/nuevo">+ Crear torneo</a>')}${notice()}
 <div class="filters"><label class="search">Buscar torneo<input id="tournament-search" type="search" placeholder="Nombre del torneo…" value="${esc(tournamentFilters.q)}"></label><label>Videojuego<select id="game-filter"><option value="">Todos los videojuegos</option>${gameOptions(tournamentFilters.game)}</select></label><label>Estado<select id="status-filter"><option value="">Todos los estados</option>${["ABIERTO", "EN_CURSO", "FINALIZADO"].map(s => `<option ${tournamentFilters.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><button class="secondary" data-action="clear-filters">Limpiar</button></div>
 <div class="results-bar"><div><span id="result-count" role="status"></span><small id="result-query" class="muted" style="display:block"></small></div><div class="view-toggle" aria-label="Presentación del listado"><button data-view="cards" aria-pressed="${tournamentFilters.view === "cards"}">Tarjetas</button><button data-view="table" aria-pressed="${tournamentFilters.view === "table"}">Tabla</button></div></div><div id="tournament-results"></div>`;
}

/**
 * Pinta la lista de torneos según los filtros.
 * El videojuego y el estado se filtran EN EL SERVIDOR (cada combinación usa
 * una ruta distinta). El texto del buscador se filtra aquí, en el navegador.
 *
 * @param {boolean} refetch true = volver a pedir al servidor; false = solo repintar
 */
async function updateTournamentResults(refetch = true) {
  if (!$("#tournament-results")) return;
  if (refetch) {
    const { game, status } = tournamentFilters;
    let ruta;
    if (game && status) ruta = `/torneos/videojuego/${game}/estado/${status}`; // PETICIÓN 17/19 · consulta compuesta
    else if (game) ruta = `/torneos/videojuego/${game}`;                       // PETICIÓN 16/19
    else if (status) ruta = `/torneos/estado/${status}`;                       // PETICIÓN 15/19
    else ruta = "/torneos";                                                    // PETICIÓN 10/19
    const turno = ++tournamentRequest;
    $("#tournament-results").innerHTML = loadingBlock();
    $("#result-query").textContent = "Consulta: GET " + ruta;
    try {
      const lista = await api("GET", ruta);
      if (turno !== tournamentRequest) return; // llegó tarde: ya se pidió otra lista
      lastTournamentList = lista;
    } catch (e) {
      if (!$("#tournament-results")) return;
      $("#result-count").textContent = "";
      $("#tournament-results").innerHTML = empty("No se han podido cargar los torneos", esc(e.message), '<button data-action="retry-tournaments">Reintentar</button>');
      return;
    }
  }
  if (!$("#tournament-results")) return; // el usuario se fue a otra pantalla
  const q = tournamentFilters.q.toLocaleLowerCase("es");
  const list = lastTournamentList.filter(t => t.nombre.toLocaleLowerCase("es").includes(q));
  $("#result-count").textContent = `${list.length} ${list.length === 1 ? "torneo encontrado" : "torneos encontrados"}`;
  $("#tournament-results").innerHTML = list.length
    ? (tournamentFilters.view === "cards" ? `<div class="cards">${list.map(tournamentCard).join("")}</div>` : tournamentTable(list))
    : empty("No hay torneos con estos filtros", "Prueba otro videojuego o elimina los filtros para volver a explorar.", '<button data-action="clear-filters">Limpiar filtros</button>');
  document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === tournamentFilters.view)));
}

/** DETALLE DE TORNEO: pide el torneo y sus participantes a la vez. */
async function tournamentDetail(id) {
  const [t, inscritos] = await Promise.all([
    api("GET", `/torneos/${id}`),               // PETICIÓN 11/19
    api("GET", `/torneos/${id}/participantes`)  // PETICIÓN 18/19
  ]);
  const g = gameOf(t);
  const open = t.estado === "ABIERTO";
  // Ordenamos: primero por posición (1.º, 2.º...) y los que no tienen posición al final
  inscritos.sort((a, b) => (a.posicion ?? 999) - (b.posicion ?? 999) || (b.puntos ?? 0) - (a.puntos ?? 0));
  return `${crumb("Torneos", t.nombre)}${heading(esc(t.nombre), esc(g.nombre) + " · Competición individual", badge(t.estado))}${notice()}
 <div class="detail-layout"><div>${art(g, "detail-cover")}<section class="panel"><h2>Sobre el torneo</h2><p>${esc(t.nombre)} es una competición individual de ${esc(g.nombre)} con un premio de ${money(t.premio)}. ${open ? "Las inscripciones siguen abiertas." : t.estado === "EN_CURSO" ? "La competición ya está en marcha." : "La competición ha terminado y conserva su clasificación."}</p></section><section class="panel"><div class="section-heading"><h2>Participantes (${inscritos.length})</h2></div>${inscritos.length ? `<ul class="participant-list">${inscritos.map(p => `<li><span class="avatar">${esc(initials(p.jugador))}</span><div><a href="#jugador/${p.jugador.id}">${esc(p.jugador.nick)}</a><small>Nivel ${esc(p.jugador.nivel)} · ${esc(p.puntos ?? 0)} puntos${p.posicion ? " · " + positionLabel(p.posicion) + " puesto" : ""}</small></div></li>`).join("")}</ul>` : "<p>Aún no hay inscripciones. El primer puesto puede ser tuyo.</p>"}</section></div>
 <aside><section class="panel"><h2>La competición, de un vistazo</h2><dl><div><dt>Videojuego</dt><dd><a href="#videojuego/${g.id}">${esc(g.nombre)} ↗</a></dd></div><div><dt>Fecha de inicio</dt><dd>${dateLabel(t.fecha)}</dd></div><div><dt>Premio</dt><dd>${money(t.premio)}</dd></div><div><dt>Inscritos</dt><dd>${inscritos.length}</dd></div><div><dt>Formato</dt><dd>Individual</dd></div></dl><div class="stack">${open ? `<a class="button" href="#inscripcion/${t.id}">Inscribir jugador ↗</a>` : "<button disabled>Inscripción no disponible</button>"}<a class="button secondary" href="#torneo/${t.id}/editar">Editar torneo</a><button class="text-button" data-delete-tournament="${t.id}" data-name="${esc(t.nombre)}">Eliminar torneo</button></div><p class="hint" style="margin-top:var(--s4)">${open ? "Selecciona un jugador ya registrado para reservar su plaza." : t.estado === "EN_CURSO" ? "El torneo ha comenzado; solo se permite la consulta." : "El torneo ha finalizado; conserva su lista de participantes."} Un torneo con participantes no se puede eliminar.</p></section><div class="stack"><a class="button secondary" href="#torneos">Volver a torneos</a></div></aside></div>`;
}

/** FORMULARIO DE TORNEO (alta si t es null, edición si trae un torneo). */
function tournamentForm(t) {
  const id = t?.id || "";
  return `${crumb("Torneos", t ? "Editar torneo" : "Nuevo torneo")}${heading(t ? "Editar torneo" : "Prepara la próxima competición", "Define el juego, la fecha, el premio y el estado del torneo.")}<form class="panel form-panel" id="tournament-form" data-id="${id}" novalidate><h2>Datos del torneo</h2><div class="form-grid">${field("nombre", "Nombre del torneo *", t?.nombre || "", "text", "", "full", 'maxlength="80"')}<label>Videojuego *<select name="videojuego" id="videojuego" required aria-describedby="videojuego-error"><option value="">Selecciona un videojuego</option>${gameOptions(t ? gameOf(t).id : "")}</select><span class="field-error" id="videojuego-error"></span></label><label>Estado *<select name="estado" id="estado" required aria-describedby="estado-error">${["ABIERTO", "EN_CURSO", "FINALIZADO"].map(s => `<option ${t?.estado === s ? "selected" : ""}>${s}</option>`).join("")}</select><span class="field-error" id="estado-error"></span></label>${field("fecha", "Fecha de inicio *", t?.fecha || "", "date")}${field("premio", "Premio (€) *", t?.premio ?? "", "number", "Cantidad en euros, 0 o más.", "", 'min="0" step="0.01"')}</div><div class="form-actions"><a class="button secondary" href="#${id ? "torneo/" + id : "torneos"}">Cancelar</a><button type="submit">${t ? "Guardar cambios" : "Crear torneo"}</button></div></form>`;
}

/** INSCRIPCIÓN: elegir un jugador para un torneo. */
async function signup(id) {
  const [t, inscritos] = await Promise.all([
    api("GET", `/torneos/${id}`),               // PETICIÓN 11/19
    api("GET", `/torneos/${id}/participantes`), // PETICIÓN 18/19
    loadPlayers()                               // PETICIÓN 1/19
  ]);
  const open = t.estado === "ABIERTO";
  const yaInscritos = inscritos.map(p => p.jugador.id);
  const libres = players.filter(p => !yaInscritos.includes(p.id));
  return `${crumb("Torneos", "Inscripción")}${heading("Reserva un lugar en la arena", esc(t.nombre) + " · " + esc(gameOf(t).nombre))}${notice()}<form class="panel form-panel" id="signup-form" data-id="${t.id}" novalidate><h2>Inscripción de jugador</h2><div class="notice">${open ? "Solo una inscripción por jugador." : "Este torneo no admite nuevas inscripciones."}</div><label>Jugador *<select name="playerId" id="playerId" ${open ? "" : "disabled"} aria-describedby="playerId-error"><option value="">Selecciona un jugador</option>${playerOptions("", libres)}</select><span class="field-error" id="playerId-error"></span></label><p class="hint" style="margin-top:var(--s3)">Solo aparecen los jugadores que aún no participan. <a href="#jugador/nuevo" style="text-decoration:underline">Crear una nueva ficha</a>.</p><div class="form-actions"><a class="button secondary" href="#torneo/${t.id}">Volver al torneo</a><button type="submit" ${open ? "" : "disabled"}>Confirmar inscripción</button></div></form>`;
}

/** VIDEOJUEGOS: listado. Usa los arrays games y tournaments. */
function gamesPage() {
  return `${heading("Videojuegos", "Cada universo, una misma forma de competir.", '<a class="button" href="#videojuego/nuevo">+ Añadir videojuego</a>')}${notice()}<div class="cards">${games.length ? games.map(g => `<article class="card">${art(g)}<div class="card-content"><span class="eyebrow">${esc(g.genero)}</span><h2>${esc(g.nombre)}</h2><p class="muted" style="margin-top:var(--s3)">${tournaments.filter(t => gameOf(t).id === g.id).length} torneos en GameArena</p><div class="card-bottom"><span>Explora la competición</span><a href="#videojuego/${g.id}">Ver ficha ↗</a></div></div></article>`).join("") : empty("Todavía no hay videojuegos", "Añade el primero para poder crear torneos.", '<a class="button" href="#videojuego/nuevo">Añadir videojuego</a>')}</div>`;
}

/** FICHA DE VIDEOJUEGO: el juego y sus torneos. Sin editar ni borrar (lo dice el enunciado). */
async function gameDetail(id) {
  const [g, list] = await Promise.all([
    api("GET", `/videojuegos/${id}`),        // PETICIÓN 8/19
    api("GET", `/torneos/videojuego/${id}`)  // PETICIÓN 16/19
  ]);
  return `${crumb("Videojuegos", g.nombre)}${heading(esc(g.nombre), esc(g.genero), `<button data-game-tournaments="${g.id}">Filtrar sus torneos ↗</button>`)}${notice()}${art(g, "detail-cover")}<section class="panel"><h2>Tu arena en ${esc(g.nombre)}</h2><p>${esc(decor(g).description)}</p></section><section class="section"><div class="section-heading"><h2>Torneos de ${esc(g.nombre)}</h2></div><div class="cards">${list.length ? list.map(tournamentCard).join("") : empty("Próximamente, más competición", "Todavía no hay torneos para este videojuego.", '<a class="button" href="#torneo/nuevo">Crear torneo</a>')}</div></section>`;
}

/** FORMULARIO DE VIDEOJUEGO (solo alta). */
function gameForm() {
  return `${crumb("Videojuegos", "Nuevo videojuego")}${heading("Un nuevo terreno de juego", "Los campos marcados con * son obligatorios.")}<form class="panel form-panel" id="game-form" novalidate><h2>Datos del videojuego</h2><div class="form-grid">${field("nombre", "Nombre *", "", "text", "", "", 'maxlength="60"')}${field("genero", "Género *", "", "text", "Por ejemplo: Shooter, MOBA, Deportes…", "", 'maxlength="40"')}</div><p class="hint" style="margin-top:var(--s4)">Una vez creado, el videojuego no se puede editar ni eliminar.</p><div class="form-actions"><a class="button secondary" href="#videojuegos">Cancelar</a><button type="submit">Crear videojuego</button></div></form>`;
}

/** JUGADORES: estructura. La tabla la pinta updatePlayerResults(). */
function playersPage() {
  return `${heading("Jugadores", "La comunidad que hace posible cada partida.", '<a class="button" href="#jugador/nuevo">+ Añadir jugador</a>')}${notice()}<div class="filters"><label>Buscar por alias o correo<input id="player-search" type="search" value="${esc(playerQuery)}" placeholder="¿A quién buscas?"></label></div><div id="player-results"></div>`;
}

/** Pinta la tabla de jugadores filtrando el array players por el texto buscado. */
function updatePlayerResults() {
  if (!$("#player-results")) return;
  const q = playerQuery.toLocaleLowerCase("es");
  const list = players.filter(p => (p.nick + " " + p.email).toLocaleLowerCase("es").includes(q));
  $("#player-results").innerHTML = list.length
    ? `<div class="results-bar"><span role="status">${list.length} jugadores</span></div><div class="table-wrap"><table><thead><tr><th>Jugador</th><th>Correo</th><th>Nivel</th><th>Acciones</th></tr></thead><tbody>${list.map(p => `<tr><td><div class="player-line"><span class="avatar">${esc(initials(p))}</span><a href="#jugador/${p.id}">${esc(p.nick)}</a></div></td><td>${esc(p.email)}</td><td>${esc(p.nivel)} / 10</td><td><a class="button secondary" href="#jugador/${p.id}">Ver ficha</a></td></tr>`).join("")}</tbody></table></div>`
    : empty("No encontramos ese jugador", "Prueba otro alias o añade una ficha nueva.", '<a class="button" href="#jugador/nuevo">Añadir jugador</a>');
}

/** FICHA DE JUGADOR: el jugador y sus participaciones. */
async function playerDetail(id) {
  const [p, list] = await Promise.all([
    api("GET", `/jugadores/${id}`),                 // PETICIÓN 2/19
    api("GET", `/jugadores/${id}/participaciones`)  // PETICIÓN 6/19
  ]);
  return `${crumb("Jugadores", p.nick)}${heading(esc(p.nick), "Ficha de jugador", `<a class="button" href="#jugador/${id}/editar">Editar jugador</a>`)}${notice()}<div class="detail-layout"><section><div class="section-heading"><h2>Torneos asociados (${list.length})</h2></div>${list.length ? participationTable(list) : empty("Tu historia empieza aquí", "Este jugador aún no se ha inscrito en ningún torneo.")}</section><aside class="panel"><span class="avatar large">${esc(initials(p))}</span><h2>${esc(p.nick)}</h2><dl><div><dt>Correo</dt><dd style="overflow-wrap:anywhere">${esc(p.email)}</dd></div><div><dt>Nivel</dt><dd>${esc(p.nivel)} / 10</dd></div><div><dt>Torneos</dt><dd>${list.length}</dd></div></dl><div class="stack"><button data-player-participations="${id}">Consultar participaciones</button><button class="text-button" data-delete-player="${id}" data-name="${esc(p.nick)}">Eliminar jugador</button></div><p class="hint" style="margin-top:var(--s4)">Un jugador con participaciones no se puede eliminar.</p></aside></div>`;
}

/** FORMULARIO DE JUGADOR (alta si p es null, edición si trae un jugador). */
function playerForm(p) {
  const id = p?.id || "";
  return `${crumb("Jugadores", p ? "Editar jugador" : "Nuevo jugador")}${heading(p ? "Editar jugador" : "Un nuevo nombre en la arena", "Los campos marcados con * son obligatorios.")}<form class="panel form-panel" id="player-form" data-id="${id}" novalidate><h2>Datos del jugador</h2><div class="form-grid">${field("nick", "Alias *", p?.nick || "", "text", "Entre 2 y 20 caracteres. Debe ser único.", "", 'maxlength="20"')}${field("nivel", "Nivel *", p?.nivel ?? "", "number", "Del 1 al 10.", "", 'min="1" max="10" step="1"')}${field("email", "Correo electrónico *", p?.email || "", "email", "Utiliza un correo válido. No se enviarán mensajes.", "full")}</div><div class="form-actions"><a class="button secondary" href="#${id ? "jugador/" + id : "jugadores"}">Cancelar</a><button type="submit">${p ? "Guardar cambios" : "Crear jugador"}</button></div></form>`;
}

/** PARTICIPACIONES: elegir un jugador y ver sus torneos. */
async function participations() {
  const p = players.find(p => p.id === Number(selectedPlayer));
  // PETICIÓN 6/19 · solo si hay un jugador elegido
  const list = p ? await api("GET", `/jugadores/${p.id}/participaciones`) : [];
  return `${heading("Participaciones", "Sigue los torneos de cada jugador, sus puntos y su posición.", '<a class="button" href="#torneos">Buscar un torneo ↗</a>')}${notice()}<div class="filters"><label>Selecciona un jugador<select id="participation-player"><option value="">Elige un jugador</option>${playerOptions(selectedPlayer)}</select></label></div>${!p ? empty("Cada jugador tiene su recorrido", "Selecciona un jugador para consultar sus torneos e inscripciones.", "") : !list.length ? empty(esc(p.nick) + " aún no tiene participaciones", "Explora los torneos abiertos para inscribir a este jugador.") : `<div class="section-heading"><h2>${esc(p.nick)} · ${list.length} participaciones</h2><a href="#jugador/${p.id}">Ver ficha ↗</a></div>${participationTable(list)}`}`;
}

/** GUÍA DE ESTILO (contenido de DIW). Las tarjetas de ejemplo usan torneos reales de la API. */
function guide(){
 return `${heading("Guía de estilo","Un sistema visual. La misma experiencia en cada pantalla.",'<a class="button" href="GameArena_Guia_Estilo_GrupoXX.pdf" download>Descargar guía PDF ↓</a>')}
 <div class="guide-grid"><section class="panel full"><span class="eyebrow">01 / Identidad</span><h2>Competitiva por fuera. Clara por dentro.</h2><p>GameArena combina una marca tipográfica, superficies claras y un acento lima para las acciones principales. Las portadas tipográficas identifican cada juego sin depender de imágenes oficiales. La fotografía de arena es una ilustración generada, no un evento real.</p></section>
 <section class="panel"><span class="eyebrow">02 / Color</span><h2>Una paleta con propósito</h2><div class="swatches">${[["#19201d","Tinta","Texto"],["#f6f7f3","Niebla","Fondo"],["#d2f36b","Lima","Acción"],["#59635b","Pizarra","Secundario"]].map(c=>`<div class="swatch"><i style="background:${c[0]}"></i><strong>${c[1]}</strong><small>${c[0]} · ${c[2]}</small></div>`).join("")}</div><div class="guide-status">${badge("ABIERTO")}${badge("EN_CURSO")}${badge("FINALIZADO")}</div><p class="hint" style="margin-top:var(--s4)">Los estados siempre incluyen texto, no solo color. Rojo #A92E36 para errores y acciones destructivas.</p></section>
 <section class="panel"><span class="eyebrow">03 / Tipografía</span><h2>Satoshi, sin ruido</h2><div class="type-sample"><strong style="font-size:var(--text-xl)">Tu próxima competición</strong><small>Título: 26–36 px · peso 700</small></div><div class="type-sample"><strong style="font-size:var(--text-lg)">Información que importa</strong><small>Sección: 20 px · peso 700</small></div><p>Texto de lectura: 16 px, peso 400, interlineado 1,55.</p><small>Controles: 14 px · etiquetas y metadatos: 12 px.</small></section>
 <section class="panel"><span class="eyebrow">04 / Composición y Gestalt</span><h2>Orden que se reconoce</h2><ul class="guide-list"><li>Proximidad: fecha y premio forman un grupo en cada tarjeta.</li><li>Semejanza: todos los estados y botones conservan su aspecto.</li><li>Continuidad: tarjetas alineadas y títulos sobre un eje común.</li><li>Figura–fondo: paneles blancos sobre fondo gris claro.</li><li>Espaciado base de 4 px; separaciones frecuentes de 8, 16, 24 y 32 px.</li></ul><p>Retícula de 3, 2 y 1 columnas. El menú se despliega en pantallas de hasta 800 px; las tablas conservan sus columnas con desplazamiento horizontal.</p></section>
 <section class="panel"><span class="eyebrow">05 / Navegación</span><h2>Todo tiene un lugar</h2><div class="map"><a href="#inicio">Inicio → accesos a torneos, juegos y alta</a><a href="#torneos">Torneos → detalle → inscripción / edición</a><a href="#videojuegos">Videojuegos → ficha / alta → torneos del juego</a><a href="#jugadores">Jugadores → ficha → alta / edición / eliminación</a><a href="#participaciones">Participaciones → jugador → torneos asociados</a></div></section>
 <section class="panel"><span class="eyebrow">06 / Recorridos</span><h2>Del objetivo a la acción</h2><p><strong>Inscribirse:</strong> Inicio → Torneos → filtrar por juego y ABIERTO → detalle → Inscribir jugador → confirmar → lista de participantes.</p><p style="margin-top:var(--s4)"><strong>Gestionar un jugador:</strong> Jugadores → Añadir jugador → completar formulario → ficha → Editar jugador → guardar → consultar participaciones.</p></section>
 <section class="panel"><span class="eyebrow">07 / Componentes y estados</span><h2>La misma regla, siempre</h2><div class="action-row"><a class="button" href="#jugador/nuevo">Acción principal</a><a class="button secondary" href="#torneos">Secundaria</a><button disabled>No disponible</button></div><p style="margin-top:var(--s4)">Los formularios muestran etiquetas persistentes, mensajes junto al campo y un contorno visible al recibir foco. Eliminar un jugador o un torneo requiere confirmación.</p><div class="notice error" style="margin-top:var(--s4);margin-bottom:0">Ejemplo de error: introduce un correo electrónico válido.</div></section>
 <section class="panel full"><span class="eyebrow">08 / Alternativas de presentación</span><h2>Tarjetas para descubrir. Tabla para comparar.</h2><p>Las tarjetas priorizan el reconocimiento del videojuego, el estado y la disponibilidad. La tabla facilita comparar fechas y premios, pero necesita desplazamiento horizontal en móvil. Elegimos tarjetas como vista inicial por su lectura visual y adaptación; la tabla sigue disponible para tareas de consulta.</p><div class="section cards">${tournaments.slice(0,3).map(tournamentCard).join("")}</div><div style="margin-top:var(--s6)">${tournamentTable(tournaments.slice(0,3))}</div></section></div>`;
}


/** Pantalla para rutas que no existen o registros que ya no están (404). */
function notFound(text = "Puede que el registro se haya eliminado.") {
  return heading("Esta pantalla no está disponible", esc(text)) + '<a class="button" href="#inicio">Volver al inicio</a>';
}

/** Pantalla de error cuando el servidor falla o no responde. */
function errorPage(e) {
  if (e.codigo === 404) return notFound(e.message);
  return heading("No se han podido cargar los datos", "La página necesita el servidor para funcionar.") + `<div class="notice error" role="alert">${esc(e.message)}</div><button data-action="retry">Reintentar</button>`;
}


/* =====================================================================
   9. ENRUTADO: qué pantalla se ve según el #hash de la URL
   ===================================================================== */

/**
 * Carga los datos que necesita cada pantalla y devuelve su HTML.
 * Ejemplos de hash: #torneos · #torneo/3 · #torneo/3/editar · #jugador/nuevo
 */
async function buildPage(route, id, action) {
  const num = Number(id);
  switch (route) {
    case "inicio":
      await Promise.all([loadGames(), loadTournaments(), loadPlayers()]);
      return home();
    case "torneos":
      await loadGames(); // para el desplegable de videojuegos del filtro
      return tournamentsPage();
    case "torneo":
      if (id === "nuevo") { await loadGames(); return tournamentForm(null); }
      if (action === "editar") {
        const [t] = await Promise.all([api("GET", `/torneos/${num}`), loadGames()]); // PETICIÓN 11/19
        return tournamentForm(t);
      }
      return tournamentDetail(num);
    case "videojuegos":
      await Promise.all([loadGames(), loadTournaments()]);
      return gamesPage();
    case "videojuego":
      return id === "nuevo" ? gameForm() : gameDetail(num);
    case "jugadores":
      await loadPlayers();
      return playersPage();
    case "jugador":
      if (id === "nuevo") { await loadPlayers(); return playerForm(null); }
      if (action === "editar") {
        const [p] = await Promise.all([api("GET", `/jugadores/${num}`), loadPlayers()]); // PETICIÓN 2/19
        return playerForm(p);
      }
      return playerDetail(num);
    case "inscripcion":
      return signup(num);
    case "participaciones":
      await loadPlayers();
      return participations();
    case "guia":
      await loadTournaments();
      return guide();
    default:
      return notFound();
  }
}

/** Dibuja la pantalla actual. Se ejecuta al abrir la página y cada vez que cambia el #hash. */
async function render() {
  const [route = "inicio", id, action] = (location.hash.slice(1) || "inicio").split("/");
  if (route === "contenido") { main.focus(); return; }

  // Marca en el menú la sección actual
  document.querySelectorAll("#navigation a").forEach(a => {
    const current = a.hash === "#" + ({ torneo: "torneos", inscripcion: "torneos", jugador: "jugadores", videojuego: "videojuegos" }[route] || route);
    if (current) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  $("#navigation").classList.remove("open"); $("#menu-toggle").setAttribute("aria-expanded", "false");

  const turn = ++renderTurn;
  main.innerHTML = loadingBlock();
  let html;
  try { html = await buildPage(route, id, action); }
  catch (e) { html = errorPage(e); }
  if (turn !== renderTurn) return; // mientras cargaba, el usuario ya se fue a otra pantalla

  main.innerHTML = html;
  flash = null; // el aviso ya se ha enseñado
  if (route === "torneos") updateTournamentResults();
  if (route === "jugadores") updatePlayerResults();
  document.title = (main.querySelector("h1")?.textContent || "GameArena") + " | GameArena";
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

/**
 * Navega a otra pantalla mostrando un aviso.
 * @param hash   destino, por ejemplo "jugador/3"
 * @param texto  mensaje a enseñar arriba
 * @param tipo   "ok" (verde) o "error" (rojo)
 */
function go(hash, texto = "", tipo = "ok") {
  flash = texto ? { texto, tipo } : null;
  if (location.hash === "#" + hash) render(); else location.hash = hash;
}

/** Mensaje flotante para lectores de pantalla y avisos rápidos. */
function say(message) { $("#announcement").textContent = message; clearTimeout(say.timer); say.timer = setTimeout(() => $("#announcement").textContent = "", 4500); }

/** Ventana de confirmación antes de borrar algo. */
function confirmation(title, text, confirmText, callback) {
  lastFocus = document.activeElement;
  $("#modal-content").innerHTML = `<h2 id="modal-title">${esc(title)}</h2><p>${esc(text)}</p><div class="action-row"><button class="secondary" id="dialog-cancel">Volver</button><button class="danger" id="dialog-confirm">${confirmText}</button></div>`;
  modal.showModal(); $("#dialog-cancel").focus();
  $("#dialog-cancel").onclick = () => modal.close();
  $("#dialog-confirm").onclick = () => { modal.close(); callback(); };
}
modal.addEventListener("close", () => lastFocus?.isConnected && lastFocus.focus());


/* =====================================================================
   10. EVENTOS: clics, escritura en buscadores y cambios en desplegables
   ===================================================================== */

document.addEventListener("click", event => {
  const b = event.target.closest("button"); if (!b) return;

  if (b.id === "menu-toggle") { const open = $("#navigation").classList.toggle("open"); b.setAttribute("aria-expanded", String(open)); }
  if (b.dataset.action === "retry") render();
  if (b.dataset.action === "retry-tournaments") updateTournamentResults();
  if (b.dataset.action === "clear-filters") {
    tournamentFilters = { ...tournamentFilters, q: "", game: "", status: "" };
    $("#tournament-search").value = ""; $("#game-filter").value = ""; $("#status-filter").value = "";
    updateTournamentResults();
  }
  if (b.dataset.view) { tournamentFilters.view = b.dataset.view; updateTournamentResults(false); }
  if (b.dataset.gameTournaments) { tournamentFilters = { ...tournamentFilters, game: b.dataset.gameTournaments, q: "", status: "" }; go("torneos"); }
  if (b.dataset.playerParticipations) { selectedPlayer = b.dataset.playerParticipations; go("participaciones"); }

  // PETICIÓN 5/19 · DELETE /jugadores/{id}
  if (b.dataset.deletePlayer) {
    const id = Number(b.dataset.deletePlayer);
    confirmation(`¿Eliminar a ${b.dataset.name}?`, "Se borrará su ficha. Si tiene participaciones, el servidor no permitirá eliminarlo.", "Eliminar jugador", async () => {
      try {
        await api("DELETE", `/jugadores/${id}`);
        if (selectedPlayer === String(id)) selectedPlayer = "";
        go("jugadores", "Jugador eliminado.");
      } catch (e) {
        go(location.hash.slice(1), e.message, "error"); // por ejemplo 409: tiene participaciones
      }
    });
  }

  // PETICIÓN 14/19 · DELETE /torneos/{id}
  if (b.dataset.deleteTournament) {
    const id = Number(b.dataset.deleteTournament);
    confirmation(`¿Eliminar «${b.dataset.name}»?`, "Se borrará el torneo. Si tiene participantes, el servidor no permitirá eliminarlo.", "Eliminar torneo", async () => {
      try {
        await api("DELETE", `/torneos/${id}`);
        go("torneos", "Torneo eliminado.");
      } catch (e) {
        go(location.hash.slice(1), e.message, "error");
      }
    });
  }
});

document.addEventListener("input", event => {
  // El buscador de texto NO pide nada al servidor: filtra la lista que ya tenemos
  if (event.target.id === "tournament-search") { tournamentFilters.q = event.target.value; updateTournamentResults(false); }
  if (event.target.id === "player-search") { playerQuery = event.target.value; updatePlayerResults(); }
});

document.addEventListener("change", event => {
  // Los desplegables SÍ piden al servidor la lista filtrada (peticiones 15, 16 y 17)
  if (event.target.id === "game-filter") { tournamentFilters.game = event.target.value; updateTournamentResults(); }
  if (event.target.id === "status-filter") { tournamentFilters.status = event.target.value; updateTournamentResults(); }
  if (event.target.id === "participation-player") { selectedPlayer = event.target.value; render().then(() => $("#participation-player")?.focus()); }
});


/* =====================================================================
   11. FORMULARIOS: validar, enviar a la API y enseñar el resultado
   ===================================================================== */

/** Marca los campos con error. Devuelve true si no hay ninguno. */
function validate(form, errors) {
  form.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  form.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
  for (const [name, message] of Object.entries(errors)) { form.elements[name].setAttribute("aria-invalid", "true"); $("#" + name + "-error").textContent = message; }
  const first = Object.keys(errors)[0]; if (first) { form.elements[first].focus(); return false; } return true;
}

/** Enseña dentro del formulario el error que devuelve el servidor (400, 404, 409...). */
function formError(form, message) {
  let box = form.querySelector(".form-error");
  if (!box) {
    box = document.createElement("div");
    box.className = "notice error form-error";
    box.setAttribute("role", "alert");
    form.querySelector("h2").after(box);
  }
  box.textContent = message;
  box.scrollIntoView({ block: "nearest" });
}

document.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target, data = Object.fromEntries(new FormData(form)), id = Number(form.dataset.id), errors = {};
  const boton = form.querySelector('button[type="submit"]');

  /* ---------- Jugador: PETICIÓN 3/19 (POST) o 4/19 (PUT) ---------- */
  if (form.id === "player-form") {
    data.nick = data.nick.trim(); data.email = data.email.trim();
    const nivel = Number(data.nivel);
    if (data.nick.length < 2 || data.nick.length > 20) errors.nick = "El alias debe tener entre 2 y 20 caracteres.";
    else if (players.some(p => p.id !== id && p.nick.toLocaleLowerCase() === data.nick.toLocaleLowerCase())) errors.nick = "Ese alias ya está registrado.";
    if (!Number.isInteger(nivel) || nivel < 1 || nivel > 10) errors.nivel = "El nivel debe ser un número entero del 1 al 10.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Introduce un correo electrónico válido.";
    if (!validate(form, errors)) return;
    const jugador = { nick: data.nick, email: data.email, nivel }; // mismo formato que la entidad Jugador
    boton.disabled = true;
    try {
      const guardado = id ? await api("PUT", `/jugadores/${id}`, jugador) : await api("POST", "/jugadores", jugador);
      playerQuery = "";
      go("jugador/" + guardado.id, id ? "Los cambios del jugador se han guardado." : "Jugador creado. Ya puedes inscribirlo en un torneo.");
    } catch (e) { formError(form, e.message); boton.disabled = false; }
  }

  /* ---------- Torneo: PETICIÓN 12/19 (POST) o 13/19 (PUT) ---------- */
  if (form.id === "tournament-form") {
    data.nombre = data.nombre.trim();
    const premio = Number(data.premio);
    if (data.nombre.length < 3) errors.nombre = "Escribe un nombre de al menos 3 caracteres.";
    if (!data.videojuego) errors.videojuego = "Un torneo siempre tiene que tener un videojuego.";
    if (!["ABIERTO", "EN_CURSO", "FINALIZADO"].includes(data.estado)) errors.estado = "Elige un estado válido.";
    if (!data.fecha || !Number.isFinite(new Date(data.fecha + "T12:00:00").getTime())) errors.fecha = "Selecciona una fecha válida.";
    if (data.premio === "" || !Number.isFinite(premio) || premio < 0) errors.premio = "El premio debe ser 0 o más.";
    if (!validate(form, errors)) return;
    // Mismo formato que la entidad Torneo: el videojuego va como objeto con su id
    const torneo = { nombre: data.nombre, fecha: data.fecha, premio, estado: data.estado, videojuego: { id: Number(data.videojuego) } };
    boton.disabled = true;
    try {
      const guardado = id ? await api("PUT", `/torneos/${id}`, torneo) : await api("POST", "/torneos", torneo);
      go("torneo/" + guardado.id, id ? "Los cambios del torneo se han guardado." : "Torneo creado. Su ficha ya está disponible.");
    } catch (e) { formError(form, e.message); boton.disabled = false; }
  }

  /* ---------- Videojuego: PETICIÓN 9/19 (POST) ---------- */
  if (form.id === "game-form") {
    data.nombre = data.nombre.trim(); data.genero = data.genero.trim();
    if (data.nombre.length < 2) errors.nombre = "Escribe el nombre del videojuego.";
    if (data.genero.length < 2) errors.genero = "Escribe el género del videojuego.";
    if (!validate(form, errors)) return;
    boton.disabled = true;
    try {
      const guardado = await api("POST", "/videojuegos", { nombre: data.nombre, genero: data.genero });
      go("videojuego/" + guardado.id, "Videojuego creado. Ya puedes crear torneos para él.");
    } catch (e) { formError(form, e.message); boton.disabled = false; }
  }

  /* ---------- Inscripción: PETICIÓN 19/19 (POST /participaciones) ---------- */
  if (form.id === "signup-form") {
    const pid = Number(data.playerId);
    if (!pid) errors.playerId = "Selecciona un jugador para continuar.";
    if (!validate(form, errors)) return;
    // Mismo formato que la entidad Participacion: jugador y torneo como objetos con id
    const participacion = { jugador: { id: pid }, torneo: { id }, puntos: 0, posicion: null };
    boton.disabled = true;
    try {
      await api("POST", "/participaciones", participacion);
      const nick = players.find(p => p.id === pid)?.nick || "El jugador";
      go("torneo/" + id, `${nick} se ha inscrito correctamente. Su nombre aparece en la lista de participantes.`);
    } catch (e) { formError(form, e.message); boton.disabled = false; }
  }
});


/* =====================================================================
   12. ARRANQUE
   ===================================================================== */

window.addEventListener("hashchange", render); // cada cambio de #hash dibuja otra pantalla
render();                                     // primera pantalla al abrir la página
