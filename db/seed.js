const fs = require('fs');
const path = require('path');
const { pool, query } = require('./connection');

const DEFAULT_ADMINS = [
  {
    email: "franco.parrucci.058@alu.tecnica29de6.edu.ar",
    password: "1234",
    nombre: "Franco",
    apellido: "Parrucci",
    rol: "admin",
    anio: "Otro",
    estado: "activo"
  },
  {
    email: "andres.rodriguez.750@alu.tecnica29de6.edu.ar",
    password: "1234",
    nombre: "Andrés",
    apellido: "Rodríguez",
    rol: "admin",
    anio: "Otro",
    estado: "activo"
  },
  {
    email: "lucas.solohaga.031@alu.tecnica29de6.edu.ar",
    password: "1234",
    nombre: "Lucas",
    apellido: "Solohaga",
    rol: "admin",
    anio: "Otro",
    estado: "activo"
  }
];

const DEFAULT_LIBROS = [];

const DEFAULT_RANKING = [];

async function seedDatabase() {
  console.log("Inicializando base de datos CockroachDB...");

  try {
    // 1. Ejecutar DDL (init.sql)
    const sqlPath = path.join(__dirname, 'init.sql');
    const sqlInit = fs.readFileSync(sqlPath, 'utf8');
    await query(sqlInit);
    console.log("Tablas creadas / verificadas en CockroachDB.");

    // 2. Insertar usuarios administradores por defecto
    for (const admin of DEFAULT_ADMINS) {
      await query(
        `INSERT INTO usuarios (email, password, nombre, apellido, rol, anio, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           apellido = EXCLUDED.apellido,
           rol = EXCLUDED.rol,
           estado = EXCLUDED.estado;`,
        [admin.email, admin.password, admin.nombre, admin.apellido, admin.rol, admin.anio, admin.estado]
      );
    }
    console.log(`Usuarios administradores insertados (${DEFAULT_ADMINS.length}).`);

    // 3. Insertar libros iniciales solo una vez (primera inicialización)
    const { rows: configRows } = await query(`SELECT valor FROM sistema_config WHERE clave = 'seed_libros_completado';`);
    const yaInicializado = configRows.length > 0 && configRows[0].valor === 'true';

    if (!yaInicializado) {
      for (const l of DEFAULT_LIBROS) {
        await query(
          `INSERT INTO libros (id, titulo, autor, materia, tipo, anios, divisiones, portada_url, pdf_url, emoji, categoria_c, categoria_l, descripcion, subido_por)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO NOTHING;`,
          [
            l.id,
            l.t,
            l.a,
            l.mat,
            l.tipo || 'Libro',
            JSON.stringify(l.anios || []),
            JSON.stringify([]),
            l.img || '',
            l.pdf || '',
            l.e || '📚',
            l.c || 'ciencias',
            l.l || 'Ciencias',
            l.x || '',
            'sistema'
          ]
        );
      }
      console.log(`Libros por defecto iniciales insertados (${DEFAULT_LIBROS.length}).`);

      // Guardar bandera para no volver a reinsertar libros si el usuario los elimina
      await query(`INSERT INTO sistema_config (clave, valor) VALUES ('seed_libros_completado', 'true') ON CONFLICT (clave) DO UPDATE SET valor = 'true';`);
    } else {
      const { rows: existingBooks } = await query(`SELECT COUNT(*) AS total FROM libros;`);
      console.log(`Configuración previa detectada. Total de libros en base de datos: ${existingBooks[0].total}.`);
    }

    // 4. Insertar ranking inicial si no existe
    const { rows: existingRanking } = await query(`SELECT COUNT(*) AS total FROM ranking_buscados;`);
    if (parseInt(existingRanking[0].total, 10) === 0 && !yaInicializado) {
      const availableBooks = await query(`SELECT id FROM libros;`);
      const availableIds = new Set(availableBooks.rows.map(r => parseInt(r.id, 10)));
      const validRanking = DEFAULT_RANKING.filter(id => availableIds.has(id));

      for (let pos = 0; pos < validRanking.length; pos++) {
        const libroId = validRanking[pos];
        try {
          await query(
            `INSERT INTO ranking_buscados (posicion, libro_id) VALUES ($1, $2)
             ON CONFLICT (posicion) DO UPDATE SET libro_id = EXCLUDED.libro_id;`,
            [pos + 1, libroId]
          );
        } catch(rankErr) {
          console.warn("No se pudo insertar ranking pos " + (pos + 1) + ":", rankErr.message);
        }
      }
      if (validRanking.length > 0) {
        console.log(`Ranking inicial insertado (${validRanking.length} posiciones).`);
      }
    }

    console.log("¡Inicialización de CockroachDB completada con éxito!");
  } catch (err) {
    console.error("Error al inicializar la base de datos:", err);
    throw err;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      pool.end();
      process.exit(1);
    });
}

module.exports = {
  seedDatabase,
};
