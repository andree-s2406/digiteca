const db = require('../db/connection.js');
const fs = require('fs');
const path = require('path');

async function fix() {
  try {
    const res = await db.query(
      "UPDATE libros SET materia = 'Literatura Infantil / Cuentos', emoji = '📚' WHERE materia LIKE '%Bibliotecarios%' OR materia LIKE '%AA Material%'"
    );
    console.log('Filas actualizadas en CockroachDB:', res.rowCount);

    const jsonPath = path.join(__dirname, '..', 'data', 'libros.json');
    if (fs.existsSync(jsonPath)) {
      const list = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      let count = 0;
      list.forEach(b => {
        if ((b.materia && (b.materia.includes('Bibliotecarios') || b.materia.includes('AA Material'))) ||
            (b.mat && (b.mat.includes('Bibliotecarios') || b.mat.includes('AA Material')))) {
          b.materia = 'Literatura Infantil / Cuentos';
          b.mat = 'Literatura Infantil / Cuentos';
          b.emoji = '📚';
          b.e = '📚';
          count++;
        }
      });
      fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf-8');
      console.log('Libros actualizados en data/libros.json:', count);
    }
  } catch (err) {
    console.error('Error al actualizar:', err);
  } finally {
    process.exit(0);
  }
}

fix();
