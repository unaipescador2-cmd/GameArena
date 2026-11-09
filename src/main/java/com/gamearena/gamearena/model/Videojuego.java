package com.gamearena.gamearena.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Entidad Videojuego: representa un juego usado en las competiciones
 * (Valorant, League of Legends, Rocket League...).
 *
 * @Entity indica a JPA/Hibernate que esta clase es una tabla
 * de la base de datos. Hibernate crea la tabla "videojuego" automáticamente.
 *
 * Relación: un videojuego puede tener MUCHOS torneos (1:N).
 */
@Entity
public class Videojuego {

    /**
     * Clave primaria.
     * @Id la marca como identificador de la tabla.
     * @GeneratedValue(IDENTITY) hace que la base de datos genere el número
     * sola (1, 2, 3...), por eso al crear un videojuego no se envía el id.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre del videojuego, por ejemplo "Valorant". */
    private String nombre;

    /** Género del videojuego, por ejemplo "Shooter" o "MOBA". */
    private String genero;

    /**
     * Lista de torneos de este videojuego (lado "1" de la relación 1:N).
     *
     * mappedBy = "videojuego": la relación ya está definida en el atributo
     * "videojuego" de la clase Torneo. Este lado NO crea ninguna columna;
     * solo permite navegar desde el videojuego hasta sus torneos.
     *
     * @JsonIgnore: al convertir a JSON se ignora esta lista para evitar
     * la recursión infinita Videojuego → torneos → videojuego → torneos...
     */
    @OneToMany(mappedBy = "videojuego")
    @JsonIgnore
    private List<Torneo> torneos = new ArrayList<>();

    /**
     * Constructor vacío obligatorio para JPA: Hibernate lo usa
     * para crear el objeto cuando lee una fila de la base de datos.
     */
    public Videojuego() {
    }

    // ---------- Getters y setters ----------
    // Los usan Spring (para convertir a/desde JSON) e Hibernate (para leer y
    // escribir los atributos). Get devuelve el valor; set lo cambia.

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public List<Torneo> getTorneos() { return torneos; }
    public void setTorneos(List<Torneo> torneos) { this.torneos = torneos; }
}