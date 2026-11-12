package com.gamearena.gamearena.controller;

import com.gamearena.gamearena.model.Jugador;
import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.service.JugadorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de los jugadores.
 *
 * Atiende todas las rutas que empiezan por /jugadores:
 * CRUD completo (listar, ver, crear, modificar, borrar) y además
 * consultar las participaciones de un jugador.
 */
@RestController
@RequestMapping("/jugadores")
@CrossOrigin(origins = "*")
public class JugadorController {

    /** Service con la lógica y validaciones de los jugadores. */
    private final JugadorService jugadorService;

    /**
     * Constructor con inyección del service.
     *
     * @param jugadorService service de jugadores
     */
    public JugadorController(JugadorService jugadorService) {
        this.jugadorService = jugadorService;
    }

    /**
     * GET /jugadores
     * Lista todos los jugadores.
     *
     * @return 200 OK con la lista
     */
    @GetMapping
    public ResponseEntity<List<Jugador>> listar() {
        return ResponseEntity.ok(jugadorService.listar());
    }

    /**
     * GET /jugadores/{id}
     * Devuelve un jugador por su id.
     *
     * @param id id del jugador
     * @return 200 OK con el jugador, o 404 si no existe
     */
    @GetMapping("/{id}")
    public ResponseEntity<Jugador> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.buscarPorId(id));
    }

    /**
     * POST /jugadores
     * Crea un jugador nuevo.
     *
     * @param jugador JSON con nick, email y nivel
     * @return 201 CREATED con el jugador creado, o 400 si los datos no son válidos
     */
    @PostMapping
    public ResponseEntity<Jugador> crear(@RequestBody Jugador jugador) {
        Jugador creado = jugadorService.crear(jugador);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    /**
     * PUT /jugadores/{id}
     * Modifica un jugador existente.
     *
     * Recibe el id por la URL y los datos nuevos por el cuerpo.
     *
     * @param id    id del jugador a modificar
     * @param datos datos nuevos (nick, email, nivel)
     * @return 200 OK con el jugador actualizado, 404 si no existe, 400 si datos malos
     */
    @PutMapping("/{id}")
    public ResponseEntity<Jugador> modificar(@PathVariable Long id,
                                             @RequestBody Jugador datos) {
        return ResponseEntity.ok(jugadorService.modificar(id, datos));
    }

    /**
     * DELETE /jugadores/{id}
     * Borra un jugador.
     *
     * Si el jugador tiene participaciones el service lanza 409 CONFLICT
     * y no se borra (regla del enunciado).
     *
     * @param id id del jugador
     * @return 204 NO CONTENT (borrado correcto, sin cuerpo)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        jugadorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /jugadores/{id}/participaciones
     * Devuelve los torneos en los que participa un jugador.
     *
     * @param id id del jugador
     * @return 200 OK con sus participaciones, o 404 si el jugador no existe
     */
    @GetMapping("/{id}/participaciones")
    public ResponseEntity<List<Participacion>> participaciones(@PathVariable Long id) {
        return ResponseEntity.ok(jugadorService.participaciones(id));
    }
}