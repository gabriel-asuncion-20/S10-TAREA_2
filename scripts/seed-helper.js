const bcrypt = require('bcryptjs');
require('dotenv').config();
const UsuarioModel = require('../src/models/usuarioModel');
const ProductoModel = require('../src/models/productoModel');

const PRODUCTOS_INICIALES = [
  {
    nombre: 'Auriculares Inalámbricos Pro',
    descripcion: 'Auriculares Bluetooth con cancelación activa de ruido y 30 horas de batería.',
    categoria: 'Electronica',
    precio: 89.99
  },
  {
    nombre: 'Teclado Mecánico RGB Compacto',
    descripcion: 'Teclado mecánico 75% con switches táctiles y retroiluminación personalizable.',
    categoria: 'Electronica',
    precio: 64.5
  },
  {
    nombre: 'Cafetera Espresso Automática',
    descripcion: 'Cafetera de 15 bares de presión con espumador de leche integrado.',
    categoria: 'Hogar',
    precio: 145.0
  },
  {
    nombre: 'Lámpara de Escritorio LED Inteligente',
    descripcion: 'Lámpara regulable con temperatura de color ajustable y carga inalámbrica.',
    categoria: 'Hogar',
    precio: 35.99
  },
  {
    nombre: 'Mochila Impermeable para Laptop 15"',
    descripcion: 'Mochila ergonómica antirrobo con puerto USB y compartimento acolchado.',
    categoria: 'Accesorios',
    precio: 42.0
  },
  {
    nombre: 'Termo de Acero Inoxidable 1L',
    descripcion: 'Botella térmica de doble pared que mantiene bebidas frías por 24h y calientes por 12h.',
    categoria: 'Accesorios',
    precio: 24.75
  }
];

function inicializarDatosBase({ silencioso = false } = {}) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@catalogo.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Administrador Principal';

  let admin = UsuarioModel.buscarPorCorreo(adminEmail);
  if (!admin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    admin = UsuarioModel.crear({
      nombre: adminName,
      correo: adminEmail,
      passwordHash,
      rol: 'admin'
    });
    if (!silencioso) {
      console.log(`[SEED] Usuario administrador creado: ${adminEmail} (rol: admin)`);
    }
  } else if (!silencioso) {
    console.log(`[SEED] El administrador ya existe: ${adminEmail}`);
  }

  const totalProductos = ProductoModel.contar();
  if (totalProductos === 0) {
    for (const prod of PRODUCTOS_INICIALES) {
      ProductoModel.crear(prod);
    }
    if (!silencioso) {
      console.log(`[SEED] Se insertaron ${PRODUCTOS_INICIALES.length} productos de ejemplo.`);
    }
  } else if (!silencioso) {
    console.log(`[SEED] El catálogo ya cuenta con ${totalProductos} productos registrados.`);
  }
}

module.exports = {
  inicializarDatosBase,
  PRODUCTOS_INICIALES
};
