const { query } = require('../db/connection');
const fs = require('fs');
const path = require('path');

const CATALOG_PATH = path.join('C:', 'Users', 'User', '.gemini', 'antigravity', 'brain', '47a4d0e6-f9f1-441a-bc23-2ce74e7c2059', 'scratch', 'drive_catalog.json');

async function fix() {
  const data = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const catalog = data.files || [];
  const dummyRes = await query("SELECT id, titulo, pdf_url FROM libros WHERE pdf_url ~ '^/libros/libro_\\d+\\.pdf$'");
  
  let fixed = 0;
  for (const row of dummyRes.rows) {
    const cleanTitle = row.titulo.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = catalog.find(item => {
      const itemTitle = (item.filename || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return (cleanTitle.length > 8 && itemTitle.includes(cleanTitle.slice(0, 16))) || 
             (itemTitle.length > 8 && cleanTitle.includes(itemTitle.slice(0, 16)));
    });

    if (found) {
      const driveUrl = `https://drive.google.com/file/d/${found.id}/preview`;
      await query('UPDATE libros SET pdf_url = $1 WHERE id = $2', [driveUrl, row.id]);
      console.log(`✅ ID ${row.id} (${row.titulo.slice(0, 30)}...) -> Drive ID ${found.id}`);
      fixed++;
    } else {
      await query("UPDATE libros SET pdf_url = '' WHERE id = $1", [row.id]);
      console.log(`⚠️ ID ${row.id}: establecido como no disponible.`);
    }
  }

  console.log(`Total procesados: ${dummyRes.rows.length}, vinculados a Drive: ${fixed}`);
  process.exit(0);
}

fix().catch(e => { console.error(e); process.exit(1); });
