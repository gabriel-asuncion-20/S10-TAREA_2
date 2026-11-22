const { db } = require('../config/db');

const UsuarioModel = {
  crear({ nombre, correo, passwordHash, rol = 'usuario' }) {
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, correo, password_hash, rol)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, correo.toLowerCase().trim(), passwordHash, rol);
    return this.buscarPorId(Number(result.lastInsertRowid));
  },

  buscarPorCorreo(correo) {
    const stmt = db.prepare(`
      SELECT id, nombre, correo, password_hash, rol, creado_en
      FROM usuarios
      WHERE LOWER(correo) = LOWER(?)
    `);
    return stmt.get(correo.trim()) || null;
  },

  buscarPorId(id) {
    const stmt = db.prepare(`
      SELECT id, nombre, correo, rol, creado_en
      FROM usuarios
      WHERE id = ?
    `);
    return stmt.get(Number(id)) || null;
  }
};

module.exports = UsuarioModel;
