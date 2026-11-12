package com.gamearena.gamearena.repository;

import com.gamearena.gamearena.model.Jugador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository de Jugador: acceso a la tabla "jugador".
 *
 * El CRUD completo (crear, listar, buscar por ID, modificar y eliminar)
 * se resuelve con los métodos heredados de JpaRepository:
 *   crear / modificar → save()
 *   listar            → findAll()
 *   buscar por ID     → findById()
 *   eliminar          → deleteById()
 */
@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {
}
