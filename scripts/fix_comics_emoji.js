const { query } = require('../db/connection');

async function fix() {
  const res = await query("UPDATE libros SET emoji = '' WHERE materia = 'Historietas'");
  console.log('Historietas con emoji limpiados:', res.rowCount);
  const check = await query("SELECT count(1) AS c FROM libros WHERE materia = 'Historietas' AND emoji != ''");
  console.log('Restantes con emoji:', check.rows[0].c);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
