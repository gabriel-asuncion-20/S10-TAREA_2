const express = require('express');
const FavoritoController = require('../controllers/favoritoController');
const { verificarToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas de favoritos requieren estar autenticado
router.use(verificarToken);

// GET /api/favoritos (Autenticado - listar sus favoritos)
router.get('/', FavoritoController.listar);

// POST /api/favoritos (Autenticado - agregar un producto a sus favoritos)
router.post('/', FavoritoController.agregar);

// DELETE /api/favoritos/:productoId (Autenticado - quitar un producto de sus favoritos)
router.delete('/:productoId', FavoritoController.eliminar);

module.exports = router;
