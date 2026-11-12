package com.gamearena.gamearena.controller;

import com.gamearena.gamearena.model.Videojuego;
import com.gamearena.gamearena.service.VideojuegoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST de los videojuegos.
 *
 * Recibe las peticiones HTTP que empiezan por /videojuegos y se las pasa
 * al VideojuegoService. Solo se puede listar, ver uno y crear: el enunciado
 * dice que los videojuegos NO se editan ni se borran.
 *
 * @RestController  -> indica que esta clase atiende peticiones REST y que
 *                     lo que devuelvan los métodos se convierte a JSON.
 * @RequestMapping  -> ruta base común a todos los métodos de la clase.
 * @CrossOrigin     -> permite que la página web (abierta desde otro origen,
 *                     por ejemplo file:// o el Live Server) pueda llamar a la API.
 *                     Sin esto el navegador bloquea las peticiones (error CORS).
 */
@RestController
@RequestMapping("/videojuegos")
@CrossOrigin(origins = "*")
public class VideojuegoController {

    /** Service con la lógica de los videojuegos. */
    private final VideojuegoService videojuegoService;

    /**
     * Constructor: Spring inyecta automáticamente el service
     * (inyección de dependencias por constructor).
     *
     * @param videojuegoService service de videojuegos
     */
    public VideojuegoController(VideojuegoService videojuegoService) {
        this.videojuegoService = videojuegoService;
    }

    /**
     * GET /videojuegos
     * Devuelve todos los videojuegos.
     *
     * @return 200 OK con la lista en JSON
     */
    @GetMapping
    public ResponseEntity<List<Videojuego>> listar() {
        return ResponseEntity.ok(videojuegoService.listar());
    }

    /**
     * GET /videojuegos/{id}
     * Devuelve un videojuego concreto.
     *
     * @PathVariable coge el {id} de la URL y lo mete en el parámetro.
     *
     * @param id id del videojuego
     * @return 200 OK con el videojuego (o 404 si no existe, lo lanza el service)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Videojuego> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(videojuegoService.buscarPorId(id));
    }

    /**
     * POST /videojuegos
     * Crea un videojuego nuevo.
     *
     * @RequestBody convierte el JSON que llega en el cuerpo de la petición
     * en un objeto Videojuego.
     *
     * @param videojuego datos del videojuego (nombre, genero)
     * @return 201 CREATED con el videojuego ya guardado (con su id)
     */
    @PostMapping
    public ResponseEntity<Videojuego> crear(@RequestBody Videojuego videojuego) {
        Videojuego creado = videojuegoService.crear(videojuego);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }
}