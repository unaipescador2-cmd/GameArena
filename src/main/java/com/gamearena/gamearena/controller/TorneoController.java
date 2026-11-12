package com.gamearena.gamearena.controller;

import com.gamearena.gamearena.model.EstadoTorneo;
import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.model.Torneo;
import com.gamearena.gamearena.service.TorneoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de los torneos.
 *
 * Atiende todas las rutas que empiezan por /torneos:
 *  - CRUD de torneos (listar, ver, crear, modificar, borrar)
 *  - filtro por estado            (consulta derivada findByEstado)
 *  - filtro por videojuego        (consulta derivada findByVideojuegoId)
 *  - filtro videojuego + estado   (consulta COMPUESTA findByVideojuegoIdAndEstado)
 *  - participantes de un torneo
 *
 * @RestController  -> lo que devuelven los métodos se convierte a JSON.
 * @RequestMapping  -> ruta base común a todos los métodos: /torneos
 * @CrossOrigin     -> permite que la página web llame a la API (evita el error CORS).
 */
@RestController
@RequestMapping("/torneos")
@CrossOrigin(origins = "*")
public class TorneoController {

    /** Service con la lógica y validaciones de los torneos. */
    private final TorneoService torneoService;

    /**
     * Constructor: Spring inyecta el service automáticamente.
     *
     * @param torneoService service de torneos
     */
    public TorneoController(TorneoService torneoService) {
        this.torneoService = torneoService;
    }

    /**
     * GET /torneos
     * Lista todos los torneos (cada uno incluye su videojuego en el JSON).
     *
     * @return 200 OK con la lista
     */
    @GetMapping
    public ResponseEntity<List<Torneo>> listar() {
        return ResponseEntity.ok(torneoService.listar());
    }

    /**
     * GET /torneos/{id}
     * Devuelve un torneo por su id.
     *
     * @param id id del torneo (sale de la URL gracias a @PathVariable)
     * @return 200 OK con el torneo, o 404 si no existe
     */
    @GetMapping("/{id}")
    public ResponseEntity<Torneo> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(torneoService.buscarPorId(id));
    }

    /**
     * POST /torneos
     * Crea un torneo. Siempre debe llevar un videojuego que exista.
     *
     * JSON de ejemplo:
     * { "nombre": "Copa Otoño", "fecha": "2026-12-01", "premio": 500,
     *   "estado": "ABIERTO", "videojuego": { "id": 1 } }
     *
     * @param torneo datos del torneo (llegan en el cuerpo gracias a @RequestBody)
     * @return 201 CREATED con el torneo creado, o 400 si faltan datos
     */
    @PostMapping
    public ResponseEntity<Torneo> crear(@RequestBody Torneo torneo) {
        Torneo creado = torneoService.crear(torneo);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /**
     * PUT /torneos/{id}
     * Modifica un torneo existente.
     *
     * @param id    id del torneo
     * @param datos datos nuevos
     * @return 200 OK con el torneo actualizado, 404 si no existe, 400 si datos malos
     */
    @PutMapping("/{id}")
    public ResponseEntity<Torneo> modificar(@PathVariable Long id,
                                            @RequestBody Torneo datos) {
        return ResponseEntity.ok(torneoService.modificar(id, datos));
    }

    /**
     * DELETE /torneos/{id}
     * Borra un torneo. Si tiene participaciones, el service devuelve 409 CONFLICT.
     *
     * @param id id del torneo
     * @return 204 NO CONTENT si se borra
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        torneoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /torneos/estado/{estado}
     * Filtra torneos por estado (ABIERTO, EN_CURSO, FINALIZADO).
     * Spring convierte el texto de la URL al enum EstadoTorneo automáticamente;
     * si el estado no existe (p. ej. /torneos/estado/HOLA) responde 400.
     *
     * @param estado estado a buscar
     * @return 200 OK con los torneos de ese estado
     */
    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Torneo>> porEstado(@PathVariable EstadoTorneo estado) {
        return ResponseEntity.ok(torneoService.porEstado(estado));
    }

    /**
     * GET /torneos/videojuego/{id}
     * Devuelve los torneos de un videojuego.
     *
     * @param id id del videojuego
     * @return 200 OK con la lista, o 404 si el videojuego no existe
     */
    @GetMapping("/videojuego/{id}")
    public ResponseEntity<List<Torneo>> porVideojuego(@PathVariable Long id) {
        return ResponseEntity.ok(torneoService.porVideojuego(id));
    }

    /**
     * GET /torneos/videojuego/{id}/estado/{estado}
     * CONSULTA COMPUESTA: torneos de un videojuego Y con un estado concreto.
     * Usa findByVideojuegoIdAndEstado del repository.
     * Ejemplo: /torneos/videojuego/1/estado/ABIERTO
     *
     * @param id     id del videojuego
     * @param estado estado del torneo
     * @return 200 OK con los torneos que cumplen las dos condiciones
     */
    @GetMapping("/videojuego/{id}/estado/{estado}")
    public ResponseEntity<List<Torneo>> porVideojuegoYEstado(@PathVariable Long id,
                                                             @PathVariable EstadoTorneo estado) {
        return ResponseEntity.ok(torneoService.porVideojuegoYEstado(id, estado));
    }

    /**
     * GET /torneos/{id}/participantes
     * Devuelve las participaciones (jugadores inscritos) de un torneo.
     *
     * @param id id del torneo
     * @return 200 OK con la lista, o 404 si el torneo no existe
     */
    @GetMapping("/{id}/participantes")
    public ResponseEntity<List<Participacion>> participantes(@PathVariable Long id) {
        return ResponseEntity.ok(torneoService.participantes(id));
    }
}