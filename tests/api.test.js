const test = require('node:test');
const assert = require('node:assert/strict');

const authService = require('../services/authService');
const { mapLibroRow, cleanCoverUrl, resolveLibroMetadata } = require('../services/librosService');
const { buildTextReport } = require('../services/reportService');
const { apiAuthGuard } = require('../middleware/auth');

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
  return res;
}

test('authService: hashea y verifica contraseñas con scrypt y detecta texto plano legado', () => {
  const hash = authService.hashPassword('ClaveSegura2026!');
  assert.ok(hash.startsWith('scrypt$'));
  assert.deepEqual(authService.verifyPassword('ClaveSegura2026!', hash), { valid: true, needsRehash: false });
  assert.deepEqual(authService.verifyPassword('incorrecta', hash), { valid: false, needsRehash: false });
  assert.deepEqual(authService.verifyPassword('legacy123', 'legacy123'), { valid: true, needsRehash: true });
});

test('authService: firma tokens HMAC-SHA256 y rechaza tokens alterados', () => {
  const token = authService.createSessionToken({ id: 7, email: 'Directivo@Tecnica29de6.edu.ar', rol: 'admin' });
  const payload = authService.verifySessionToken(token);
  assert.equal(payload.email, 'directivo@tecnica29de6.edu.ar');
  assert.equal(payload.rol, 'admin');
  assert.equal(authService.verifySessionToken(token + 'tamper'), null);
});

test('apiAuthGuard: bloquea cabeceras x-user-rol falsificadas sin token Bearer', () => {
  let nextCalled = false;
  const req = {
    method: 'POST',
    path: '/libros',
    headers: { 'x-user-email': 'alumno@alu.tecnica29de6.edu.ar', 'x-user-rol': 'admin' }
  };
  const res = createMockRes();
  apiAuthGuard(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('apiAuthGuard: permite rutas públicas y aplica RBAC estricto según token firmado', () => {
  // 1. Catálogo público GET
  let nextPublic = false;
  apiAuthGuard({ method: 'GET', path: '/libros', headers: {} }, createMockRes(), () => { nextPublic = true; });
  assert.equal(nextPublic, true);

  // 2. Alumno autenticado intentando crear libro -> 403
  const alumnoToken = authService.createSessionToken({ id: 2, email: 'a@alu.tecnica29de6.edu.ar', rol: 'alumno' });
  let nextAlumno = false;
  const resAlumno = createMockRes();
  apiAuthGuard({
    method: 'POST',
    path: '/libros',
    headers: { authorization: `Bearer ${alumnoToken}` }
  }, resAlumno, () => { nextAlumno = true; });
  assert.equal(nextAlumno, false);
  assert.equal(resAlumno.statusCode, 403);

  // 3. Admin autenticado creando libro -> next()
  const adminToken = authService.createSessionToken({ id: 1, email: 'admin@tecnica29de6.edu.ar', rol: 'admin' });
  let nextAdmin = false;
  apiAuthGuard({
    method: 'POST',
    path: '/libros',
    headers: { authorization: `Bearer ${adminToken}` }
  }, createMockRes(), () => { nextAdmin = true; });
  assert.equal(nextAdmin, true);
});

test('librosService: normaliza filas SQL, limpia portadas rotas y asigna emoji de Cómics', () => {
  assert.equal(cleanCoverUrl('file:///C:/temp/test.jpg'), 'img/test.jpg');
  assert.equal(resolveLibroMetadata('Cómics').emojiFinal, '💬');

  const row = mapLibroRow({
    id: 42,
    titulo: 'El Eternauta',
    autor: 'Héctor G. Oesterheld',
    materia: 'Cómics',
    anios: '[4, 5]',
    divisiones: '[]',
    portada_url: 'img/eternauta.jpg',
    pdf_url: 'https://github.com/example/eternauta.pdf',
    emoji: '💬'
  });
  assert.equal(row.t, 'El Eternauta');
  assert.deepEqual(row.anios, [4, 5]);
  assert.equal(row.hasPdf, true);
});

test('reportService: genera el reporte institucional ASCII completo sin errores', () => {
  const { reporte, fechaStr } = buildTextReport({
    periodo: 'todo',
    rLibros: [{ total: '4347' }],
    rUsuarios: [{ nombre: 'Ana', apellido: 'Pérez', rol: 'admin', estado: 'activo', email: 'ana@tecnica29de6.edu.ar' }],
    rVisitas: [{ total: '120' }],
    rAbiertos: [{ total: '85' }],
    rHoy: [{ total: '10' }],
    rDesc: [{ total: '30' }],
    rDias: [{ dia_semana: 1, cantidad: '15' }],
    rAnios: [{ anio: '5', cantidad: '20' }],
    rTop: [{ titulo: 'Álgebra', autor: 'Varios', veces: '12' }],
    rUlt: []
  });
  assert.ok(fechaStr.length > 0);
  assert.ok(reporte.includes('REPORTE DE ESTADÍSTICAS — DigiTeca'));
  assert.ok(reporte.includes('4347'));
  assert.ok(reporte.includes('Álgebra'));
});
