package com.gamearena.gamearena.repository;

import com.gamearena.gamearena.model.EstadoTorneo;
import com.gamearena.gamearena.model.Torneo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository de Torneo: acceso a la tabla "torneo".
 *
 * Además del CRUD heredado, aquí están las CONSULTAS DERIVADAS:
 * métodos que Spring Data JPA convierte en SQL leyendo su nombre.
 * No se escribe ninguna implementación ni ningún SQL.
 */
@Repository
public interface TorneoRepository extends JpaRepository<Torneo, Long> {

    /**
     * Torneos que tienen un estado concreto.
     * Endpoint: GET /torneos/estado/ABIERTO
     *
     * findBy + Estado  →  WHERE estado = ?
     * "Estado" es el nombre del atributo "estado" de Torneo.
     *
     * SQL generado (aprox.):
     *   SELECT * FROM torneo WHERE estado = 'ABIERTO'
     */
    List<Torneo> findByEstado(EstadoTorneo estado);

    /**
     * Torneos de un videojuego.
     * Endpoint: GET /torneos/videojuego/1
     *
     * findBy + Videojuego + Id  →  entra en el atributo "videojuego"
     * de Torneo y, dentro de él, usa su "id".
     * Es decir, navega por la relación @ManyToOne.
     *
     * SQL generado (aprox.):
     *   SELECT * FROM torneo WHERE videojuego_id = 1
     */
    List<Torneo> findByVideojuegoId(Long videojuegoId);

    /**
     * CONSULTA COMPUESTA OBLIGATORIA:
     * ¿Qué torneos de un videojuego están en un estado concreto?
     * Endpoint: GET /torneos/videojuego/1/estado/ABIERTO
     *
     * findBy + VideojuegoId + And + Estado
     *   → WHERE videojuego_id = ? AND estado = ?
     *
     * Los parámetros van en el MISMO ORDEN que aparecen en el nombre:
     * primero el id del videojuego, después el estado.
     *
     * SQL generado (aprox.):
     *   SELECT * FROM torneo WHERE videojuego_id = 1 AND estado = 'ABIERTO'
     */
    List<Torneo> findByVideojuegoIdAndEstado(Long videojuegoId, EstadoTorneo estado);
}