const { inicializarDatosBase } = require('./seed-helper');

console.log('--- Iniciando script de preparación de base de datos (Seed) ---');
inicializarDatosBase({ silencioso: false });
console.log('--- Inicialización completada con éxito ---');
