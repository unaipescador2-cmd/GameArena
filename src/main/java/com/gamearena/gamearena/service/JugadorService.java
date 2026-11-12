package com.gamearena.gamearena.service;

import com.gamearena.gamearena.model.Jugador;
import com.gamearena.gamearena.model.Participacion;
import com.gamearena.gamearena.repository.JugadorRepository;
import com.gamearena.gamearena.repository.ParticipacionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service de Jugador: lógica de negocio de los jugadores.
 *
 * Permite el CRUD completo (crear, listar, buscar, modificar, eliminar)
 * y consultar los torneos en los que ha participado un jugador.
 *
 * Usa DOS repositories: el de jugadores y el de participaciones,
 * porque para eliminar y para ver sus torneos necesita consultar
 * la tabla participacion.
 */
@Service
public class JugadorService {

    private final JugadorRepository jugadorRepository;
    private final ParticipacionRepository participacionRepository;

    /** Spring inyecta los dos repositories por el constructor. */
    public JugadorService(JugadorRepository jugadorRepository,
                          ParticipacionRepository participacionRepository) {
        this.jugadorRepository = jugadorRepository;
        this.participacionRepository = participacionRepository;
    }

    /**
     * Devuelve todos los jugadores.
     * Usado por: GET /jugadores
     */
    public List<Jugador> listar() {
        return jugadorRepository.findAll();
    }

    /**
     * Busca un jugador por id. Si no existe → 404.
     * Usado por: GET /jugadores/{id}
     * Y también por los demás métodos para comprobar que existe.
     */
    public Jugador buscarPorId(Long id) {
        return jugadorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el jugador con id " + id));
    }

    /**
     * Crea un jugador nuevo.
     * Usado por: POST /jugadores
     */
    public Jugador crear(Jugador jugador) {
        validar(jugador);
        jugador.setId(null); // siempre alta: el id lo genera la base de datos
        return jugadorRepository.save(jugador);
    }

    /**
     * Modifica un jugador existente.
     * Usado por: PUT /jugadores/{id}
     *
     * 1. Busca el jugador guardado (si no existe → 404).
     * 2. Copia los datos nuevos encima.
     * 3. save() hace UPDATE porque el objeto ya tiene id.
     */
    public Jugador modificar(Long id, Jugador datosNuevos) {
        validar(datosNuevos);
        Jugador jugador = buscarPorId(id);
        jugador.setNick(datosNuevos.getNick());
        jugador.setEmail(datosNuevos.getEmail());
        jugador.setNivel(datosNuevos.getNivel());
        return jugadorRepository.save(jugador);
    }

    /**
     * Elimina un jugador.
     * Usado por: DELETE /jugadores/{id}
     *
     * Regla del caso de uso: un jugador con participaciones
     * NO se puede eliminar → 409 Conflict.
     */
    public void eliminar(Long id) {
        buscarPorId(id); // 404 si no existe
        if (participacionRepository.existsByJugadorId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede eliminar el jugador " + id + " porque tiene participaciones");
        }
        jugadorRepository.deleteById(id);
    }

    /**
     * Devuelve las participaciones (torneos) de un jugador.
     * Usado por: GET /jugadores/{id}/participaciones
     *
     * Primero comprueba que el jugador existe, para responder 404
     * en vez de una lista vacía si el id es incorrecto.
     */
    public List<Participacion> participaciones(Long id) {
        buscarPorId(id);
        return participacionRepository.findByJugadorId(id);
    }

    /**
     * Comprobaciones comunes de crear y modificar.
     * Es privado: solo se usa dentro de esta clase.
     */
    private void validar(Jugador jugador) {
        if (jugador.getNick() == null || jugador.getNick().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nick es obligatorio");
        }
        if (jugador.getEmail() == null || !jugador.getEmail().contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email no es válido");
        }
        if (jugador.getNivel() == null || jugador.getNivel() < 1 || jugador.getNivel() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nivel debe estar entre 1 y 10");
        }
    }
}