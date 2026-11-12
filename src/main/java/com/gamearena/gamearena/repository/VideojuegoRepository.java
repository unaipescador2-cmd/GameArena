package com.gamearena.gamearena.repository;

import com.gamearena.gamearena.model.Videojuego;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository de Videojuego: acceso a la tabla "videojuego".
 *
 * Al heredar de JpaRepository<Videojuego, Long> ya tenemos, sin escribir nada:
 *   save(v)         → INSERT si es nuevo, UPDATE si ya existe
 *   findAll()       → SELECT * FROM videojuego
 *   findById(id)    → SELECT ... WHERE id = ?   (devuelve un Optional)
 *   existsById(id)  → comprueba si existe
 *   deleteById(id)  → DELETE ... WHERE id = ?
 *   count()         → cuántos hay
 *
 * Los dos tipos genéricos significan:
 *   Videojuego → la entidad que gestiona
 *   Long       → el tipo de su clave primaria (el atributo id)
 *
 * El enunciado solo pide crear, listar y buscar videojuegos,
 * así que no hace falta añadir ningún método más.
 */
@Repository
public interface VideojuegoRepository extends JpaRepository<Videojuego, Long> {
}