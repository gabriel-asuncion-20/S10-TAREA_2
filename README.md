# API REST - Catálogo de Productos y Favoritos Personales

---

## 1. Propósito del Proyecto

Este proyecto implementa una **API REST con Node.js y Express** para gestionar un catálogo público de productos y listas de favoritos personales por usuario.

Sus objetivos principales son:
* Separar responsabilidades en **rutas**, **controladores**, **modelos de acceso a datos** y **middlewares**.
* Proteger la identidad de los usuarios mediante **autenticación JWT (JSON Web Tokens)** con verificación de firma y expiración, y almacenamiento seguro de contraseñas mediante hashes (`bcryptjs`).
* Aplicar **autorización basada en roles (`usuario` y `admin`)**, permitiendo consultas públicas del catálogo, reservando la creación, edición y eliminación de productos exclusivamente al rol `admin`, y garantizando que el registro público solo cree cuentas con rol `usuario`.
* Garantizar el **aislamiento total de favoritos personales**, extrayendo la identidad del usuario exclusivamente del token JWT verificado para que ningún usuario pueda ver ni modificar los favoritos de otro.

---

## 2. Elección de Base de Datos y Persistencia

Se eligió **SQLite** (a través del módulo nativo `node:sqlite` de Node.js) como motor de base de datos relacional por las siguientes razones técnicas:

1. **Persistencia real en disco:** Almacena toda la información en un archivo físico local (configurable mediante `DB_PATH`, por defecto `./data/catalogo.db`), lo que garantiza que los usuarios, productos y favoritos persistan al detener y reiniciar el proceso de Node.js.
2. **Integridad referencial y restricciones SQL:** Soporta claves primarias, restricciones `UNIQUE` (para evitar correos duplicados y favoritos duplicados `UNIQUE(usuario_id, producto_id)`), validaciones `CHECK (precio > 0)` y claves foráneas activas (`PRAGMA foreign_keys = ON`).
3. **Consistencia al eliminar productos (`ON DELETE CASCADE`):** La tabla `favoritos` define `FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE`. Cuando un administrador elimina un producto del catálogo, SQLite elimina automáticamente en cascada todas las referencias a ese producto en las listas de favoritos, evitando registros huérfanos.
4. **Reproducibilidad inmediata:** No requiere levantar contenedores ni servidores externos para que el evaluador ejecute las pruebas.

---

## 3. Requisitos Previos

* **Node.js**: Versión **22.5.0 o superior** (incluye soporte nativo para `node:sqlite`).
* **NPM**: Versión 10+ (incluido con Node.js).
* **Postman**: Para importar y ejecutar la colección y el entorno de pruebas incluidos en la carpeta `postman/`.

---

## 4. Instalación

1. Clonar el repositorio y entrar al directorio del proyecto:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd web
   ```
2. Instalar las dependencias de NPM (`express`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`):
   ```bash
   npm install
   ```

---

## 5. Variables de Entorno

El proyecto utiliza variables de entorno para configurar el puerto, la ruta de la base de datos, el secreto de firma JWT y los valores por defecto del script de inicialización.

> **Seguridad:** El archivo `.env` está excluido en `.gitignore` para no exponer secretos ni credenciales en el repositorio. Se incluye la plantilla `.env.example` sin secretos reales.

