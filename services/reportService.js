/**
 * Genera el reporte institucional de estadísticas en texto plano (formato ASCII).
 */
function buildTextReport({
  periodo = 'todo',
  rLibros,
  rUsuarios,
  rVisitas,
  rAbiertos,
  rHoy,
  rDesc,
  rDias,
  rAnios,
  rTop,
  rUlt
}) {
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const ingDia = [0, 0, 0, 0, 0, 0, 0];
  rDias.forEach(r => {
    if (r.dia_semana !== null && r.dia_semana >= 0 && r.dia_semana < 7) {
      ingDia[r.dia_semana] = parseInt(r.cantidad, 10);
    }
  });

  const ingAnio = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, Otro: 0 };
  rAnios.forEach(r => {
    ingAnio[r.anio] = parseInt(r.cantidad, 10);
  });

  let topStr = '';
  rTop.forEach((t, i) => {
    topStr += `  ${i + 1}. ${t.titulo} (${t.autor}) - ${t.veces} veces\n`;
  });

  let ultStr = '';
  rUlt.forEach(u => {
    const d = new Date(u.fecha);
    const f = d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    ultStr += `  - ${u.usuario_nombre || u.usuario_email} (${u.usuario_rol || 'alumno'}) — ${f}\n`;
  });

  let reporte =
    '╔══════════════════════════════════════════════════════════════╗\n' +
    '║         REPORTE DE ESTADÍSTICAS — DigiTeca                  ║\n' +
    '║   Escuela Técnica N° 29 DE 6 — Reconquista de Buenos Aires  ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n\n' +
    `Generado: ${fechaStr} a las ${horaStr}\n` +
    'Base de Datos: CockroachDB\n' +
    `Período: ${periodo.toUpperCase()}\n\n` +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  RESUMEN GENERAL\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
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
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  INGRESOS POR DÍA DE LA SEMANA\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  const maxDia = Math.max(...ingDia, 1);
  for (let d = 0; d < 7; d++) {
    const v = ingDia[d] || 0;
    const barLen = Math.round((v / maxDia) * 20);
    const bar = '█'.repeat(barLen) + '░'.repeat(20 - barLen);
    reporte += `  ${dias[d].padEnd(10)} │ ${bar} ${v}\n`;
  }

  reporte +=
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  ACTIVIDAD POR AÑO DE CURSADA\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  const aniosKeys = ['1', '2', '3', '4', '5', '6', 'Otro'];
  const maxA = Math.max(...Object.values(ingAnio), 1);
  for (const ak of aniosKeys) {
    const av = ingAnio[ak] || 0;
    const aLen = Math.round((av / maxA) * 20);
    const aBar = '█'.repeat(aLen) + '░'.repeat(20 - aLen);
    const lbl = (ak === 'Otro' ? 'Otro      ' : `${ak}° Año     `).substring(0, 10);
    reporte += `  ${lbl} │ ${aBar} ${av}\n`;
  }

  reporte +=
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  TOP 10 LIBROS MÁS ABIERTOS\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    (topStr || '  Sin datos aún.\n') +
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  ÚLTIMOS 10 INGRESOS\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    (ultStr || '  Sin ingresos registrados.\n') +
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
    '  LISTADO DE USUARIOS\n' +
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  rUsuarios.forEach(u => {
    reporte += `  ${(u.nombre + ' ' + u.apellido).padEnd(24)} │ ${(u.rol || 'alumno').padEnd(10)} │ ${u.email}\n`;
  });

  reporte +=
    '\n╔══════════════════════════════════════════════════════════════╗\n' +
    '║  Reporte generado automáticamente por DigiTeca Admin Panel  ║\n' +
    '╚══════════════════════════════════════════════════════════════╝\n';

  return { reporte, fechaStr };
}

module.exports = {
  buildTextReport
};
