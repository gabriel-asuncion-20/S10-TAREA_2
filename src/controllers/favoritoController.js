const FavoritoModel = require('../models/favoritoModel');
const ProductoModel = require('../models/productoModel');

function validarIdPositivo(valor) {
  const num = Number(valor);
  return Number.isInteger(num) && num > 0;
}

const FavoritoController = {
  listar(req, res) {
    try {
      // La identidad del usuario se toma exclusivamente del JWT verificado
      const usuarioId = req.usuario.id;
      const favoritos = FavoritoModel.listarPorUsuario(usuarioId);

      return res.status(200).json({
        usuarioId,
        total: favoritos.length,
        favoritos
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudieron obtener los favoritos.'
      });
    }
  },

  agregar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { productoId } = req.body || {};

      if (productoId === undefined || productoId === null || !validarIdPositivo(productoId)) {
        return res.status(400).json({
          error: 'Datos inválidos',
          mensaje: 'El campo productoId es obligatorio y debe ser un número entero positivo.'
        });
      }

      const producto = ProductoModel.buscarPorId(productoId);
      if (!producto) {
        return res.status(404).json({
          error: 'Producto no encontrado',
          mensaje: `No existe ningún producto con el id ${productoId}.`
        });
      }

      const yaExiste = FavoritoModel.buscarEspecifico(usuarioId, productoId);
      if (yaExiste) {
        return res.status(409).json({
          error: 'Favorito duplicado',
          mensaje: 'Este producto ya se encuentra en tu lista de favoritos.'
        });
      }

      const favorito = FavoritoModel.agregar(usuarioId, productoId);
      return res.status(201).json({
        mensaje: 'Producto agregado a favoritos exitosamente.',
        favorito
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo agregar el producto a favoritos.'
      });
    }
  },

  eliminar(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const { productoId } = req.params;

      if (!validarIdPositivo(productoId)) {
        return res.status(400).json({
          error: 'Identificador inválido',
          mensaje: 'El parámetro productoId debe ser un número entero positivo.'
        });
      }

      const eliminado = FavoritoModel.eliminar(usuarioId, productoId);
      if (!eliminado) {
        return res.status(404).json({
          error: 'Favorito no encontrado',
          mensaje: 'El producto indicado no se encuentra en tu lista personal de favoritos.'
        });
      }

      return res.status(200).json({
        mensaje: 'Producto eliminado de tus favoritos exitosamente.'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: 'No se pudo quitar el producto de favoritos.'
      });
    }
  }
};

module.exports = FavoritoController;
