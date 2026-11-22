const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');

// Usar una base de datos de prueba limpia para la verificación reproducible
const testDbPath = path.resolve(process.cwd(), './data/test_verificacion.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}
process.env.DB_PATH = './data/test_verificacion.db';
process.env.JWT_SECRET = 'secreto_super_seguro_para_desarrollo_jwt_2026';

const app = require('../src/app');
const { inicializarDatosBase } = require('./seed-helper');

async function peticion(baseUrl, ruta, { method = 'GET', token = null, body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${ruta}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  const text = await res.text();
  if (text) {
    data = JSON.parse(text);
  }
  return { status: res.status, data };
}

async function ejecutarPruebas() {
  console.log('==============================================================');
  console.log(' INICIANDO BATERÍA DE PRUEBAS REPRODUCIBLES DE LA API REST');
  console.log('==============================================================\n');

  inicializarDatosBase({ silencioso: false });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  try {
    // 1. Registro e inicio de sesión
    console.log('\n1. Probando Autenticación (Registro, Duplicados y Login)...');
    const regA = await peticion(baseUrl, '/auth/registro', {
      method: 'POST',
      body: {
        nombre: 'Usuario A',
        correo: 'usuarioA@correo.com',
        password: 'Password123!',
        rol: 'admin' // Intentando escalar privilegios desde registro público
      }
    });
    assert.equal(regA.status, 201);
    assert.equal(regA.data.usuario.rol, 'usuario', 'El registro público siempre debe asignar rol usuario');
    assert.equal(regA.data.usuario.password_hash, undefined, 'Nunca debe devolver password_hash');
    console.log('  [OK] Registro Usuario A (201) con rol forzado a "usuario" y sin exponer hash.');

    const regB = await peticion(baseUrl, '/auth/registro', {
      method: 'POST',
      body: {
        nombre: 'Usuario B',
        correo: 'usuarioB@correo.com',
        password: 'Password123!'
      }
    });
    assert.equal(regB.status, 201);
    console.log('  [OK] Registro Usuario B (201).');

    const regDuplicado = await peticion(baseUrl, '/auth/registro', {
      method: 'POST',
      body: {
        nombre: 'Usuario A Clón',
        correo: 'usuarioA@correo.com',
        password: 'Password123!'
      }
    });
    assert.equal(regDuplicado.status, 409);
    console.log('  [OK] Rechazo de correo duplicado (409 Conflict).');

    const loginFallido = await peticion(baseUrl, '/auth/login', {
      method: 'POST',
      body: { correo: 'usuarioA@correo.com', password: 'ClaveIncorrecta' }
    });
    assert.equal(loginFallido.status, 401);
    console.log('  [OK] Rechazo de credenciales incorrectas (401 Unauthorized).');

    const loginA = await peticion(baseUrl, '/auth/login', {
      method: 'POST',
      body: { correo: 'usuarioA@correo.com', password: 'Password123!' }
    });
    assert.equal(loginA.status, 200);
    assert.ok(loginA.data.token);
    const tokenA = loginA.data.token;

    const loginB = await peticion(baseUrl, '/auth/login', {
      method: 'POST',
      body: { correo: 'usuarioB@correo.com', password: 'Password123!' }
    });
    assert.equal(loginB.status, 200);
    const tokenB = loginB.data.token;

    const loginAdmin = await peticion(baseUrl, '/auth/login', {
      method: 'POST',
      body: {
        correo: process.env.ADMIN_EMAIL || 'admin@catalogo.com',
        password: process.env.ADMIN_PASSWORD || 'Admin123!'
      }
    });
    assert.equal(loginAdmin.status, 200);
    assert.equal(loginAdmin.data.usuario.rol, 'admin');
    const tokenAdmin = loginAdmin.data.token;
    console.log('  [OK] Login exitoso y emisión de JWT para Usuario A, Usuario B y Administrador (200).');

    // 2. Autorización, tokens vencidos y roles
    console.log('\n2. Probando Seguridad JWT y Control de Roles...');
    const sinToken = await peticion(baseUrl, '/favoritos');
    assert.equal(sinToken.status, 401);
    console.log('  [OK] Acceso a ruta protegida sin token rechazado (401).');

    const tokenExpirado = jwt.sign(
      { id: regA.data.usuario.id, correo: 'usuarioA@correo.com', rol: 'usuario' },
      process.env.JWT_SECRET,
      { expiresIn: '-10s' }
    );
    const conTokenVencido = await peticion(baseUrl, '/favoritos', { token: tokenExpirado });
    assert.equal(conTokenVencido.status, 401);
    console.log('  [OK] Acceso con token vencido rechazado (401).');

    const crearComoUsuario = await peticion(baseUrl, '/productos', {
      method: 'POST',
      token: tokenA,
      body: {
        nombre: 'Producto Intruso',
        descripcion: 'Intento de creación por usuario normal',
        categoria: 'Electronica',
        precio: 100
      }
    });
    assert.equal(crearComoUsuario.status, 403);
    console.log('  [OK] Modificación del catálogo con rol "usuario" rechazada (403 Forbidden).');

    // 3. CRUD de productos como Administrador y Validaciones
    console.log('\n3. Probando CRUD de Productos (Admin), Validaciones y Filtros...');
    const crearProd = await peticion(baseUrl, '/productos', {
      method: 'POST',
      token: tokenAdmin,
      body: {
        nombre: 'Monitor Gamer 27 Pulgadas',
        descripcion: 'Monitor QHD 165Hz IPS',
        categoria: 'Electronica',
        precio: 299.99
      }
    });
    assert.equal(crearProd.status, 201);
    const nuevoProdId = crearProd.data.producto.id;
    console.log(`  [OK] Producto creado por Administrador (201, id=${nuevoProdId}).`);

    const precioInvalido = await peticion(baseUrl, '/productos', {
      method: 'POST',
      token: tokenAdmin,
      body: {
        nombre: 'Producto Gratis o Negativo',
        descripcion: 'Precio inválido',
        categoria: 'Electronica',
        precio: -5
      }
    });
    assert.equal(precioInvalido.status, 400);
    console.log('  [OK] Rechazo de producto con precio <= 0 (400 Bad Request).');

    const camposVacios = await peticion(baseUrl, '/productos', {
      method: 'POST',
      token: tokenAdmin,
      body: { nombre: '', descripcion: '', categoria: '', precio: 50 }
    });
    assert.equal(camposVacios.status, 400);
    console.log('  [OK] Rechazo de producto con campos vacíos (400 Bad Request).');

    const listarTodos = await peticion(baseUrl, '/productos');
    assert.equal(listarTodos.status, 200);
    assert.ok(listarTodos.data.productos.length >= 7);
    console.log(`  [OK] Consulta pública de catálogo sin sesión (200, total=${listarTodos.data.total}).`);

    const filtrarCat = await peticion(baseUrl, '/productos?categoria=Hogar');
    assert.equal(filtrarCat.status, 200);
    assert.ok(filtrarCat.data.productos.every((p) => p.categoria.toLowerCase() === 'hogar'));
    console.log(`  [OK] Filtro de catálogo por categoría "?categoria=Hogar" (200, encontrados=${filtrarCat.data.total}).`);

    const prodInexistente = await peticion(baseUrl, '/productos/99999');
    assert.equal(prodInexistente.status, 404);
    console.log('  [OK] Consulta de producto inexistente devuelve 404.');

    const actualizarProd = await peticion(baseUrl, `/productos/${nuevoProdId}`, {
      method: 'PUT',
      token: tokenAdmin,
      body: {
        nombre: 'Monitor Gamer 27" Pro',
        descripcion: 'Monitor QHD 165Hz HDR',
        categoria: 'Electronica',
        precio: 319.99
      }
    });
    assert.equal(actualizarProd.status, 200);
    assert.equal(actualizarProd.data.producto.precio, 319.99);
    console.log('  [OK] Actualización de producto por Administrador (200).');

    // 4. Favoritos y aislamiento entre Usuario A y Usuario B
    console.log('\n4. Probando Favoritos y Aislamiento entre Usuarios A y B...');
    const favA1 = await peticion(baseUrl, '/favoritos', {
      method: 'POST',
      token: tokenA,
      body: { productoId: 1, usuarioId: 999 } // Enviando usuarioId falso que el servidor debe ignorar
    });
    assert.equal(favA1.status, 201);
    console.log('  [OK] Usuario A agrega producto 1 a favoritos (201).');

    const favDuplicado = await peticion(baseUrl, '/favoritos', {
      method: 'POST',
      token: tokenA,
      body: { productoId: 1 }
    });
    assert.equal(favDuplicado.status, 409);
    console.log('  [OK] Rechazo de favorito duplicado para el mismo usuario (409 Conflict).');

    const favInexistente = await peticion(baseUrl, '/favoritos', {
      method: 'POST',
      token: tokenA,
      body: { productoId: 88888 }
    });
    assert.equal(favInexistente.status, 404);
    console.log('  [OK] Rechazo de favorito con producto inexistente (404 Not Found).');

    const listaB = await peticion(baseUrl, '/favoritos', { token: tokenB });
    assert.equal(listaB.status, 200);
    assert.equal(listaB.data.favoritos.length, 0);
    console.log('  [OK] Aislamiento verificado: Usuario B consulta sus favoritos y NO ve los de Usuario A (total=0).');

    const borrarDeAPorB = await peticion(baseUrl, '/favoritos/1', {
      method: 'DELETE',
      token: tokenB
    });
    assert.equal(borrarDeAPorB.status, 404);
    console.log('  [OK] Aislamiento verificado: Usuario B intenta eliminar el favorito de A y recibe 404.');

    const listaA = await peticion(baseUrl, '/favoritos', { token: tokenA });
    assert.equal(listaA.status, 200);
    assert.equal(listaA.data.favoritos.length, 1);
    assert.equal(listaA.data.favoritos[0].productoId, 1);
    console.log('  [OK] El favorito de Usuario A permanece intacto.');

    // 5. Consistencia al eliminar un producto que está en favoritos (ON DELETE CASCADE)
    console.log('\n5. Probando Integridad Referencial al Eliminar Producto y Favorito...');
    await peticion(baseUrl, '/favoritos', {
      method: 'POST',
      token: tokenA,
      body: { productoId: nuevoProdId }
    });
    const eliminarProd = await peticion(baseUrl, `/productos/${nuevoProdId}`, {
      method: 'DELETE',
      token: tokenAdmin
    });
    assert.equal(eliminarProd.status, 200);

    const listaADespues = await peticion(baseUrl, '/favoritos', { token: tokenA });
    assert.equal(listaADespues.data.favoritos.length, 1, 'El producto eliminado debe desaparecer de favoritos automáticamente');
    console.log('  [OK] Al eliminar un producto como Admin, sus favoritos asociados se limpian en cascada (ON DELETE CASCADE).');

    const quitarFavA = await peticion(baseUrl, '/favoritos/1', {
      method: 'DELETE',
      token: tokenA
    });
    assert.equal(quitarFavA.status, 200);
    console.log('  [OK] Usuario A elimina su favorito correctamente (200).');

    console.log('\n==============================================================');
    console.log(' TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% CUMPLIMIENTO)');
    console.log('==============================================================');
  } finally {
    server.close();
  }
}

ejecutarPruebas().catch((err) => {
  console.error('Error en las pruebas:', err);
  process.exit(1);
});
