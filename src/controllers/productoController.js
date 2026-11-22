const ProductoModel = require('../models/productoModel');

function validarIdPositivo(valor) {
  const num = Number(valor);
  return Number.isInteger(num) && num > 0;
}

function validarCuerpoProducto(body) {
  const { nombre, descripcion, categoria, precio } = body || {};

  if (
    typeof nombre !== 'string' ||
    nombre.trim() === '' ||
    typeof descripcion !== 'string' ||
    descripcion.trim() === '' ||
    typeof categoria !== 'string' ||
    categoria.trim() === ''
  ) {
    return 'Los campos nombre, descripcion y categoria son obligatorios y deben ser texto no vacío.';
  }

  const precioNum = Number(precio);
  if (precio === undefined || precio === null || precio === '' || Number.isNaN(precioNum) || precioNum <= 0) {
    return 'El campo precio es obligatorio y debe ser un número mayor que cero.';
  }

  return null;
}

const ProductoController = {
  listar(req, res) {
    try {
      const { categoria } = req.query;
      const productos = ProductoModel.listar(categoria);
      return res.status(200).json({
        total: productos.length,
        filtroCategoria: categoria || null,
        productos
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo obtener el catálogo de productos.'
      });
    }
  },

  obtenerPorId(req, res) {
    try {
      const { id } = req.params;

      if (!validarIdPositivo(id)) {
        return res.status(400).json({
          error: 'Identificador inválido',
          mensaje: 'El id del producto debe ser un número entero positivo.'
        });
      }

      const producto = ProductoModel.buscarPorId(id);
      if (!producto) {
        return res.status(404).json({
          error: 'No encontrado',
          mensaje: `No existe ningún producto con el id ${id}.`
        });
      }

      return res.status(200).json({
        producto
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo consultar el producto.'
      });
    }
  },

  crear(req, res) {
    try {
      const errorValidacion = validarCuerpoProducto(req.body);
      if (errorValidacion) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: errorValidacion
        });
      }

      const nuevoProducto = ProductoModel.crear(req.body);
      return res.status(201).json({
        mensaje: 'Producto creado exitosamente.',
        producto: nuevoProducto
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo crear el producto.'
      });
    }
  },

  actualizar(req, res) {
    try {
      const { id } = req.params;

      if (!validarIdPositivo(id)) {
        return res.status(400).json({
          error: 'Identificador inválido',
          mensaje: 'El id del producto debe ser un número entero positivo.'
        });
      }

      const errorValidacion = validarCuerpoProducto(req.body);
      if (errorValidacion) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: errorValidacion
        });
      }

      const actualizado = ProductoModel.actualizar(id, req.body);
      if (!actualizado) {
        return res.status(404).json({
          error: 'No encontrado',
          mensaje: `No existe ningún producto con el id ${id} para actualizar.`
        });
      }

      return res.status(200).json({
        mensaje: 'Producto actualizado exitosamente.',
        producto: actualizado
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo actualizar el producto.'
      });
    }
  },

  eliminar(req, res) {
    try {
      const { id } = req.params;

      if (!validarIdPositivo(id)) {
        return res.status(400).json({
          error: 'Identificador inválido',
          mensaje: 'El id del producto debe ser un número entero positivo.'
        });
      }

      const eliminado = ProductoModel.eliminar(id);
      if (!eliminado) {
        return res.status(404).json({
          error: 'No encontrado',
          mensaje: `No existe ningún producto con el id ${id} para eliminar.`
        });
      }

      return res.status(200).json({
        mensaje: 'Producto eliminado exitosamente (y removido en cascada de las listas de favoritos).'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo eliminar el producto.'
      });
    }
  }
};

module.exports = ProductoController;
