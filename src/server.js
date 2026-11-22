const app = require('./app');
const { inicializarDatosBase } = require('../scripts/seed-helper');

const PORT = process.env.PORT || 3000;

// Asegurar que exista el administrador y los productos iniciales si la BD está vacía
inicializarDatosBase({ silencioso: true });

app.listen(PORT, () => {
  console.log(`Servidor API REST ejecutándose en http://localhost:${PORT}`);
});
