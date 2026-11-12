package com.gamearena.gamearena.controller;

import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.service.ParticipacionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST de las participaciones (inscripciones).
 *
 * Solo tiene un endpoint: inscribir a un jugador en un torneo.
 * Participacion es la entidad intermedia que une Jugador y Torneo
 * (relación muchos a muchos con datos extra: puntos y posicion).
 */
@RestController
@RequestMapping("/participaciones")
@CrossOrigin(origins = "*")
public class ParticipacionController {

    /** Service con las reglas de inscripción. */
    private final ParticipacionService participacionService;

    /**
     * Constructor con inyección del service.
     *
     * @param participacionService service de participaciones
     */
    public ParticipacionController(ParticipacionService participacionService) {
        this.participacionService = participacionService;
    }

    /**
     * POST /participaciones
     * Inscribe a un jugador en un torneo.
     *
     * JSON de ejemplo:
     * { "jugador": { "id": 1 }, "torneo": { "id": 2 }, "puntos": 0, "posicion": null }
     *
     * Posibles respuestas (las decide el service):
     *  - 201 CREATED   -> inscripción correcta
     *  - 400 BAD REQUEST -> falta el id del jugador o del torneo
     *  - 404 NOT FOUND -> el jugador o el torneo no existen
     *  - 409 CONFLICT  -> ya estaba inscrito o el torneo no está ABIERTO
     *
     * @param participacion datos de la inscripción
     * @return 201 con la participación creada
     */
    @PostMapping
    public ResponseEntity<Participacion> inscribir(@RequestBody Participacion participacion) {
        Participacion creada = participacionService.inscribir(participacion);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }
}
