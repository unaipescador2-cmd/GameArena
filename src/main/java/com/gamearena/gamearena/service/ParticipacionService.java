package com.gamearena.gamearena.service;

import com.gamearena.gamearena.model.EstadoTorneo;
import com.gamearena.gamearena.model.Jugador;
import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.model.Torneo;
import com.gamearena.gamearena.repository.JugadorRepository;
import com.gamearena.gamearena.repository.ParticipacionRepository;
import com.gamearena.gamearena.repository.TorneoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Service de Participacion: inscribe jugadores en torneos.
 *
 * Las consultas "participantes de un torneo" y "torneos de un jugador"
 * están en TorneoService y JugadorService, porque sus rutas
 * cuelgan de /torneos y de /jugadores.
 */
@Service
public class ParticipacionService {

    private final ParticipacionRepository participacionRepository;
    private final JugadorRepository jugadorRepository;
    private final TorneoRepository torneoRepository;

    public ParticipacionService(ParticipacionRepository participacionRepository,
                                JugadorRepository jugadorRepository,
                                TorneoRepository torneoRepository) {
        this.participacionRepository = participacionRepository;
        this.jugadorRepository = jugadorRepository;
        this.torneoRepository = torneoRepository;
    }

    /**
     * Inscribe un jugador en un torneo.
     * Usado por: POST /participaciones
     *
     * El JSON recibido es:
     *   { "jugador": {"id": 1}, "torneo": {"id": 2}, "puntos": 0, "posicion": null }
     *
     * Pasos:
     *  1. Comprobar que vienen los ids de jugador y torneo   → si no, 400
     *  2. Cargar el jugador y el torneo completos            → si no existen, 404
     *  3. Comprobar que el torneo está ABIERTO               → si no, 409
     *  4. Comprobar que no está ya inscrito                  → si lo está, 409
     *  5. Guardar la participación
     */
    public Participacion inscribir(Participacion participacion) {
        // 1. Ids obligatorios
        if (participacion.getJugador() == null || participacion.getJugador().getId() == null
                || participacion.getTorneo() == null || participacion.getTorneo().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Hay que indicar el jugador y el torneo");
        }
        Long idJugador = participacion.getJugador().getId();
        Long idTorneo = participacion.getTorneo().getId();

        // 2. Cargar las entidades completas
        Jugador jugador = jugadorRepository.findById(idJugador)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el jugador con id " + idJugador));
        Torneo torneo = torneoRepository.findById(idTorneo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el torneo con id " + idTorneo));

        // 3. Solo se puede inscribir en torneos abiertos
        if (torneo.getEstado() != EstadoTorneo.ABIERTO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Solo se puede inscribir en torneos ABIERTOS (este está " + torneo.getEstado() + ")");
        }

        // 4. Sin inscripciones duplicadas
        if (participacionRepository.existsByJugadorIdAndTorneoId(idJugador, idTorneo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El jugador " + jugador.getNick() + " ya está inscrito en este torneo");
        }

        // 5. Montar y guardar la participación
        participacion.setId(null);
        participacion.setJugador(jugador);
        participacion.setTorneo(torneo);
        if (participacion.getPuntos() == null) {
            participacion.setPuntos(0); // si no se envían puntos, empieza en 0
        }
        return participacionRepository.save(participacion);
    }
}