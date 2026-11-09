package com.gamearena.gamearena.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entidad Jugador: representa a una persona que participa en los torneos.
 *
 * Se guarda en la tabla "jugador".
 * Relación: un jugador puede tener MUCHAS participaciones (1:N).
 * A través de Participacion, un jugador puede estar en varios torneos.
 */
@Entity
public class Jugador {

    /** Clave primaria autogenerada por la base de datos. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Apodo del jugador dentro de los torneos, por ejemplo "LuMa". */
    private String nick;

    /** Correo electrónico de contacto. */
    private String email;

    /** Nivel de habilidad del jugador (por ejemplo, del 1 al 10). */
    private Integer nivel;

    /**
     * Participaciones de este jugador en distintos torneos
     * (lado "1" de la relación 1:N con Participacion).
     *
     * mappedBy = "jugador": la clave foránea la gestiona el atributo
     * "jugador" de la clase Participacion. Aquí no se crea columna.
     *
     * @JsonIgnore: evita la recursión
     * Jugador → participaciones → jugador → participaciones...
     */
    @OneToMany(mappedBy = "jugador")
    @JsonIgnore
    private List<Participacion> participaciones = new ArrayList<>();

    /** Constructor vacío obligatorio para JPA. */
    public Jugador() {
    }

    // ---------- Getters y setters ----------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNick() { return nick; }
    public void setNick(String nick) { this.nick = nick; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getNivel() { return nivel; }
    public void setNivel(Integer nivel) { this.nivel = nivel; }

    public List<Participacion> getParticipaciones() { return participaciones; }
    public void setParticipaciones(List<Participacion> participaciones) { this.participaciones = participaciones; }
}