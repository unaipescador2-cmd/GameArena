# Documenta tu código: del HTML al JS y vuelta

### Documentación del frontend de GameArena

| | |
|---|---|
| **Nombre** | Unai Pescador |
| **Grupo** | 2.º DAW |
| **Fecha** | 16 de noviembre de 2026 |

## Cómo está construido el frontend

En GameArena, `index.html` es solo un esqueleto: tiene un `<main id="contenido">` vacío y el menú. Cada pantalla es una **función de `app.js` que devuelve el HTML como texto**, y la función `render()` lo coloca dentro de `<main>` según el `#hash` de la URL.

Los eventos tampoco se escriben en el HTML con `onclick`. Hay un único `document.addEventListener` por tipo de evento (`click`, `input`, `change` y `submit`) que escucha toda la página y mira qué elemento lo ha provocado (por su `id` o su atributo `data-`). Esta técnica se llama delegación de eventos.

Todas las peticiones al servidor pasan por una sola función, `api(metodo, ruta, cuerpo)`. Hace el `fetch`, convierte la respuesta de JSON a objeto y lanza un error si el servidor responde 4xx o 5xx.

## 1. Tu código, línea a línea

La función que busca por ID es `gameDetail(id)`, que hace un GET a `/videojuegos/{id}`. Las tres que la siguen en `app.js` son `gameForm()`, `playersPage()` y `updatePlayerResults()`. Los números de línea de cada bloque empiezan en 1 dentro de cada función.

### 1.1 `gameDetail(id)`

```js
 1  async function gameDetail(id) {
 2    const [g, list] = await Promise.all([
 3      api("GET", `/videojuegos/${id}`),        // PETICIÓN 8/19
 4      api("GET", `/torneos/videojuego/${id}`)  // PETICIÓN 16/19
 5    ]);
 6    return `${crumb("Videojuegos", g.nombre)}${heading(esc(g.nombre), esc(g.genero), `<button data-game-tournaments="${g.id}">Filtrar sus torneos ↗</button>`)}${notice()}${art(g, "detail-cover")}<section class="panel"><h2>Tu arena en ${esc(g.nombre)}</h2><p>${esc(decor(g).description)}</p></section><section class="section"><div class="section-heading"><h2>Torneos de ${esc(g.nombre)}</h2></div><div class="cards">${list.length ? list.map(tournamentCard).join("") : empty("Próximamente, más competición", "Todavía no hay torneos para este videojuego.", '<a class="button" href="#torneo/nuevo">Crear torneo</a>')}</div></section>`;
 7  }
```

| Línea | Código | Qué hace |
|---|---|---|
| 1 | `async function gameDetail(id) {` | Declara la pantalla de la ficha de un videojuego. Es `async` porque tiene que esperar al servidor antes de poder pintar. El `id` viene de la URL, por ejemplo `#videojuego/3`. |
| 2-5 | `const [g, list] = await Promise.all([ … ]);` | Lanza dos peticiones a la vez y espera a que lleguen las dos. Así no se esperan una detrás de otra y la pantalla carga antes. El resultado se reparte en `g` (el videojuego) y `list` (sus torneos). |
| 3 | ``api("GET", `/videojuegos/${id}`),`` | Pide el videojuego concreto (petición 8/19). Si el id no existe, el servidor responde 404 y `api()` lanza un error que la pantalla enseña. |
| 4 | ``api("GET", `/torneos/videojuego/${id}`)`` | Pide los torneos de ese videojuego (petición 16/19). |
| 6 | ``return `…`;`` | No pinta nada por sí misma: devuelve el HTML de la pantalla como texto, y `render()` lo mete en `<main>`. El contenido se detalla justo debajo de la tabla. |
| 7 | `}` | Cierra la función. |

