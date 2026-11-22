const { db } = require('../config/db');

const ProductoModel = {
  listar(categoria = null) {
    if (categoria && categoria.trim() !== '') {
      const stmt = db.prepare(`
        SELECT id, nombre, descripcion, categoria, precio, creado_en
        FROM productos
        WHERE LOWER(categoria) = LOWER(?)
        ORDER BY id ASC
      `);
      return stmt.all(categoria.trim());
    }

    const stmt = db.prepare(`
      SELECT id, nombre, descripcion, categoria, precio, creado_en
      FROM productos
      ORDER BY id ASC
    `);
    return stmt.all();
  },

  buscarPorId(id) {
    const stmt = db.prepare(`
      SELECT id, nombre, descripcion, categoria, precio, creado_en
      FROM productos
      WHERE id = ?
    `);
    return stmt.get(Number(id)) || null;
  },

  crear({ nombre, descripcion, categoria, precio }) {
    const stmt = db.prepare(`
      INSERT INTO productos (nombre, descripcion, categoria, precio)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nombre.trim(), descripcion.trim(), categoria.trim(), Number(precio));
    return this.buscarPorId(Number(result.lastInsertRowid));
  },

  actualizar(id, { nombre, descripcion, categoria, precio }) {
    const stmt = db.prepare(`
      UPDATE productos
      SET nombre = ?, descripcion = ?, categoria = ?, precio = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      nombre.trim(),
      descripcion.trim(),
      categoria.trim(),
      Number(precio),
      Number(id)
    );
    if (result.changes === 0) {
      return null;
    }
    return this.buscarPorId(Number(id));
  },

  eliminar(id) {
    const stmt = db.prepare('DELETE FROM productos WHERE id = ?');
    const result = stmt.run(Number(id));
    return result.changes > 0;
  },

  contar() {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM productos');
    const row = stmt.get();
    return row ? Number(row.total) : 0;
  }
};

module.exports = ProductoModel;
