const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');

// POST /api/stats/visita - Registrar visita
router.post('/visita', async (req, res) => {
  try {
    const diaSemana = new Date().getDay();
    await query(
      `INSERT INTO estadisticas_eventos (tipo, dia_semana) VALUES ('visita', $1)`,
      [diaSemana]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/stats/visita:', err);
    res.status(500).json({ error: 'Error al registrar visita' });
  }
});

// POST /api/stats/libro-abierto - Registrar lectura de libro
router.post('/libro-abierto', async (req, res) => {
  try {
    const { libroId, usuarioEmail, anio } = req.body;
    const diaSemana = new Date().getDay();
    await query(
      `INSERT INTO estadisticas_eventos (tipo, referencia_id, usuario_email, dia_semana, anio_cursada)
       VALUES ('libro_abierto', $1, $2, $3, $4)`,
      [libroId ? parseInt(libroId, 10) : null, usuarioEmail || null, diaSemana, anio || 'Otro']
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/stats/libro-abierto:', err);
    res.status(500).json({ error: 'Error al registrar lectura de libro' });
  }
});

// Helper para calcular rango de fechas
function getDateFilter(periodo, desde, hasta) {
  const ahora = new Date();
  let dateDesde = null;
  let dateHasta = ahora;

  if (periodo === '24h') {
    dateDesde = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  } else if (periodo === 'semana') {
    dateDesde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (periodo === 'mes') {
    dateDesde = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (periodo === 'anio') {
    dateDesde = new Date(ahora.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else if (periodo === 'custom' && desde) {
    dateDesde = new Date(desde);
    dateHasta = hasta ? new Date(hasta + 'T23:59:59') : ahora;
  }

  return { dateDesde, dateHasta };
}

// GET /api/stats - Obtener métricas y estadísticas
router.get('/', async (req, res) => {
  try {
    const { periodo = 'todo', desde, hasta } = req.query;
    const { dateDesde, dateHasta } = getDateFilter(periodo, desde, hasta);

    let filterSql = '';
    const params = [];
    if (dateDesde) {
      params.push(dateDesde.toISOString());
      params.push(dateHasta.toISOString());
      filterSql = ` AND fecha >= $1 AND fecha <= $2`;
    }

    // 1. Conteo total de libros
    const { rows: rLibros } = await query(`SELECT COUNT(*) AS total FROM libros;`);
    const totalLibros = parseInt(rLibros[0].total, 10);

    // 2. Conteo de usuarios
    const { rows: rUsuarios } = await query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN estado = 'activo' THEN 1 END) AS activos,
        COUNT(CASE WHEN estado = 'restringido' THEN 1 END) AS restringidos,
        COUNT(CASE WHEN rol = 'admin' THEN 1 END) AS admins,
        COUNT(CASE WHEN rol = 'preceptor' THEN 1 END) AS preceptores,
        COUNT(CASE WHEN rol = 'profesor' THEN 1 END) AS profesores,
        COUNT(CASE WHEN rol = 'alumno' THEN 1 END) AS alumnos
      FROM usuarios;
    `);

    // 3. Conteo de visitas en el período
    const { rows: rVisitas } = await query(
      `SELECT COUNT(*) AS total FROM estadisticas_eventos WHERE tipo = 'visita' ${filterSql};`,
      params
    );

    // 4. Conteo de libros abiertos en el período
    const { rows: rAbiertos } = await query(
      `SELECT COUNT(*) AS total FROM estadisticas_eventos WHERE tipo = 'libro_abierto' ${filterSql};`,
      params
    );

    // 5. Sesiones hoy
    const { rows: rHoy } = await query(`
      SELECT COUNT(*) AS total 
      FROM estadisticas_eventos 
      WHERE tipo = 'ingreso' AND fecha::date = CURRENT_DATE;
    `);

    // 6. Conteo de descargas guardadas totales
    const { rows: rDesc } = await query(`SELECT COUNT(*) AS total FROM descargas;`);

    // 7. Ingresos por día de la semana
    const { rows: rDias } = await query(
      `SELECT dia_semana, COUNT(*) AS cantidad 
       FROM estadisticas_eventos 
       WHERE tipo = 'ingreso' ${filterSql}
       GROUP BY dia_semana;`,
      params
    );
    const ingresosPorDia = [0, 0, 0, 0, 0, 0, 0];
    rDias.forEach(r => {
      if (r.dia_semana !== null && r.dia_semana >= 0 && r.dia_semana < 7) {
        ingresosPorDia[r.dia_semana] = parseInt(r.cantidad, 10);
      }
    });

    // 8. Actividad por año de cursada
    const { rows: rAnios } = await query(
      `SELECT COALESCE(anio_cursada, 'Otro') AS anio, COUNT(*) AS cantidad
       FROM estadisticas_eventos 
       WHERE tipo = 'ingreso' ${filterSql}
       GROUP BY anio_cursada;`,
      params
    );
    const ingresosPorAnio = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "Otro": 0 };
    rAnios.forEach(r => {
      ingresosPorAnio[r.anio] = parseInt(r.cantidad, 10);
    });

    // 9. Top 10 libros más abiertos
    const { rows: rTop } = await query(
      `SELECT e.referencia_id AS id, l.titulo, l.autor, l.materia, COUNT(*) AS veces
       FROM estadisticas_eventos e
       JOIN libros l ON e.referencia_id = l.id
       WHERE e.tipo = 'libro_abierto' ${filterSql}
       GROUP BY e.referencia_id, l.titulo, l.autor, l.materia
       ORDER BY veces DESC
       LIMIT 10;`,
      params
    );

    // 10. Últimos 10 ingresos
    const { rows: rUltimos } = await query(`
      SELECT usuario_nombre AS nombre, usuario_email AS email, usuario_rol AS rol, fecha
      FROM estadisticas_eventos
      WHERE tipo = 'ingreso'
      ORDER BY fecha DESC
      LIMIT 10;
    `);

    const ultimosIngresos = rUltimos.map(r => ({
      nombre: r.nombre || r.email,
      email: r.email,
      rol: r.rol || 'alumno',
      fecha: new Date(r.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
             ' ' + new Date(r.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }));

    res.json({
      resumen: {
        totalLibros,
        usuarios: rUsuarios[0],
        visitas: parseInt(rVisitas[0].total, 10),
        librosAbiertos: parseInt(rAbiertos[0].total, 10),
        sesionesHoy: parseInt(rHoy[0].total, 10),
        descargasTotales: parseInt(rDesc[0].total, 10)
      },
      ingresosPorDia,
      ingresosPorAnio,
      topLibros: rTop,
      ultimosIngresos
    });
  } catch (err) {
    console.error('Error en GET /api/stats:', err);
    res.status(500).json({ error: 'Error al calcular estadísticas' });
  }
});

// GET /api/stats/reporte-texto - Descargar archivo de reporte .txt
router.get('/reporte-texto', async (req, res) => {
  try {
    const { periodo = 'todo', desde, hasta } = req.query;
    const { dateDesde, dateHasta } = getDateFilter(periodo, desde, hasta);

    let filterSql = '';
    const params = [];
    if (dateDesde) {
      params.push(dateDesde.toISOString());
      params.push(dateHasta.toISOString());
      filterSql = ` AND fecha >= $1 AND fecha <= $2`;
    }

    const { rows: rLibros } = await query(`SELECT COUNT(*) AS total FROM libros;`);
    const { rows: rUsuarios } = await query(`SELECT * FROM usuarios ORDER BY id ASC;`);
    const { rows: rVisitas } = await query(`SELECT COUNT(*) AS total FROM estadisticas_eventos WHERE tipo = 'visita' ${filterSql};`, params);
    const { rows: rAbiertos } = await query(`SELECT COUNT(*) AS total FROM estadisticas_eventos WHERE tipo = 'libro_abierto' ${filterSql};`, params);
    const { rows: rHoy } = await query(`SELECT COUNT(*) AS total FROM estadisticas_eventos WHERE tipo = 'ingreso' AND fecha::date = CURRENT_DATE;`);
    const { rows: rDesc } = await query(`SELECT COUNT(*) AS total FROM descargas;`);

    const { rows: rDias } = await query(
      `SELECT dia_semana, COUNT(*) AS cantidad FROM estadisticas_eventos WHERE tipo = 'ingreso' ${filterSql} GROUP BY dia_semana;`,
      params
    );
    const ingDia = [0, 0, 0, 0, 0, 0, 0];
    rDias.forEach(r => { if (r.dia_semana >= 0 && r.dia_semana < 7) ingDia[r.dia_semana] = parseInt(r.cantidad, 10); });

    const { rows: rAnios } = await query(
      `SELECT COALESCE(anio_cursada, 'Otro') AS anio, COUNT(*) AS cantidad FROM estadisticas_eventos WHERE tipo = 'ingreso' ${filterSql} GROUP BY anio_cursada;`,
      params
    );
    const ingAnio = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "Otro": 0 };
    rAnios.forEach(r => { ingAnio[r.anio] = parseInt(r.cantidad, 10); });

    const { rows: rTop } = await query(
      `SELECT l.titulo, l.autor, COUNT(*) AS veces
       FROM estadisticas_eventos e
       JOIN libros l ON e.referencia_id = l.id
       WHERE e.tipo = 'libro_abierto' ${filterSql}
       GROUP BY l.titulo, l.autor
       ORDER BY veces DESC
       LIMIT 10;`,
      params
    );

    const { rows: rUlt } = await query(
      `SELECT usuario_nombre, usuario_email, usuario_rol, fecha
       FROM estadisticas_eventos
       WHERE tipo = 'ingreso'
       ORDER BY fecha DESC
       LIMIT 10;`
    );

    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const horaStr = ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    let topStr = "";
    rTop.forEach((t, i) => {
      topStr += `  ${i + 1}. ${t.titulo} (${t.autor}) - ${t.veces} veces\n`;
    });

    let ultStr = "";
    rUlt.forEach(u => {
      const f = new Date(u.fecha).toLocaleDateString("es-AR") + " " + new Date(u.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      ultStr += `  - ${u.usuario_nombre || u.usuario_email} (${u.usuario_rol || 'alumno'}) — ${f}\n`;
    });

    let reporte =
"╔══════════════════════════════════════════════════════════════╗\n" +
"║         REPORTE DE ESTADÍSTICAS — DigiTeca                  ║\n" +
"║   Escuela Técnica N° 29 DE 6 — Reconquista de Buenos Aires  ║\n" +
"╚══════════════════════════════════════════════════════════════╝\n\n" +
`Generado: ${fechaStr} a las ${horaStr}\n` +
`Base de Datos: CockroachDB\n` +
`Período: ${periodo.toUpperCase()}\n\n` +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  RESUMEN GENERAL\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
`  Libros en catálogo:       ${rLibros[0].total}\n` +
`  Usuarios registrados:     ${rUsuarios.length}\n` +
`    › Activos:              ${rUsuarios.filter(u => u.estado === 'activo').length}\n` +
`    › Restringidos:         ${rUsuarios.filter(u => u.estado === 'restringido').length}\n` +
`    › Administradores:      ${rUsuarios.filter(u => u.rol === 'admin').length}\n` +
`    › Preceptores:          ${rUsuarios.filter(u => u.rol === 'preceptor').length}\n` +
`    › Profesores:           ${rUsuarios.filter(u => u.rol === 'profesor').length}\n` +
`    › Alumnos:              ${rUsuarios.filter(u => u.rol === 'alumno').length}\n` +
`  Visitas totales al sitio: ${rVisitas[0].total}\n` +
`  Libros abiertos (total):  ${rAbiertos[0].total}\n` +
`  Libros guardados cuenta:  ${rDesc[0].total}\n` +
`  Ingresos hoy:             ${rHoy[0].total}\n\n` +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  INGRESOS POR DÍA DE LA SEMANA\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    for (let d = 0; d < 7; d++) {
      const v = ingDia[d] || 0;
      const max = Math.max(...ingDia, 1);
      const barLen = Math.round((v / max) * 20);
      const bar = "█".repeat(barLen) + "░".repeat(20 - barLen);
      reporte += `  ${dias[d].padEnd(10)} │ ${bar} ${v}\n`;
    }

    reporte +=
"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  ACTIVIDAD POR AÑO DE CURSADA\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    const aniosKeys = ["1", "2", "3", "4", "5", "6", "Otro"];
    const maxA = Math.max(...Object.values(ingAnio), 1);
    for (const ak of aniosKeys) {
      const av = ingAnio[ak] || 0;
      const aLen = Math.round((av / maxA) * 20);
      const aBar = "█".repeat(aLen) + "░".repeat(20 - aLen);
      const lbl = (ak === "Otro" ? "Otro      " : `${ak}° Año     `).substring(0, 10);
      reporte += `  ${lbl} │ ${aBar} ${av}\n`;
    }

    reporte +=
"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  TOP 10 LIBROS MÁS ABIERTOS\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
(topStr || "  Sin datos aún.\n") +
"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  ÚLTIMOS 10 INGRESOS\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
(ultStr || "  Sin ingresos registrados.\n") +
"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
"  LISTADO DE USUARIOS\n" +
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

    rUsuarios.forEach(u => {
      reporte += `  ${(u.nombre + " " + u.apellido).padEnd(24)} │ ${(u.rol || "alumno").padEnd(10)} │ ${u.email}\n`;
    });

    reporte +=
"\n╔══════════════════════════════════════════════════════════════╗\n" +
"║  Reporte generado automáticamente por DigiTeca Admin Panel  ║\n" +
"╚══════════════════════════════════════════════════════════════╝\n";

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="DigiTeca_Reporte_${periodo}_${fechaStr.replace(/\//g, '-')}.txt"`);
    res.send(reporte);
  } catch (err) {
    console.error('Error al generar reporte:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

module.exports = router;