1. Crea tu archivo `.env` local copiando la plantilla `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(En Windows PowerShell: `Copy-Item .env.example .env`)*

2. Variables disponibles en `.env`:

| Variable | Descripción | Valor de ejemplo en `.env.example` |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP donde escucha Express | `3000` |
| `DB_PATH` | Ruta del archivo SQLite persistente | `./data/catalogo.db` |
| `JWT_SECRET` | Clave secreta para firmar y verificar los tokens JWT | `cambiar_este_secreto_en_produccion_123456` |
| `JWT_EXPIRES_IN` | Tiempo de validez del token JWT emitido en login | `2h` |
| `ADMIN_EMAIL` | Correo ficticio para inicializar la cuenta administradora | `admin@catalogo.com` |
| `ADMIN_PASSWORD` | Contraseña de prueba para inicializar el administrador local | `Admin123!` |
| `ADMIN_NAME` | Nombre visible del administrador inicial | `Administrador Principal` |

---

## 6. Inicialización de Datos y del Administrador

El registro público (`POST /api/auth/registro`) **jamás permite crear administradores** (ignora cualquier campo `rol` enviado por el cliente y asigna siempre `'usuario'`).

Para crear las tablas, el usuario **Administrador** y **6 productos ficticios de ejemplo** distribuidos en las categorías `Electronica`, `Hogar` y `Accesorios`, ejecuta el script de inicialización:

```bash
npm run seed
```

**¿Qué hace `npm run seed` (`scripts/seed.js`)?**
1. Crea las tablas `usuarios`, `productos` y `favoritos` si no existen.
2. Verifica si existe el usuario administrador definido en las variables de entorno locales (`ADMIN_EMAIL`); si no existe, hashea su contraseña con `bcryptjs` y lo inserta con `rol = 'admin'`.
3. Si el catálogo está vacío, inserta 6 productos ficticios con precios mayores que cero.

---

## 7. Comandos de Ejecución

| Comando | Propósito |
| :--- | :--- |
| `npm run seed` | Inicializa la base de datos con el usuario administrador y los productos de ejemplo. |
| `npm start` | Inicia el servidor en modo normal (`node src/server.js`). |
| `npm run dev` | Inicia el servidor en modo desarrollo con recarga automática (`node --watch src/server.js`). |
| `npm test` | Ejecuta la batería automatizada de pruebas reproducibles en consola (`node scripts/test-api.js`). |

---

## 8. Rutas de la API y Permisos

Todas las rutas están disponibles bajo el prefijo `/api` (y también directamente en la raíz `/`). Todas las respuestas se devuelven en formato JSON consistente.

### Tabla Resumen de Endpoints

| Método y Ruta | Acceso | Propósito | Códigos de Respuesta |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/registro` | Público | Registrar un usuario normal (`rol: "usuario"`). Nunca devuelve la contraseña ni su hash. | `201`, `400`, `409` |
| `POST /api/auth/login` | Público | Validar credenciales y emitir un JWT con vencimiento. | `200`, `400`, `401` |
| `GET /api/productos` | Público | Listar todos los productos o filtrar por categoría (`?categoria=Electronica`). | `200` |
| `GET /api/productos/:id` | Público | Consultar el detalle de un producto por su identificador. | `200`, `400`, `404` |
| `POST /api/productos` | Administrador | Crear un nuevo producto validando campos obligatorios y `precio > 0`. | `201`, `400`, `401`, `403` |
| `PUT /api/productos/:id` | Administrador | Actualizar un producto existente. | `200`, `400`, `401`, `403`, `404` |
| `DELETE /api/productos/:id` | Administrador | Eliminar un producto (y sus favoritos asociados en cascada). | `200`, `400`, `401`, `403`, `404` |
| `GET /api/favoritos` | Autenticado | Listar únicamente los favoritos del usuario dueño del token JWT. | `200`, `401` |
| `POST /api/favoritos` | Autenticado | Agregar un producto a los favoritos del usuario autenticado (`{ "productoId": 1 }`). | `201`, `400`, `401`, `404`, `409` |
| `DELETE /api/favoritos/:productoId` | Autenticado | Quitar un producto de los favoritos del usuario autenticado. | `200`, `400`, `401`, `404` |

### Criterio de Códigos de Estado HTTP
* **`200 OK`**: Consultas (`GET`), login exitoso, actualizaciones (`PUT`) y eliminaciones (`DELETE`) con mensaje JSON confirmatorio.
* **`201 Created`**: Creación exitosa de usuario, producto o favorito.
* **`400 Bad Request`**: Datos inválidos (campos obligatorios faltantes o vacíos, correo con formato inválido, contraseña menor a 6 caracteres, `precio <= 0` o no numérico, o IDs no enteros positivos).
* **`401 Unauthorized`**: Ausencia de token `Bearer`, token expirado, firma inválida o credenciales de login incorrectas.
* **`403 Forbidden`**: Usuario autenticado con rol `usuario` intentando crear, actualizar o eliminar productos.
* **`404 Not Found`**: Producto inexistente o favorito que no existe en la lista del usuario autenticado.
* **`409 Conflict`**: Correo electrónico ya registrado o producto ya presente en los favoritos del usuario.

---

## 9. Pasos para Ejecutar las Pruebas

El proyecto incluye dos formas complementarias y 100% reproducibles de ejecutar todas las pruebas obligatorias:

### Opción A: Colección de Postman (Pruebas Interactivas y Automatizadas)

En la carpeta `postman/` se encuentran:
* `postman/coleccion.postman_collection.json`: Colección con 23 peticiones organizadas en 4 carpetas y aserciones `pm.test` en cada petición.
* `postman/entorno.postman_environment.json`: Entorno de ejemplo **sin secretos ni tokens vigentes** (los tokens se generan y guardan automáticamente en las variables del entorno al ejecutar los endpoints de Login).

**Pasos en Postman:**
1. Inicia el servidor en tu terminal:
   ```bash
   npm run seed
   npm start
   ```
