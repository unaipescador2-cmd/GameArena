package com.gamearena.gamearena.model;

import jakarta.persistence.*;

/**
 * Entidad Participacion: representa la inscripción de UN jugador en UN torneo.
 *
 * Es la entidad intermedia que resuelve la relación N:M entre Jugador y Torneo
 * (un jugador juega muchos torneos y un torneo tiene muchos jugadores).
 *
 * Se usa una entidad propia en lugar de @ManyToMany porque la relación
 * tiene datos propios: los puntos y la posición del jugador en ese torneo.
 *
 *   JUGADOR 1 ──── N PARTICIPACION N ──── 1 TORNEO
 */
@Entity
public class Participacion {

    /** Clave primaria autogenerada por la base de datos. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Jugador que participa.
     * @ManyToOne: un jugador puede tener muchas participaciones.
     * @JoinColumn: crea la columna jugador_id (clave foránea a jugador.id).
     */
    @ManyToOne
    @JoinColumn(name = "jugador_id")
    private Jugador jugador;

    /**
     * Torneo en el que participa.
     * @ManyToOne: un torneo puede tener muchas participaciones.
     * @JoinColumn: crea la columna torneo_id (clave foránea a torneo.id).
     */
    @ManyToOne
    @JoinColumn(name = "torneo_id")
    private Torneo torneo;

    /** Puntos conseguidos por el jugador en este torneo. */
    private Integer puntos;

    /**
     * Posición final del jugador (1 = ganador).
     * Puede quedar vacía (null) mientras el torneo no ha terminado.
     */
    private Integer posicion;

    /** Constructor vacío obligatorio para JPA. */
    public Participacion() {
    }

    // ---------- Getters y setters ----------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Jugador getJugador() { return jugador; }
    public void setJugador(Jugador jugador) { this.jugador = jugador; }

    public Torneo getTorneo() { return torneo; }
    public void setTorneo(Torneo torneo) { this.torneo = torneo; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }

    public Integer getPosicion() { return posicion; }
    public void setPosicion(Integer posicion) { this.posicion = posicion; }
}