const { query } = require('../db/connection');

async function check() {
  const d = await query("SELECT count(1) AS c FROM libros WHERE pdf_url LIKE '%drive.google.com%'");
  const g = await query("SELECT count(1) AS c FROM libros WHERE pdf_url LIKE '%github.com%'");
  const t = await query("SELECT count(1) AS c FROM libros");
  console.log(`[CockroachDB Live] En Nube (GitHub): ${g.rows[0].c} | Pendientes en Drive: ${d.rows[0].c} | Total: ${t.rows[0].c}`);
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
