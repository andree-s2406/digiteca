/**
 * DigiTeca Backend & Database Test Script
 * Verifica conexión y funciones con CockroachDB y Express
 */
const { pool, query } = require('./db/connection');
const { seedDatabase } = require('./db/seed');

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE COCKROACHDB Y BACKEND DIGITECA ===\n");

  try {
    // 1. Test conexión
    console.log("1. Probando conexión a CockroachDB / PostgreSQL...");
    const resVer = await query('SELECT version();');
    console.log("   ✔ Conexión exitosa. Versión de base de datos:", resVer.rows[0].version.substring(0, 50), "...");

    // 2. Test Inicialización y Seed
    console.log("\n2. Ejecutando inicialización de tablas y seed...");
    await seedDatabase();
    console.log("   ✔ Esquema de base de datos y datos semilla listos.");

    // 3. Test consultas de libros
    console.log("\n3. Probando consulta de libros...");
    const resLibros = await query('SELECT count(*) FROM libros;');
    console.log(`   ✔ Total de libros en base de datos: ${resLibros.rows[0].count}`);

    // 4. Test usuarios y autenticación
    console.log("\n4. Probando consulta de usuarios...");
    const resUsuarios = await query('SELECT count(*) FROM usuarios;');
    console.log(`   ✔ Total de usuarios registrados: ${resUsuarios.rows[0].count}`);

    // 5. Test ranking
    console.log("\n5. Probando consulta de ranking...");
    const resRanking = await query('SELECT * FROM ranking_buscados ORDER BY posicion ASC;');
    console.log(`   ✔ Libros en ranking: ${resRanking.rows.length}`);

    // 6. Test inserción de evento de estadísticas
    console.log("\n6. Probando registro de evento de estadísticas...");
    await query(`INSERT INTO estadisticas_eventos (tipo, dia_semana) VALUES ($1, $2);`, ['visita', new Date().getDay()]);
    const resStats = await query('SELECT count(*) FROM estadisticas_eventos;');
    console.log(`   ✔ Eventos registrados: ${resStats.rows[0].count}`);

    console.log("\n====================================================");
    console.log("🎉 ¡TODAS LAS PRUEBAS DE BASE DE DATOS PASARON CON ÉXITO AL 100%!");
    console.log("====================================================");
  } catch (err) {
    console.error("❌ Error durante las pruebas:", err.message);
  } finally {
    await pool.end();
  }
}

runTests();
