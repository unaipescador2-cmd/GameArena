package com.gamearena.gamearena.service;

import com.gamearena.gamearena.model.EstadoTorneo;
import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.model.Torneo;
import com.gamearena.gamearena.model.Videojuego;
import com.gamearena.gamearena.repository.ParticipacionRepository;
import com.gamearena.gamearena.repository.TorneoRepository;
import com.gamearena.gamearena.repository.VideojuegoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service de Torneo: lógica de negocio de los torneos.
 *
 * Incluye:
 *  - CRUD completo (crear, listar, buscar, modificar, eliminar).
 *  - Consultas: por estado, por videojuego y la COMPUESTA
 *    (videojuego + estado).
 *  - Participantes de un torneo.
 *
 * Usa tres repositories:
 *  - TorneoRepository        → la tabla torneo
 *  - VideojuegoRepository    → para asociar el videojuego al torneo
 *  - ParticipacionRepository → para participantes y para impedir borrar
 */
@Service
public class TorneoService {

    private final TorneoRepository torneoRepository;
    private final VideojuegoRepository videojuegoRepository;
    private final ParticipacionRepository participacionRepository;

    public TorneoService(TorneoRepository torneoRepository,
                         VideojuegoRepository videojuegoRepository,
                         ParticipacionRepository participacionRepository) {
        this.torneoRepository = torneoRepository;
        this.videojuegoRepository = videojuegoRepository;
        this.participacionRepository = participacionRepository;
    }

    // ===================== CRUD =====================

    /** Todos los torneos. Usado por: GET /torneos */
    public List<Torneo> listar() {
        return torneoRepository.findAll();
    }

    /** Un torneo por id; si no existe → 404. Usado por: GET /torneos/{id} */
    public Torneo buscarPorId(Long id) {
        return torneoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el torneo con id " + id));
    }

    /**
     * Crea un torneo.
     * Usado por: POST /torneos
     *
     * El JSON trae el videojuego solo con su id:
     *   { ..., "videojuego": { "id": 1 } }
     * Por eso se busca el videojuego COMPLETO en la base de datos
     * y se asocia al torneo. Así también comprobamos que existe.
     */
    public Torneo crear(Torneo torneo) {
        validar(torneo);
        torneo.setVideojuego(obtenerVideojuego(torneo));
        torneo.setId(null);
        return torneoRepository.save(torneo);
    }

    /**
     * Modifica un torneo existente.
     * Usado por: PUT /torneos/{id}
     */
    public Torneo modificar(Long id, Torneo datosNuevos) {
        validar(datosNuevos);
        Torneo torneo = buscarPorId(id);          // 404 si no existe
        torneo.setNombre(datosNuevos.getNombre());
        torneo.setFecha(datosNuevos.getFecha());
        torneo.setPremio(datosNuevos.getPremio());
        torneo.setEstado(datosNuevos.getEstado());
        torneo.setVideojuego(obtenerVideojuego(datosNuevos));
        return torneoRepository.save(torneo);     // UPDATE
    }

    /**
     * Elimina un torneo.
     * Usado por: DELETE /torneos/{id}
     *
     * Regla del caso de uso: un torneo con participaciones
     * NO se puede eliminar → 409 Conflict.
     */
    public void eliminar(Long id) {
        buscarPorId(id);
        if (participacionRepository.existsByTorneoId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar el torneo " + id + " porque tiene participaciones");
        }
        torneoRepository.deleteById(id);
    }

    // ===================== CONSULTAS =====================

    /**
     * Torneos con un estado concreto.
     * Usado por: GET /torneos/estado/{estado}
     * Llama a la consulta derivada findByEstado.
     */
    public List<Torneo> porEstado(EstadoTorneo estado) {
        return torneoRepository.findByEstado(estado);
    }

    /**
     * Torneos de un videojuego.
     * Usado por: GET /torneos/videojuego/{id}
     * Si el videojuego no existe → 404 (en vez de una lista vacía).
     */
    public List<Torneo> porVideojuego(Long videojuegoId) {
        comprobarVideojuegoExiste(videojuegoId);
        return torneoRepository.findByVideojuegoId(videojuegoId);
    }

    /**
     * CONSULTA COMPUESTA: torneos de un videojuego en un estado.
     * Usado por: GET /torneos/videojuego/{id}/estado/{estado}
     * Ejemplo: ¿qué torneos de Valorant están ABIERTOS?
     * Llama a findByVideojuegoIdAndEstado.
     */
    public List<Torneo> porVideojuegoYEstado(Long videojuegoId, EstadoTorneo estado) {
        comprobarVideojuegoExiste(videojuegoId);
        return torneoRepository.findByVideojuegoIdAndEstado(videojuegoId, estado);
    }

    /**
     * Participantes (participaciones) de un torneo.
     * Usado por: GET /torneos/{id}/participantes
     */
    public List<Participacion> participantes(Long id) {
        buscarPorId(id);
        return participacionRepository.findByTorneoId(id);
    }

    // ===================== MÉTODOS PRIVADOS DE AYUDA =====================

    /** Comprobaciones comunes de crear y modificar. */
    private void validar(Torneo torneo) {
        if (torneo.getNombre() == null || torneo.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del torneo es obligatorio");
        }
        if (torneo.getFecha() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha del torneo es obligatoria");
        }
        if (torneo.getPremio() == null || torneo.getPremio() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El premio debe ser 0 o mayor");
        }
        if (torneo.getEstado() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El estado es obligatorio (ABIERTO, EN_CURSO o FINALIZADO)");
        }
    }

    /**
     * Saca el id del videojuego que viene en el JSON y devuelve el
     * videojuego completo desde la base de datos.
     * Regla: todo torneo lleva videojuego → si falta o no existe, 400.
     */
    private Videojuego obtenerVideojuego(Torneo torneo) {
        if (torneo.getVideojuego() == null || torneo.getVideojuego().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El torneo debe tener un videojuego");
        }
        Long idVideojuego = torneo.getVideojuego().getId();
        return videojuegoRepository.findById(idVideojuego)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "No existe el videojuego con id " + idVideojuego));
    }

    /** Lanza 404 si el videojuego no existe. */
    private void comprobarVideojuegoExiste(Long videojuegoId) {
        if (!videojuegoRepository.existsById(videojuegoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No existe el videojuego con id " + videojuegoId);
        }
    }
}