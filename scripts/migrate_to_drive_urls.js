const { query } = require('../db/connection');

async function migrate() {
  console.log("Ejecutando actualización masiva en CockroachDB...");
  const sql = `
    UPDATE libros 
    SET pdf_url = concat('https://drive.google.com/file/d/', substring(pdf_url from 'libro_([a-zA-Z0-9_-]{25,})\\.pdf'), '/preview')
    WHERE pdf_url ~ 'libro_[a-zA-Z0-9_-]{25,}\\.pdf';
  `;
  const res = await query(sql);
  console.log(`✅ ¡Éxito! ${res.rowCount} libros actualizados a enlaces de Google Drive en la nube.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