**Qué contiene el HTML que devuelve la línea 6:**
- Las migas de pan (`crumb`) y la cabecera con el nombre y el género del juego, más un botón «Filtrar sus torneos» que luego recoge el evento `click`.
- El aviso de éxito o error (`notice()`), por si se llega aquí tras crear el juego.
- La portada tipográfica del juego (`art`) y un panel con su descripción (`decor(g).description`).
- Las tarjetas de sus torneos con `tournamentCard`. Si `list` está vacía, muestra un mensaje «Próximamente, más competición» con un botón para crear un torneo.
- Todo texto que viene del servidor pasa por `esc()`, que escapa los caracteres especiales para que no puedan romper el HTML.

**Resumen en tres respuestas**
- **Petición:** `GET /videojuegos/{id}` y `GET /torneos/videojuego/{id}`.
- **Qué recibe:** un objeto JSON con el videojuego (`id`, `nombre`, `genero`) y un array JSON con sus torneos.
- **Qué cambia en la página:** la función devuelve el HTML y `render()` rellena `<main>` con la ficha del videojuego y sus torneos.

![Ficha de un videojuego](imagenes/fe-ficha-videojuego.png)

*Figura 1. Pantalla que genera `gameDetail`.*

### 1.2 `gameForm()`

```js
 1  function gameForm() {
 2    return `${crumb("Videojuegos", "Nuevo videojuego")}${heading("Un nuevo terreno de juego", "Los campos marcados con * son obligatorios.")}<form class="panel form-panel" id="game-form" novalidate><h2>Datos del videojuego</h2><div class="form-grid">${field("nombre", "Nombre *", "", "text", "", "", 'maxlength="60"')}${field("genero", "Género *", "", "text", "Por ejemplo: Shooter, MOBA, Deportes…", "", 'maxlength="40"')}</div><p class="hint" style="margin-top:var(--s4)">Una vez creado, el videojuego no se puede editar ni eliminar.</p><div class="form-actions"><a class="button secondary" href="#videojuegos">Cancelar</a><button type="submit">Crear videojuego</button></div></form>`;
 3  }
```

| Línea | Código | Qué hace |
|---|---|---|
| 1 | `function gameForm() {` | Declara la pantalla del formulario de alta de videojuego. No es `async` porque no necesita nada del servidor para dibujarse. |
| 2 | ``return `…`;`` | Devuelve el HTML del formulario, que se detalla debajo de la tabla. |
| 3 | `}` | Cierra la función. |

**Qué contiene el HTML que devuelve la línea 2:**
- Las migas de pan y el título de la pantalla.
- Un `<form id="game-form" novalidate>`. El `id` es lo que permite al manejador de `submit` saber que este es el formulario de videojuego, y `novalidate` desactiva la validación del navegador para usar la propia, con el mensaje junto al campo.
- Dos campos creados con `field()`: nombre (máximo 60 caracteres) y género (máximo 40, con la ayuda «Por ejemplo: Shooter, MOBA, Deportes…»).
- Un aviso de la regla del caso de uso: el videojuego, una vez creado, no se puede editar ni eliminar.
- Dos botones: «Cancelar», un enlace que vuelve a `#videojuegos`, y «Crear videojuego», de tipo `submit`.

**Resumen en tres respuestas**
- **Petición:** ninguna al dibujarse. El envío ocurre después, en el evento `submit` (`POST /videojuegos`).
- **Qué recibe:** nada.
- **Qué cambia en la página:** se dibuja el formulario vacío dentro de `<main>`.

![Formulario de videojuego](imagenes/fe-form-videojuego.png)

*Figura 2. Pantalla que genera `gameForm`.*

### 1.3 `playersPage()`

```js
 1  function playersPage() {
 2    return `${heading("Jugadores", "La comunidad que hace posible cada partida.", '<a class="button" href="#jugador/nuevo">+ Añadir jugador</a>')}${notice()}<div class="filters"><label>Buscar por alias o correo<input id="player-search" type="search" value="${esc(playerQuery)}" placeholder="¿A quién buscas?"></label></div><div id="player-results"></div>`;
 3  }
```

