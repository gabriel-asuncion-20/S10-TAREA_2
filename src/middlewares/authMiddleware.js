const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Se requiere un token de autenticación válido (Bearer token).'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secreto_super_seguro_para_desarrollo_jwt_2026';
    const decoded = jwt.verify(token, secret);
    req.usuario = {
      id: decoded.id,
      correo: decoded.correo,
      rol: decoded.rol
    };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        mensaje: 'El token de autenticación ha expirado. Inicie sesión nuevamente.'
      });
    }
    return res.status(401).json({
      error: 'Token inválido',
      mensaje: 'El token proporcionado es inválido o su firma no coincide.'
    });
  }
}

function requiereAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso prohibido',
      mensaje: 'Se requiere rol de administrador para realizar esta operación.'
    });
  }
  return next();
}

module.exports = {
  verificarToken,
  requiereAdmin
};
