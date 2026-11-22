const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const favoritoRoutes = require('./routes/favoritoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.status(200).json({
    nombre: 'API REST - Catálogo de Productos y Favoritos Personales',
    version: '1.0.0',
    estado: 'activo',
    prefijo: '/api',
    rutas: [
      'POST /api/auth/registro',
      'POST /api/auth/login',
      'GET /api/productos',
      'GET /api/productos/:id',
      'POST /api/productos',
      'PUT /api/productos/:id',
      'DELETE /api/productos/:id',
      'GET /api/favoritos',
      'POST /api/favoritos',
      'DELETE /api/favoritos/:productoId'
    ]
  });
});

// Soportar tanto el prefijo /api como las rutas directas en raíz por flexibilidad
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/favoritos', favoritoRoutes);

app.use('/auth', authRoutes);
app.use('/productos', productoRoutes);
app.use('/favoritos', favoritoRoutes);

// Manejo de JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      mensaje: 'El cuerpo de la petición no contiene un formato JSON válido.'
    });
  }
  return next(err);
});

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `No existe la ruta ${req.method} ${req.originalUrl}`
  });
});

module.exports = app;
