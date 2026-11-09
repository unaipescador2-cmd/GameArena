package com.gamearena.gamearena.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad Torneo: representa una competición de un videojuego.
 *
 * Se guarda en la tabla "torneo".
 * Relaciones:
 *  - MUCHOS torneos pertenecen a UN videojuego (N:1).
 *  - UN torneo tiene MUCHAS participaciones (1:N).
 */
@Entity
public class Torneo {

    /** Clave primaria autogenerada por la base de datos. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre del torneo, por ejemplo "Copa Valdemora". */
    private String nombre;

    /**
     * Fecha del torneo. LocalDate guarda solo el día (sin hora).
     * En JSON se envía con el formato "2026-11-20".
     */
    private LocalDate fecha;

    /** Premio en euros para el ganador. */
    private Double premio;

    /**
     * Estado del torneo: ABIERTO, EN_CURSO o FINALIZADO.
     *
     * @Enumerated(EnumType.STRING) guarda el texto ("ABIERTO") en la tabla.
     * Sin esta anotación se guardaría la posición (0, 1, 2) y, si algún día
     * se cambia el orden del enum, los datos guardados quedarían mal.
     */
    @Enumerated(EnumType.STRING)
    private EstadoTorneo estado;

    /**
     * Videojuego al que pertenece el torneo (lado "N" de la relación).
     *
     * @ManyToOne: muchos torneos pueden ser del mismo videojuego.
     * @JoinColumn(name = "videojuego_id"): crea en la tabla "torneo" una
     * columna llamada videojuego_id que es CLAVE FORÁNEA hacia videojuego.id.
     *
     * Este es el LADO PROPIETARIO de la relación: el que la guarda
     * realmente en la base de datos.
     *
     * No lleva @JsonIgnore: al pedir un torneo SÍ queremos ver su videojuego.
     */
    @ManyToOne
    @JoinColumn(name = "videojuego_id")
    private Videojuego videojuego;

    /**
     * Participaciones (jugadores inscritos) de este torneo.
     * mappedBy = "torneo": la relación la gestiona Participacion.torneo.
     * @JsonIgnore: evita la recursión Torneo → participaciones → torneo...
     */
    @OneToMany(mappedBy = "torneo")
    @JsonIgnore
    private List<Participacion> participaciones = new ArrayList<>();

    /** Constructor vacío obligatorio para JPA. */
    public Torneo() {
    }

    // ---------- Getters y setters ----------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public Double getPremio() { return premio; }
    public void setPremio(Double premio) { this.premio = premio; }

    public EstadoTorneo getEstado() { return estado; }
    public void setEstado(EstadoTorneo estado) { this.estado = estado; }

    public Videojuego getVideojuego() { return videojuego; }
    public void setVideojuego(Videojuego videojuego) { this.videojuego = videojuego; }

    public List<Participacion> getParticipaciones() { return participaciones; }
    public void setParticipaciones(List<Participacion> participaciones) { this.participaciones = participaciones; }
}