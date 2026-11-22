const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthController = {
  registro(req, res) {
    try {
      const { nombre, correo, password } = req.body;

      if (
        typeof nombre !== 'string' ||
        nombre.trim() === '' ||
        typeof correo !== 'string' ||
        correo.trim() === '' ||
        typeof password !== 'string' ||
        password.trim() === ''
      ) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'Los campos nombre, correo y password están requeridos y no pueden estar vacíos.'
        });
      }

      if (!EMAIL_REGEX.test(correo.trim())) {
        return res.status(400).json({
          error: 'Correo inválido',
          mensaje: 'El formato del correo electrónico no es válido.'
        });
      }

      if (password.trim().length < 6) {
        return res.status(400).json({
          error: 'Contraseña débil',
          mensaje: 'La contraseña debe tener al menos 6 caracteres.'
        });
      }

      const existente = UsuarioModel.buscarPorCorreo(correo);
      if (existente) {
        return res.status(409).json({
          error: 'Conflicto',
          mensaje: 'Ya existe un usuario registrado con ese correo electrónico.'
        });
      }

      const passwordHash = bcrypt.hashSync(password, 10);

      // Seguridad: El registro público SIEMPRE crea usuarios con rol 'usuario', ignorando cualquier campo rol en req.body
      const nuevoUsuario = UsuarioModel.crear({
        nombre: nombre.trim(),
        correo: correo.trim(),
        passwordHash,
        rol: 'usuario'
      });

      return res.status(201).json({
        mensaje: 'Usuario registrado exitosamente.',
        usuario: {
          id: nuevoUsuario.id,
          nombre: nuevoUsuario.nombre,
          correo: nuevoUsuario.correo,
          rol: nuevoUsuario.rol,
          creado_en: nuevoUsuario.creado_en
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo procesar el registro.'
      });
    }
  },

  login(req, res) {
    try {
      const { correo, password } = req.body;

      if (
        typeof correo !== 'string' ||
        correo.trim() === '' ||
        typeof password !== 'string' ||
        password.trim() === ''
      ) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'Debe proporcionar correo y password.'
        });
      }

      const usuario = UsuarioModel.buscarPorCorreo(correo);
      if (!usuario) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          mensaje: 'Correo o contraseña incorrectos.'
        });
      }

      const passwordValida = bcrypt.compareSync(password, usuario.password_hash);
      if (!passwordValida) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          mensaje: 'Correo o contraseña incorrectos.'
        });
      }

      const secret = process.env.JWT_SECRET || 'secreto_super_seguro_para_desarrollo_jwt_2026';
      const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

      const token = jwt.sign(
        {
          id: usuario.id,
          correo: usuario.correo,
          rol: usuario.rol
        },
        secret,
        { expiresIn }
      );

      return res.status(200).json({
        mensaje: 'Inicio de sesión exitoso.',
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol
        }
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo procesar el inicio de sesión.'
      });
    }
  }
};

module.exports = AuthController;
