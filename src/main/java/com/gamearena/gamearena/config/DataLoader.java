package com.gamearena.gamearena.config;

import com.gamearena.gamearena.model.*;
import com.gamearena.gamearena.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Carga los datos iniciales de GameArena en la base de datos H2.
 *
 * @Component        -> Spring crea esta clase automáticamente al arrancar.
 * CommandLineRunner -> obliga a tener el método run(), que Spring ejecuta
 *                      justo después de arrancar la aplicación.
 *
 * Solo inserta datos si la base de datos está vacía. Como H2 está en modo
 * fichero, los datos se guardan y la próxima vez que arranques NO se duplican.
 */
@Component
public class DataLoader implements CommandLineRunner {

    private final VideojuegoRepository videojuegoRepository;
    private final JugadorRepository jugadorRepository;
    private final TorneoRepository torneoRepository;
    private final ParticipacionRepository participacionRepository;

    /**
     * Constructor: Spring inyecta los cuatro repositories.
     */
    public DataLoader(VideojuegoRepository videojuegoRepository,
                      JugadorRepository jugadorRepository,
                      TorneoRepository torneoRepository,
                      ParticipacionRepository participacionRepository) {
        this.videojuegoRepository = videojuegoRepository;
        this.jugadorRepository = jugadorRepository;
        this.torneoRepository = torneoRepository;
        this.participacionRepository = participacionRepository;
    }

    /**
     * Se ejecuta automáticamente al arrancar.
     * Si ya hay videojuegos guardados, no hace nada (evita duplicados).
     *
     * @param args argumentos de arranque (no se usan)
     */
    @Override
    public void run(String... args) {
        if (videojuegoRepository.count() > 0) {
            System.out.println(">> La base de datos ya tiene datos, no se cargan los iniciales.");
            return;
        }

        // ---------- VIDEOJUEGOS (5) ----------
        Videojuego valorant = crearVideojuego("Valorant", "Shooter táctico");
        Videojuego lol      = crearVideojuego("League of Legends", "MOBA");
        Videojuego rocket   = crearVideojuego("Rocket League", "Deportes");
        Videojuego fortnite = crearVideojuego("Fortnite", "Battle royale");
        Videojuego fc       = crearVideojuego("EA Sports FC", "Fútbol");

        // ---------- JUGADORES (6) ----------
        Jugador nova  = crearJugador("Nova",  "nova@gamearena.es",  8);
        Jugador kira  = crearJugador("Kira",  "kira@gamearena.es",  9);
        Jugador zero  = crearJugador("Zero",  "zero@gamearena.es",  6);
        Jugador luna  = crearJugador("Luna",  "luna@gamearena.es",  7);
        Jugador ghost = crearJugador("Ghost", "ghost@gamearena.es", 5);
        crearJugador("Pixel", "pixel@gamearena.es", 3); // sin participaciones: se puede borrar

        // ---------- TORNEOS (6, con los tres estados) ----------
        Torneo openSeries = crearTorneo("Valorant Open Series", LocalDate.of(2026, 11, 20),
                500.0, EstadoTorneo.ABIERTO, valorant);
        crearTorneo("Valorant Champions Cup", LocalDate.of(2026, 12, 12),
                1000.0, EstadoTorneo.ABIERTO, valorant); // 2.º ABIERTO de Valorant (consulta compuesta)
        Torneo grieta = crearTorneo("La Grieta: Autumn Cup", LocalDate.of(2026, 11, 9),
                800.0, EstadoTorneo.EN_CURSO, lol);
        Torneo kickoff = crearTorneo("Rocket League Kickoff", LocalDate.of(2026, 10, 18),
                300.0, EstadoTorneo.FINALIZADO, rocket);
        Torneo campus = crearTorneo("FC Campus League", LocalDate.of(2026, 11, 7),
                250.0, EstadoTorneo.FINALIZADO, fc);
        crearTorneo("Fortnite: Último Círculo", LocalDate.of(2026, 12, 20),
                400.0, EstadoTorneo.ABIERTO, fortnite); // sin participaciones: se puede borrar

        // ---------- PARTICIPACIONES (10) ----------
        // Torneo abierto: inscritos, aún sin puntos ni posición
        crearParticipacion(nova, openSeries, 0, null);
        crearParticipacion(kira, openSeries, 0, null);
        // Torneo en curso: llevan puntos, todavía sin posición final
        crearParticipacion(nova, grieta, 40, null);
        crearParticipacion(zero, grieta, 35, null);
        crearParticipacion(luna, grieta, 50, null);
        // Torneos finalizados: con puntos y posición
        crearParticipacion(kira,  kickoff, 120, 1);
        crearParticipacion(zero,  kickoff, 90,  2);
        crearParticipacion(ghost, kickoff, 60,  3);
        crearParticipacion(luna,  campus,  75,  1);
        crearParticipacion(ghost, campus,  50,  2);

        System.out.println(">> Datos iniciales cargados: 5 videojuegos, 6 jugadores, 6 torneos y 10 participaciones.");
    }

    /* ============ Métodos de ayuda: crean el objeto y lo guardan ============ */

    /** Crea y guarda un videojuego. save() devuelve el objeto ya con su id. */
    private Videojuego crearVideojuego(String nombre, String genero) {
        Videojuego v = new Videojuego();
        v.setNombre(nombre);
        v.setGenero(genero);
        return videojuegoRepository.save(v);
    }

    /** Crea y guarda un jugador. */
    private Jugador crearJugador(String nick, String email, Integer nivel) {
        Jugador j = new Jugador();
        j.setNick(nick);
        j.setEmail(email);
        j.setNivel(nivel);
        return jugadorRepository.save(j);
    }

    /** Crea y guarda un torneo unido a su videojuego (relación ManyToOne). */
    private Torneo crearTorneo(String nombre, LocalDate fecha, Double premio,
                               EstadoTorneo estado, Videojuego videojuego) {
        Torneo t = new Torneo();
        t.setNombre(nombre);
        t.setFecha(fecha);
        t.setPremio(premio);
        t.setEstado(estado);
        t.setVideojuego(videojuego);
        return torneoRepository.save(t);
    }

    /** Crea y guarda una participación (une un jugador con un torneo). */
    private void crearParticipacion(Jugador jugador, Torneo torneo,
                                    Integer puntos, Integer posicion) {
        Participacion p = new Participacion();
        p.setJugador(jugador);
        p.setTorneo(torneo);
        p.setPuntos(puntos);
        p.setPosicion(posicion);
        participacionRepository.save(p);
    }
}