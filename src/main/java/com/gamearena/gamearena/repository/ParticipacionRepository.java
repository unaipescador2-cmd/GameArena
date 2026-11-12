package com.gamearena.gamearena.repository;

import com.gamearena.gamearena.model.Participacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository de Participacion: acceso a la tabla "participacion".
 *
 * Como Participacion une Jugador y Torneo, las consultas de relaciones
 * ("torneos de un jugador" y "participantes de un torneo") se hacen aquí,
 * buscando por la clave foránea correspondiente.
 */
@Repository
public interface ParticipacionRepository extends JpaRepository<Participacion, Long> {

    /**
     * Participaciones de un jugador (los torneos en los que ha jugado).
     * Endpoint: GET /jugadores/1/participaciones
     *
     * SQL generado (aprox.):
     *   SELECT * FROM participacion WHERE jugador_id = 1
     */
    List<Participacion> findByJugadorId(Long jugadorId);

    /**
     * Participantes de un torneo (los jugadores inscritos).
     * Endpoint: GET /torneos/1/participantes
     *
     * SQL generado (aprox.):
     *   SELECT * FROM participacion WHERE torneo_id = 1
     */
    List<Participacion> findByTorneoId(Long torneoId);

    /**
     * ¿Tiene este jugador alguna participación?
     * Se usa antes de eliminar un jugador: si devuelve true, no se borra
     * (regla del caso de uso) y el servidor responde 409.
     *
     * existsBy... devuelve true/false en vez de una lista.
     */
    boolean existsByJugadorId(Long jugadorId);

    /**
     * ¿Tiene este torneo alguna participación?
     * Se usa antes de eliminar un torneo, igual que el anterior.
     */
    boolean existsByTorneoId(Long torneoId);

    /**
     * ¿Está ya inscrito este jugador en este torneo?
     * Evita inscribir dos veces al mismo jugador en el mismo torneo.
     *
     * SQL generado (aprox.):
     *   SELECT COUNT(*) > 0 FROM participacion
     *   WHERE jugador_id = ? AND torneo_id = ?
     */
    boolean existsByJugadorIdAndTorneoId(Long jugadorId, Long torneoId);
}