| Línea | Código | Qué hace |
|---|---|---|
| 1 | `function playersPage() {` | Declara la estructura de la pantalla de jugadores. Solo dibuja el armazón: la tabla la rellena otra función. |
| 2 | ``return `…`;`` | Devuelve el HTML de la pantalla, que se detalla debajo de la tabla. |
| 3 | `}` | Cierra la función. |

**Qué contiene el HTML que devuelve la línea 2:**
- La cabecera «Jugadores» con el botón «+ Añadir jugador».
- El aviso de éxito o error (`notice()`), por ejemplo «Jugador eliminado.».
- Una caja de filtros con el buscador `<input id="player-search" type="search">`. Su valor inicial es `playerQuery`, para que el texto buscado no se pierda al volver a la pantalla.
- Un `<div id="player-results">` vacío. La tabla no se pinta aquí, sino en `updatePlayerResults()`, que se ejecuta justo después en `render()`.

**Resumen en tres respuestas**
- **Petición:** ninguna dentro de la función. Los jugadores ya los ha pedido `buildPage()` antes con `loadPlayers()` (`GET /jugadores`, petición 1/19).
- **Qué recibe:** el texto del buscador guardado en `playerQuery`.
- **Qué cambia en la página:** `<main>` muestra la cabecera, el buscador y un contenedor vacío para la tabla.

![Pantalla de jugadores](imagenes/fe-jugadores.png)

*Figura 3. Pantalla de jugadores: estructura de `playersPage` y tabla pintada por `updatePlayerResults`.*

### 1.4 `updatePlayerResults()`

```js
 1  function updatePlayerResults() {
 2    if (!$("#player-results")) return;
 3    const q = playerQuery.toLocaleLowerCase("es");
 4    const list = players.filter(p => (p.nick + " " + p.email).toLocaleLowerCase("es").includes(q));
 5    $("#player-results").innerHTML = list.length
 6      ? `<div class="results-bar"><span role="status">${list.length} jugadores</span></div><div class="table-wrap"><table><thead><tr><th>Jugador</th><th>Correo</th><th>Nivel</th><th>Acciones</th></tr></thead><tbody>${list.map(p => `<tr><td><div class="player-line"><span class="avatar">${esc(initials(p))}</span><a href="#jugador/${p.id}">${esc(p.nick)}</a></div></td><td>${esc(p.email)}</td><td>${esc(p.nivel)} / 10</td><td><a class="button secondary" href="#jugador/${p.id}">Ver ficha</a></td></tr>`).join("")}</tbody></table></div>`
 7      : empty("No encontramos ese jugador", "Prueba otro alias o añade una ficha nueva.", '<a class="button" href="#jugador/nuevo">Añadir jugador</a>');
 8  }
```

| Línea | Código | Qué hace |
|---|---|---|
| 1 | `function updatePlayerResults() {` | Declara la función que pinta la tabla de jugadores. No es `async` porque no pide nada al servidor: trabaja con datos que ya tiene. |
| 2 | `if (!$("#player-results")) return;` | Comprueba que el contenedor de la tabla existe. Si el usuario ya se ha ido a otra pantalla, no hace nada y evita un error. |
| 3 | `const q = playerQuery.toLocaleLowerCase("es");` | Pasa el texto buscado a minúsculas para que la búsqueda no distinga mayúsculas de minúsculas. |
| 4 | ``const list = players.filter(…);`` | Se queda solo con los jugadores cuyo alias o correo contienen el texto buscado. Filtra el array `players`, que ya se cargó al entrar en la pantalla. |
| 5 | `$("#player-results").innerHTML = list.length` | Decide qué pintar dentro del contenedor, según haya o no resultados. Aquí cambia realmente la página. |
| 6 | ``? `…` `` | Si hay resultados, pinta el contador «N jugadores» y la tabla: avatar con las iniciales, alias enlazado a su ficha, correo, nivel («x / 10») y el botón «Ver ficha». |
| 7 | `: empty(…);` | Si no hay ninguno, pinta el mensaje «No encontramos ese jugador» con un botón para añadir una ficha nueva. |
| 8 | `}` | Cierra la función. |