2. Abre Postman e importa los archivos `postman/coleccion.postman_collection.json` y `postman/entorno.postman_environment.json`.
3. Selecciona el entorno **"Entorno Local - API Catalogo y Favoritos"** en la esquina superior derecha de Postman.
4. Ejecuta la colección completa con **Collection Runner** o carpeta por carpeta en orden:
   * **Carpeta 1 (Autenticación y Registro):** Registra a los usuarios ficticios `Usuario A` y `Usuario B` (`201`), comprueba rechazo de correo duplicado (`409`), inicia sesión con `Usuario A`, `Usuario B` y `Admin` (`200`, guardando `token_usuarioA`, `token_usuarioB` y `token_admin` automáticamente) y verifica rechazo de credenciales inválidas (`401`).
   * **Carpeta 2 (Seguridad JWT y Control de Roles):** Verifica rechazo sin token (`401`), con token inválido/vencido (`401`) y modificación del catálogo con rol `usuario` (`403`).
   * **Carpeta 3 (Catálogo de Productos):** Verifica listado público (`200`), filtro `?categoria=Electronica` (`200`), creación/consulta/actualización/eliminación como Administrador (`201` / `200`), rechazo de precio negativo o campos vacíos (`400`) y consulta de producto inexistente (`404`).
   * **Carpeta 4 (Favoritos y Aislamiento A vs B):** `Usuario A` agrega el producto 1 (`201`), intenta duplicarlo (`409`), intenta agregar un producto inexistente (`404`). Luego `Usuario B` consulta sus favoritos (`200`, lista vacía: no ve los de A) e intenta borrar el favorito 1 (`404`). Se comprueba con `Usuario A` que su favorito permanece intacto (`200`) y finalmente lo elimina (`200`).
5. **Prueba de Persistencia tras Reinicio:**
   * Agrega un favorito o producto en Postman.
   * Detén el servidor en la terminal (`Ctrl + C`) y vuelve a iniciarlo (`npm start`).
   * Realiza nuevamente `GET /api/productos` y `GET /api/favoritos` en Postman para comprobar que todos los registros persisten en la base de datos SQLite.

### Opción B: Script Automatizado por Terminal (`npm test`)

Si deseas verificar todos los casos de prueba desde la línea de comandos en un solo paso:

```bash
npm test
```

Este comando levanta la aplicación sobre una base de datos limpia de verificación, ejecuta secuencialmente todas las aserciones (registro, duplicados, login, expiración real de JWT, bloqueo `403` por rol, CRUD de admin, validaciones `400`, filtro por categoría, aislamiento de favoritos entre Usuarios A y B, y borrado en cascada `ON DELETE CASCADE`) y muestra el reporte en consola.

---

## 10. Seguridad en Consultas, Recursos Citados y Verificación en Copia Limpia

### Prevención de Inyección y Limitación de Campos
* **Consultas SQL 100% parametrizadas:** En todos los modelos (`src/models/usuarioModel.js`, `src/models/productoModel.js`, `src/models/favoritoModel.js`) se utilizan sentencias preparadas (`db.prepare(...)`) con marcadores de posición `?`. Ningún dato enviado por el cliente se concatena jamás en cadenas SQL.
* **Limitación estricta de campos aceptados (Mass Assignment Protection):** En los controladores se desestructuran únicamente las propiedades permitidas (`{ nombre, correo, password }` en registro; `{ nombre, descripcion, categoria, precio }` en productos; `{ productoId }` en favoritos), ignorando cualquier campo extra como `rol: "admin"` o `usuarioId` en el cuerpo de la petición.

### Recursos y Herramientas de Apoyo Utilizadas
* **Documentación oficial de Node.js (`node:sqlite`):** Utilizada para configurar `DatabaseSync`, activar `PRAGMA foreign_keys = ON` y ejecutar sentencias preparadas síncronas.
* **Express.js (`v4.21`):** Framework HTTP utilizado para el enrutamiento modular (`express.Router()`), parseo de JSON (`express.json()`) y manejo centralizado de errores.
* **JSON Web Tokens (`jsonwebtoken`):** Librería empleada para firmar tokens con expiración (`jwt.sign`) y verificar integridad y vigencia (`jwt.verify`) en el middleware `verificarToken`.
* **BcryptJS (`bcryptjs`):** Utilizada para el hash unidireccional de contraseñas con sal (`bcrypt.hashSync(password, 10)`) y comparación segura (`bcrypt.compareSync`).
* **Postman:** Herramienta utilizada para diseñar y exportar la colección reproducible con scripts de prueba automatizados (`pm.test`).

### Verificación desde una Copia Limpia
Para comprobar la instalación desde cero tal como lo hará el evaluador:
```bash
git clone <URL_DEL_REPOSITORIO> copia-limpia
cd copia-limpia
cp .env.example .env
npm install
npm run seed
npm test
```

