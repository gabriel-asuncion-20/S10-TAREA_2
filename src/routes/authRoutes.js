const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/registro (Público)
router.post('/registro', AuthController.registro);

// POST /api/auth/login (Público)
router.post('/login', AuthController.login);

module.exports = router;
