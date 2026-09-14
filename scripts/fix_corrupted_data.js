const { query } = require('../db/connection');
const fs = require('fs');
const path = require('path');

async function fixDatabase() {
  console.log("Iniciando reparación de base de datos...");

  try {
    // 1. Ampliar columnas para evitar errores de longitud en títulos largos
    console.log("1. Ampliando tipos de columnas a TEXT...");
    try {
      await query(`ALTER TABLE libros ALTER COLUMN titulo TYPE TEXT;`);
      await query(`ALTER TABLE libros ALTER COLUMN autor TYPE TEXT;`);
      await query(`ALTER TABLE libros ALTER COLUMN materia TYPE TEXT;`);
      await query(`ALTER TABLE libros ALTER COLUMN categoria_c TYPE TEXT;`);
      await query(`ALTER TABLE libros ALTER COLUMN categoria_l TYPE TEXT;`);
      console.log("   ✅ Columnas actualizadas a TEXT.");
    } catch(e) {
      console.log("   (Columnas ya eran compatibles o TEXT)");
    }

    // 2. Obtener todos los libros y limpiar materias corruptas
    console.log("2. Analizando y limpiando materias y títulos...");
    const res = await query(`SELECT id, titulo, autor, materia FROM libros;`);
    let cleanedCount = 0;

    for (const b of res.rows) {
      let mat = b.materia || '';
      let needsUpdate = false;
      let cleanMat = mat;

      // Detectar materia corrupta con íAí o Material a editar
      if (mat.includes('íAí') || mat.includes('A\x00A') || mat.includes('Material a editar') || mat.includes('Bibliotecarios') || mat.length > 30) {
        cleanMat = 'Literatura Infantil / Cuentos';
        needsUpdate = true;
      }

      // Limpiar títulos o autores con caracteres nulos o corruptos
      let cleanTitulo = b.titulo ? b.titulo.replace(/\x00/g, '').replace(/[\ufffd]/g, '').trim() : '';
      let cleanAutor = b.autor ? b.autor.replace(/\x00/g, '').replace(/[\ufffd]/g, '').trim() : '';

      if (cleanTitulo !== b.titulo || cleanAutor !== b.autor) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        await query(
          `UPDATE libros SET materia = $1, titulo = $2, autor = $3 WHERE id = $4;`,
          [cleanMat, cleanTitulo, cleanAutor, b.id]
        );
        cleanedCount++;
      }
    }

    console.log(`   ✅ ${cleanedCount} libros reparados en CockroachDB.`);

    // 3. Sincronizar data/libros.json
    console.log("3. Sincronizando respaldo data/libros.json...");
    const allBooks = await query(`SELECT * FROM libros ORDER BY id ASC;`);
    const jsonPath = path.join(__dirname, '..', 'data', 'libros.json');
    
    // Mapear al formato frontend
    const mapped = allBooks.rows.map(r => ({
      id: String(r.id),
      t: r.titulo,
      titulo: r.titulo,
      a: r.autor,
      autor: r.autor,
      mat: r.materia,
      materia: r.materia,
      tipo: r.tipo || 'Libro',
      anios: r.anios || [],
      divisiones: r.divisiones || [],
      img: r.portada_url || '',
      pdf: r.pdf_url || '',
      e: r.emoji || '📚',
      c: r.categoria_c || 'general',
      l: r.categoria_l || r.materia,
      x: r.descripcion || '',
      subioPor: r.subido_por || 'admin'
    }));

    fs.writeFileSync(jsonPath, JSON.stringify(mapped, null, 2), 'utf8');
    console.log(`   ✅ data/libros.json actualizado con ${mapped.length} libros limpios.`);

    console.log("\n🎉 ¡Reparación completada con éxito!");
    process.exit(0);
  } catch(err) {
    console.error("❌ Error en reparación:", err);
    process.exit(1);
  }
}

fixDatabase();