**Resumen en tres respuestas**
- **Petición:** ninguna. Usa los datos de `GET /jugadores` cargados antes.
- **Qué recibe:** el array `players` y el texto de `playerQuery`.
- **Qué cambia en la página:** `#player-results` se vacía y se rellena con la tabla de los jugadores que coinciden, o con el mensaje de «no hay resultados».

## 2. Tres eventos: del HTML al JS y vuelta al HTML

### Evento 1 · `change` en el desplegable «Estado» (con fetch)

**1 · En el HTML: un desplegable con el evento `change`**

`tournamentsPage()` dibuja este elemento en la pantalla de torneos:

```html
<select id="status-filter">
  <option value="">Todos los estados</option>
  <option>ABIERTO</option>
  <option>EN_CURSO</option>
  <option>FINALIZADO</option>
</select>
```

No lleva ningún atributo `onchange`. El evento `change` salta al elegir otra opción y lo recoge el `document.addEventListener("change", …)` de `app.js`, que reconoce el elemento por su `id`.

**2 · En el JS: se ejecuta el manejador y `updateTournamentResults()`**

- El manejador (línea 592 de `app.js`) guarda el valor elegido en `tournamentFilters.status` y llama a `updateTournamentResults()`.
- Esa función (líneas 281-312) construye la ruta según los filtros activos. Con solo el estado elegido: `/torneos/estado/ABIERTO` (petición 15/19).
- Pone el mensaje «Cargando…» y escribe en pantalla la consulta que va a hacer.
- Llama a `api("GET", ruta)`. Si la respuesta llega tarde, porque el usuario ya cambió el filtro, la descarta.
- Cuando llega, la guarda en `lastTournamentList` y la pinta como tarjetas.

**3 · En el servidor: `GET /torneos/estado/ABIERTO`**

El recorrido en Spring Boot es `TorneoController.porEstado` → `TorneoService.porEstado` → `TorneoRepository.findByEstado`, que ejecuta `SELECT * FROM torneo WHERE estado = 'ABIERTO'`.

Respuesta · 200 OK (ejemplo con un torneo):

```json
[
  {
    "id": 1,
    "nombre": "Copa Otoño",
    "fecha": "2026-12-01",
    "premio": 500.0,
    "estado": "ABIERTO",
    "videojuego": { "id": 1, "nombre": "Valorant", "genero": "Shooter" }
  }
]
```

![Petición en la pestaña Red](imagenes/fe-ev1-red.png)

*Figura 4. Pestaña «Red» del navegador (F12): `GET /torneos/estado/ABIERTO` con estado 200.*

**4 · De vuelta al HTML: se rellena la lista de torneos**

```html
<span id="result-count" role="status">1 torneo encontrado</span>
<small id="result-query">Consulta: GET /torneos/estado/ABIERTO</small>
<div id="tournament-results">
  <div class="cards">
    <article class="card" data-testid="tournament-1"> … </article>
  </div>
</div>
```

Cambian tres cosas: el contador de resultados, la línea que indica qué consulta se ha hecho y el contenido de `#tournament-results`, que pasa de «Cargando…» a las tarjetas.

![Antes de filtrar](imagenes/fe-ev1-antes.png)

*Figura 5. Antes: todos los estados.*

![Después de filtrar](imagenes/fe-ev1-despues.png)

*Figura 6. Después: filtrado por `ABIERTO`.*

### Evento 2 · `submit` del formulario de videojuego (con fetch)

**1 · En el HTML: un formulario con el evento `submit`**

`gameForm()` (explicada en el apartado 1.2) dibuja este formulario:

```html
<form class="panel form-panel" id="game-form" novalidate>
  …
  <button type="submit">Crear videojuego</button>
</form>
```

El evento `submit` salta al pulsar el botón o al darle a Enter dentro de un campo.

**2 · En el JS: se ejecuta el manejador de `submit`**

El manejador (línea 622 de `app.js`) hace esto con el formulario de videojuego (líneas 665-675):
1. Llama a `event.preventDefault()` para que el navegador no recargue la página.
2. Lee los campos con `FormData` y les quita los espacios sobrantes (`trim`).
3. Valida que el nombre y el género tengan al menos 2 caracteres. Si no, `validate()` escribe el mensaje junto al campo y se corta: no se envía nada.
4. Desactiva el botón para evitar un doble envío.
5. Llama a `api("POST", "/videojuegos", { nombre, genero })` (petición 9/19). Si falla, `formError()` enseña el error dentro del formulario y se reactiva el botón.

**3 · En el servidor: `POST /videojuegos`**

El recorrido es `VideojuegoController.crear` → `VideojuegoService.crear` (si el nombre está vacío responde 400; pone el `id` a `null` para que siempre sea un alta) → `save()`, que hace el `INSERT`.

Petición:

```http
POST http://localhost:8080/videojuegos
Content-Type: application/json

{ "nombre": "Apex Legends", "genero": "Shooter" }
```

Respuesta · 201 Created (ejemplo):

```json
{ "id": 6, "nombre": "Apex Legends", "genero": "Shooter" }
```

![Petición en la pestaña Red](imagenes/fe-ev2-red.png)

*Figura 7. Pestaña «Red»: `POST /videojuegos` con estado 201.*

**4 · De vuelta al HTML: aparece la ficha del videojuego**

Con la respuesta, `app.js` ejecuta `go("videojuego/" + guardado.id, "Videojuego creado…")`. Eso cambia el `#hash`, `render()` se ejecuta de nuevo y `gameDetail()` (apartado 1.1) pinta la ficha del juego recién creado. Arriba aparece este aviso verde:

```html
<div class="notice" role="status">Videojuego creado. Ya puedes crear torneos para él.</div>
```

![Formulario relleno](imagenes/fe-ev2-antes.png)

*Figura 8. Antes: formulario relleno.*

![Ficha tras crear](imagenes/fe-ev2-despues.png)

*Figura 9. Después: ficha del videojuego con el aviso de éxito.*

### Evento 3 · `input` en el buscador de jugadores (sin servidor)

**1 · En el HTML: un campo de búsqueda con el evento `input`**

`playersPage()` (apartado 1.3) dibuja este campo:

```html
<input id="player-search" type="search" placeholder="¿A quién buscas?">
```

El evento `input` salta con cada letra que se escribe o se borra.

**2 · En el JS: se ejecuta el manejador de `input`**

El manejador (líneas 583-587 de `app.js`) guarda el texto en `playerQuery` y llama a `updatePlayerResults()`, que está explicada línea a línea en el apartado 1.4.

**3 · En el servidor: no hay petición**

Este evento no llama al servidor. El filtro se hace en el navegador sobre el array `players`, que se cargó al entrar en la pantalla con `GET /jugadores`. Por eso la tabla responde al instante, sin esperas. Es la diferencia con los desplegables de torneos, que sí piden al servidor la lista filtrada.

**4 · De vuelta al HTML: la tabla se reduce**

`#player-results` se vacía y se rellena solo con las filas que coinciden con el texto, y el contador «N jugadores» cambia. Si ninguno coincide, aparece el mensaje «No encontramos ese jugador».

![Antes de buscar](imagenes/fe-ev3-antes.png)

*Figura 10. Antes: tabla completa de jugadores.*

![Después de buscar](imagenes/fe-ev3-despues.png)

*Figura 11. Después: tabla filtrada con texto en el buscador.*