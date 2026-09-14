const db = require('../db/connection.js');
const fs = require('fs');
const path = require('path');

const idsToDelete = [
  '92',
  '1210034096609198081',
  '1210034097043865601',
  '1210034333663068161'
];

async function remove() {
  try {
    for (const id of idsToDelete) {
      const res = await db.query('DELETE FROM libros WHERE id = $1', [id]);
      console.log(`Eliminado ID ${id} de CockroachDB (filas: ${res.rowCount})`);
    }

    const jsonPath = path.join(__dirname, '..', 'data', 'libros.json');
    if (fs.existsSync(jsonPath)) {
      let list = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const prevLen = list.length;
      list = list.filter(b => !idsToDelete.includes(String(b.id)));
      fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), 'utf-8');
      console.log(`Eliminados de data/libros.json: ${prevLen - list.length} libros (quedan ${list.length})`);
    }
  } catch (err) {
    console.error('Error al eliminar:', err);
  } finally {
    process.exit(0);
  }
}

remove();
