const { query } = require('../db/connection');

async function checkDummies() {
  const res = await query("SELECT id, titulo, pdf_url FROM libros WHERE pdf_url ~ '^/libros/libro_\\d+\\.pdf$' ORDER BY id ASC");
  console.log(`Encontrados ${res.rows.length} libros con ruta local dummy /libros/libro_X.pdf`);
  for (const r of res.rows.slice(0, 10)) {
    console.log(`ID: ${r.id} | Titulo: ${r.titulo} | PDF: ${r.pdf_url}`);
  }
  process.exit(0);
}

checkDummies().catch(err => { console.error(err); process.exit(1); });
