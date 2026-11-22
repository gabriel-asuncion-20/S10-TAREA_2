const { db } = require('../config/db');

const FavoritoModel = {
  listarPorUsuario(usuarioId) {
    const stmt = db.prepare(`
      SELECT
        f.id AS favoritoId,
        f.producto_id AS productoId,
        f.creado_en AS agregadoEn,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.precio
      FROM favoritos f
      INNER JOIN productos p ON p.id = f.producto_id
      WHERE f.usuario_id = ?
      ORDER BY f.id ASC
    `);
    return stmt.all(Number(usuarioId));
  },

  buscarEspecifico(usuarioId, productoId) {
    const stmt = db.prepare(`
      SELECT id, usuario_id AS usuarioId, producto_id AS productoId, creado_en AS agregadoEn
      FROM favoritos
      WHERE usuario_id = ? AND producto_id = ?
    `);
    return stmt.get(Number(usuarioId), Number(productoId)) || null;
  },

  agregar(usuarioId, productoId) {
    const stmt = db.prepare(`
      INSERT INTO favoritos (usuario_id, producto_id)
      VALUES (?, ?)
    `);
    const result = stmt.run(Number(usuarioId), Number(productoId));
    const selectStmt = db.prepare(`
      SELECT
        f.id AS favoritoId,
        f.producto_id AS productoId,
        f.creado_en AS agregadoEn,
        p.nombre,
        p.descripcion,
        p.categoria,
        p.precio
      FROM favoritos f
      INNER JOIN productos p ON p.id = f.producto_id
      WHERE f.id = ?
    `);
    return selectStmt.get(Number(result.lastInsertRowid));
  },

  eliminar(usuarioId, productoId) {
    const stmt = db.prepare(`
      DELETE FROM favoritos
      WHERE usuario_id = ? AND producto_id = ?
    `);
    const result = stmt.run(Number(usuarioId), Number(productoId));
    return result.changes > 0;
  }
};

module.exports = FavoritoModel;
