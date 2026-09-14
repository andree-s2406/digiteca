const db = require('../db/connection.js');
const fs = require('fs');
const path = require('path');

async function fix() {
  try {
    // 1. Corregir libros 61 y 62 a Educación Física en CockroachDB
    const res = await db.query(
      "UPDATE libros SET materia = 'Educación Física', emoji = '⚽' WHERE id IN (61, 62) OR titulo LIKE '%Deporte escolar%' OR titulo LIKE '%Voleibol%'"
    );
    console.log('Libros actualizados en CockroachDB:', res.rowCount);

    // 2. Actualizar data/libros.json
    const jsonPath = path.join(__dirname, '..', 'data', 'libros.json');
    if (fs.existsSync(jsonPath)) {
      const list = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      let count = 0;
      list.forEach(b => {
        if (b.id === 61 || b.id === 62 || (b.t && (b.t.includes('Deporte') || b.t.includes('Voleibol')))) {
          b.materia = 'Educación Física';
          b.mat = 'Educación Física';
          b.emoji = '⚽';
          b.e = '⚽';
          count++;
        }
      });
      fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf-8');
      console.log('Libros actualizados en data/libros.json:', count);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

fix();
