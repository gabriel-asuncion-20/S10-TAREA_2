const express = require('express');
const ProductoController = require('../controllers/productoController');
const { verificarToken, requiereAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET /api/productos (Público - listar y filtrar por categoría)
router.get('/', ProductoController.listar);

// GET /api/productos/:id (Público - consultar un producto)
router.get('/:id', ProductoController.obtenerPorId);

// POST /api/productos (Solo Administrador)
router.post('/', verificarToken, requiereAdmin, ProductoController.crear);

// PUT /api/productos/:id (Solo Administrador)
router.put('/:id', verificarToken, requiereAdmin, ProductoController.actualizar);

// DELETE /api/productos/:id (Solo Administrador)
router.delete('/:id', verificarToken, requiereAdmin, ProductoController.eliminar);

module.exports = router;
