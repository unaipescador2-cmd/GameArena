package com.gamearena.gamearena.service;

import com.gamearena.gamearena.model.Videojuego;
import com.gamearena.gamearena.repository.VideojuegoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service de Videojuego: lógica de negocio de los videojuegos.
 *
 * Capa intermedia entre el Controller (recibe la petición HTTP)
 * y el Repository (habla con la base de datos).
 *
 * Según el caso de uso, los videojuegos solo se pueden
 * CREAR, LISTAR y BUSCAR. No hay modificar ni eliminar.
 *
 * @Service marca la clase como componente de la capa de servicio.
 * Spring crea un único objeto de esta clase y lo inyecta donde se necesite.
 */
@Service
public class VideojuegoService {

    /** Repository para acceder a la tabla videojuego. */
    private final VideojuegoRepository videojuegoRepository;

    /**
     * Inyección de dependencias por constructor:
     * Spring ve que el constructor necesita un VideojuegoRepository
     * y le pasa automáticamente el que ha creado al arrancar.
     * No hace falta escribir "new" ni @Autowired.
     */
    public VideojuegoService(VideojuegoRepository videojuegoRepository) {
        this.videojuegoRepository = videojuegoRepository;
    }

    /**
     * Devuelve todos los videojuegos.
     * Usado por: GET /videojuegos
     */
    public List<Videojuego> listar() {
        return videojuegoRepository.findAll();
    }

    /**
     * Busca un videojuego por su id.
     * Usado por: GET /videojuegos/{id}
     *
     * findById devuelve un Optional (puede estar vacío).
     * orElseThrow: si está vacío, lanza el error 404.
     */
    public Videojuego buscarPorId(Long id) {
        return videojuegoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No existe el videojuego con id " + id));
    }

    /**
     * Crea un videojuego nuevo.
     * Usado por: POST /videojuegos
     *
     * Valida que el nombre no venga vacío y pone el id a null
     * para que siempre sea un ALTA (el id lo genera la base de datos).
     */
    public Videojuego crear(Videojuego videojuego) {
        if (videojuego.getNombre() == null || videojuego.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del videojuego es obligatorio");
        }
        videojuego.setId(null);
        return videojuegoRepository.save(videojuego);
    }
}