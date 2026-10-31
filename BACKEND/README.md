# Contexto del backend

Guía de referencia para continuar el desarrollo del frontend del sistema de
Cuentas por Cobrar. Es un inventario del comportamiento implementado en
`src/`, no una especificación de funcionalidades planeadas. No se presupone el
DDL de las bases de datos: tipos, longitudes, nulabilidad, valores por defecto,
restricciones y relaciones físicas no se pueden deducir de los controladores.
Ante cualquier diferencia, el código de `src/` es la fuente de verdad.

## Resumen

- **Tecnología:** Node.js con módulos ES, Express 5 y JavaScript.
- **Prefijo de API:** `/api`.
- **Puerto:** `PORT`, con valor predeterminado `3000`.
- **Bases de datos:**
  - **Oracle (`CXC_ADMIN`):** clientes, facturas, pagos, notas, movimientos,
    estado de cuenta, reportes y auditoría.
  - **SQL Server (`CXC`):** usuarios, perfiles, menús y permisos; también
    valida permisos de acceso a los módulos.
- **Formato:** solicitudes JSON y respuestas JSON. Las consultas de Oracle
  devuelven normalmente objetos con nombres de columna en mayúsculas; las
  entradas JSON usan los nombres indicados en minúsculas.
- **Alcance:** solo están implementadas las rutas listadas en esta guía. Que
  una tabla exista o tenga columnas adicionales no implica que haya una API
  para consultarlas o modificarlas.
- **Inicio local:** desde `BACKEND`, ejecutar `npm install` y luego
  `npm run dev`. Para iniciar sin modo de observación, usar `npm start`.
- **Pruebas:** el script `npm test` actualmente no ejecuta pruebas.

## Configuración

Crear `BACKEND/.env` con las variables que consume el servidor:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP; opcional, predeterminado `3000`. |
| `JWT_SECRET` | Secreto para firmar y validar los tokens JWT en el backend; no se envía al frontend. |
| `SQL_USER` | Usuario de SQL Server. |
| `SQL_PASSWORD` | Contraseña de SQL Server. |
| `SQL_SERVER` | Host o dirección del servidor SQL Server. |
| `SQL_DATABASE` | Base de datos SQL Server. |
| `ORACLE_USER` | Usuario de Oracle. |
| `ORACLE_PASSWORD` | Contraseña de Oracle. |
| `ORACLE_CONNECTION_STRING` | Cadena de conexión Oracle. |

No se deben incluir credenciales reales en el frontend ni en el repositorio.
`BACKEND/.env.example` está vacío actualmente; las variables de la tabla se
identifican a partir de las lecturas que hace el código.

El servidor habilita CORS sin restringir orígenes y parsea cuerpos JSON con
`express.json()`. El frontend puede llamar directamente a la URL del backend;
no hay un proxy configurado en este proyecto backend.

SQL Server usa el pool compartido de `mssql`; las operaciones Oracle abren y
cierran su conexión durante cada solicitud.
La configuración del cliente SQL Server usa `encrypt: true` y
`trustServerCertificate: true`. El backend no define configuración específica
de CORS por origen, manejo de cookies o sesión de navegador.

El backend no contiene migraciones ni definiciones DDL de las tablas. La
documentación enumera las columnas que cada consulta consume o devuelve, pero
no define sus tipos SQL ni garantiza que una columna permita `NULL`.

Dependencias directas declaradas en `package.json`: `express`, `cors`,
`dotenv`, `jsonwebtoken`, `bcrypt`, `mssql` y `oracledb`. `bcrypt` está
instalado, pero no se usa en los controladores actuales.

### Objetos de base de datos referenciados por el código

Estos son los nombres que aparecen en las consultas actuales, no un inventario
de todo lo que exista en las bases de datos:

| Base/esquema | Objetos referenciados |
|---|---|
| Oracle `CXC_ADMIN` | `CLIENTES`, `FACTURAS`, `FACTURAS_DETALLE`, `PAGOS`, `METODOS_PAGO`, `ESTADO_CUENTA`, `NOTAS_CREDITO`, `NOTAS_ABONO`, `ENTRADAS`, `SALIDAS`, `RECIBOS_AUTORIZADOS`, `AUD_CLIENTES`, `AUD_FACTURAS`. |
| SQL Server `CXC` | `USUARIOS`, `PERFILES`, `MENUS`, `PERFILES_MENUS`. |

## Autenticación y autorización

### Inicio de sesión

`POST /api/auth/login` es público.

Solicitud:

```json
{
  "usuario": "usuario",
  "password": "contraseña"
}
```

Respuesta exitosa (`200`):

```json
{
  "message": "Inicio de sesión exitoso",
  "token": "<jwt>",
  "user": {
    "id": 1,
    "nombre": "Nombre Apellido",
    "usuario": "usuario",
    "perfil": "Nombre del perfil"
  }
}
```

El token dura **8 horas**. Se obtiene el perfil desde SQL Server. La
implementación actual compara la contraseña recibida directamente con el valor
almacenado en `PASSWORD_HASH`; aunque `bcrypt` es una dependencia instalada, no
se utiliza en este flujo.

El login considera activo al usuario si `ESTADO` es exactamente `true`, `1`,
`'1'` o `'Activo'` según el valor retornado por SQL Server. No hay un endpoint
de registro, cambio de contraseña ni cierre/invalidez de sesión.
La consulta usa `LEFT JOIN` hacia perfiles; si la relación no tiene perfil, el
token y el objeto de login pueden contener `perfil: null`.

`JWT_SECRET` debe definirse para que los tokens puedan validarse: el inicio de
sesión tiene un secreto alternativo para firmar si la variable falta, pero el
middleware de autenticación valida usando `JWT_SECRET` directamente.

### Envío del token y sesión actual

El middleware lee `Authorization` y toma el segundo segmento separado por
espacios; para las rutas protegidas, enviar el esquema `Bearer` seguido del
JWT:

```http
Authorization: Bearer <JWT>
```

El middleware no comprueba que el primer segmento sea literalmente `Bearer`;
extrae el segundo segmento y verifica ese valor como JWT.

`GET /api/auth/me` requiere token y responde:

```json
{
  "user": {
    "id": "<ID_USUARIO>",
    "usuario": "<USUARIO>",
    "perfil": "<NOMBRE_PERFIL>",
    "iat": "<emitido_en>",
    "exp": "<expira_en>"
  }
}
```

Los marcadores entre `< >` describen valores dinámicos, no valores literales ni
tipos garantizados. `iat` y `exp` son marcas de tiempo agregadas por JWT.
Esta respuesta es el contenido decodificado del token, no el objeto `user` del
endpoint de login.

Respuestas de autenticación observadas:

| HTTP | Condición | JSON |
|---|---|---|
| `200` | Credenciales aceptadas | `message`, `token`, `user` (`id`, `nombre`, `usuario`, `perfil`). |
| `401` | Usuario no encontrado o contraseña distinta | `{ "message": "Usuario no encontrado" }` o `{ "message": "Contraseña incorrecta" }`. |
| `403` | El usuario no supera la condición de activo | `{ "message": "Usuario inactivo" }`. |
| `403` | Falta encabezado o no se extrae el token | `{ "message": "No se proporcionó un token de seguridad" }` o `{ "message": "Formato de token inválido" }`. |
| `401` | Falló la verificación JWT | `{ "message": "Token inválido o expirado" }`. |
| `500` | Excepción de login o de `/me` | Objeto `{ "message": "..." }`. |

### Permisos por perfil

Las rutas de negocio requieren tanto un token válido como el permiso del perfil
en SQL Server. La comprobación relaciona `CXC.PERFILES`,
`CXC.PERFILES_MENUS` y `CXC.MENUS`. Los permisos posibles son `PUEDE_VER`,
`PUEDE_CREAR`, `PUEDE_EDITAR` y `PUEDE_ELIMINAR`.

El middleware consulta el permiso en cada solicitud y concede acceso solo si la
columna consultada vale numéricamente `1` o booleano `true`. Si no hay fila de
permisos configurada, responde `403` indicando perfil y módulo. Si hay fila
pero el flag no está concedido, responde `403` indicando operación. Un error
consultando SQL Server devuelve `500`. No se devuelve un endpoint separado para
volver a consultar los datos del usuario al autorizar: el perfil usado para el
permiso se toma de la claim `perfil` del JWT. `/api/auth/me` solo devuelve esas
claims decodificadas.

Los mensajes de rechazo de autorización son `No se encontraron permisos
configurados para el perfil <perfil> en el módulo <menú>` y `Acceso denegado:
El perfil <perfil> carece de permiso para '<operación>' en el módulo <menú>`.

Los nombres de menú se comparan literalmente; deben coincidir con `NOMBRE_MENU`
en SQL Server:

| Módulo/rutas | Nombre de menú requerido |
|---|---|
| Clientes | `Clientes` |
| Facturas | `Facturas` |
| Pagos | `Pagos` |
| Cuentas por cobrar | `Cuentas por cobrar` |
| Notas de crédito | `Notas de credito` |
| Notas de abono | `Notas de abono` |
| Dashboard | `Inicio` |
| Movimientos y auditoría | `Reportes` |
| Usuarios | `Usuarios` |
| Seguridad | `Seguridad` |
| Reporte de cartera | `Reportes` |

## Convenciones de la API

- Las rutas con `:id` esperan el identificador en la URL.
- No hay paginación ni filtros de listado implementados; los listados devuelven
  todos los registros que consulta cada endpoint.
- Los `SELECT` de Oracle usan `OUT_FORMAT_OBJECT`: las claves suelen estar en
  mayúsculas tal como aparecen en las tablas o alias SQL. SQL Server también
  devuelve nombres de columna en mayúsculas.
- Los cuerpos de escritura usan las claves minúsculas documentadas en cada
  endpoint.
- Se recomienda enviar fechas como `YYYY-MM-DD` y cantidades como números JSON.
- Los endpoints no aplican una validación general de esquema a los cuerpos.
  Respetar los campos requeridos y las reglas de negocio documentadas.
- Las tablas de contratos indican las propiedades que el código lee o devuelve;
  no garantizan tipo, nulabilidad ni requerimientos de base de datos. El backend
  no valida sistemáticamente que estén presentes ni convierte todos los
  identificadores a un tipo específico.
- Los controladores actuales no leen parámetros de consulta. Enviar `page`,
  `limit`, filtros u otros query params no activa paginación ni filtrado.
- Salvo que se indique lo contrario, los errores de base de datos devuelven
  `500` con un objeto `{ "message": "..." }`.

### Alcance de los contratos

- Los ejemplos JSON son ilustrativos. Los IDs y valores no representan datos
  garantizados en las bases de datos.
- No se documentan tipos SQL porque el repositorio no contiene el esquema.
- Los endpoints de listado que devuelven directamente filas pueden responder
  `[]` sin registros. Las consultas de detalle identificadas en esta guía
  responden `404` cuando el controlador comprueba que no hay registro.
- Las respuestas de lectura enviadas con `res.json(...)` usan `200` por
  defecto; las creaciones documentadas usan `201`.
- Las respuestas de escritura no incluyen automáticamente el registro creado
  o actualizado. Usa solo el mensaje o ID que indique cada endpoint.
- El orden solo está garantizado cuando se especifica un `ORDER BY` en la
  consulta de ese endpoint.
- El controlador de clientes confirma cada inserción/actualización con
  `autoCommit`. Crear factura, pago y notas ejecuta las escrituras relacionadas
  dentro de una transacción Oracle y hace `commit`; al capturar un error intenta
  `rollback`.

### Rutas públicas y ausencia de endpoints

Solo `GET /api/health` y `POST /api/auth/login` son públicos. `GET
/api/auth/me` requiere JWT, pero no consulta un permiso de menú. Todas las
demás rutas enumeradas exigen JWT y permiso. No están implementados endpoints
de logout, alta de usuario, cambio de contraseña, administración de perfiles o
permisos, mantenimiento de métodos de pago, edición/eliminación de facturas,
pagos o notas, ni borrado físico de clientes.

## Endpoints

### Salud y conexión

| Método y ruta | Acceso | Comportamiento y respuesta |
|---|---|---|
| `GET /api/health` | Público | Solicita una conexión al pool de SQL Server y abre/cierra una conexión de Oracle. En éxito devuelve `{ "status": "success", "message": "Conexión exitosa a SQL Server (Seguridad) y Oracle (Finanzas)" }`. En excepción devuelve `500` y `{ "status": "error", "message": "Fallo al conectar con las bases de datos", "error": "<mensaje de excepción>" }`. No consulta tablas ni valida funcionalidades de cada módulo. |

### Clientes

Prefijo: `/api/clientes`.

| Método y ruta | Permiso | Solicitud / respuesta |
|---|---|---|
| `GET /` | `PUEDE_VER` | Lista de clientes: `ID_CLIENTE`, `NOMBRE`, `APELLIDO`, `NIT`, `TELEFONO`, `CORREO`, `DIRECCION`, `DIAS_CREDITO`, `ESTADO`. |
| `GET /:id` | `PUEDE_VER` | Un cliente con los mismos campos; `404` si no existe. |
| `POST /` | `PUEDE_CREAR` | Lee `nombre`, `apellido`, `nit`, `telefono`, `correo`, `direccion`, `dias_credito`; inserta esos valores y fuerza `ESTADO = 'Activo'`. `201`: `{ "message": "Cliente registrado exitosamente" }`. |
| `PUT /:id` | `PUEDE_EDITAR` | Lee `nombre`, `apellido`, `nit`, `telefono`, `correo`, `direccion`, `dias_credito`, `estado` y el `id` de URL; asigna esas columnas. `200`: `{ "message": "Cliente actualizado exitosamente" }`; `404`: `{ "message": "Cliente no encontrado o no hubo cambios" }`. |
| `PATCH /:id/estado` | `PUEDE_ELIMINAR` | No lee body; actualiza `ESTADO` a `Inactivo`, no elimina. `200`: `{ "message": "Cliente desactivado exitosamente" }`; `404`: `{ "message": "Cliente no encontrado" }`. |

El listado no filtra por estado y no tiene orden explícito. El `PUT` asigna
todos los campos que lee, no es una actualización parcial: no enviar una
propiedad puede hacer que se intente escribir un valor ausente. El backend no
ofrece un endpoint para reactivar clientes.

### Facturas

Prefijo: `/api/facturas`.

| Método y ruta | Permiso | Solicitud / respuesta |
|---|---|---|
| `GET /` | `PUEDE_VER` | Lista ordenada por `ID_FACTURA DESC`. Selecciona `ID_FACTURA`, `NUMERO_FACTURA`, `SERIE_FACTURA`, `FECHA_EMISION`, `TOTAL`, `SALDO_PENDIENTE`, `ESTADO`, y `NOMBRE`/`APELLIDO` del cliente. Usa `JOIN` interno con clientes; no limita estados ni filas. |
| `GET /:id` | `PUEDE_VER` | Busca por `ID_FACTURA`; devuelve todas las columnas seleccionadas con `SELECT *` de la cabecera y añade `detalles`, que contiene las filas completas de `FACTURAS_DETALLE` para ese ID. `404`: `{ "message": "Factura no encontrada" }`. |
| `POST /` | `PUEDE_CREAR` | Body descrito abajo. Registra cabecera y líneas en una transacción; responde `201` con `message` e `id_factura`. |

Claves leídas del body para crear una factura (todas se envían en JSON):

```json
{
  "id_cliente": "<ID_CLIENTE>",
  "numero_factura": "<NUMERO_FACTURA>",
  "serie_factura": "<SERIE_FACTURA>",
  "fecha_emision": "<fecha aceptada por Date de JavaScript>",
  "fecha_vencimiento": "<fecha aceptada por Date de JavaScript>",
  "subtotal": "<SUBTOTAL>",
  "total": "<TOTAL>",
  "saldo_pendiente": "<SALDO_PENDIENTE inicial>",
  "detalles": [
    {
      "descripcion": "<DESCRIPCION>",
      "cantidad": "<CANTIDAD>",
      "precio_unitario": "<PRECIO_UNITARIO>",
      "subtotal": "<subtotal de la línea>"
    }
  ]
}
```

`fecha_emision` y `fecha_vencimiento` se pasan por `new Date(...)` antes de
enviarlas a Oracle. `detalles` debe ser iterable para que el bucle pueda
insertar una fila por elemento; no hay una validación previa de que tenga
elementos. El backend no calcula `subtotal`, `total`, saldo ni valores de las
líneas. Inserta la factura con `ESTADO = 'Emitida'`.

La respuesta exitosa (`201`) es:

```json
{
  "message": "Factura registrada exitosamente",
  "id_factura": 1
}
```

Si falla la cabecera o cualquier detalle, se revierte la transacción. Error
de inserción (`500`): `{ "message": "Error al registrar la factura, transacción revertida" }`.
No hay endpoint `PUT`, `PATCH` o `DELETE` de factura.

### Pagos

Prefijo: `/api/pagos`.

| Método y ruta | Permiso | Solicitud / respuesta |
|---|---|---|
| `GET /` | `PUEDE_VER` | Lista ordenada por `ID_PAGO DESC`. Selecciona `ID_PAGO`, `MONTO`, `FECHA_PAGO`, `REFERENCIA`, `ESTADO`, `NUMERO_FACTURA`, `NOMBRE_METODO`, y `NOMBRE AS CLIENTE`. Usa joins internos con factura, cliente y método de pago. |
| `POST /` | `PUEDE_CREAR` | Lee `id_factura`, `id_metodo_pago`, `monto`, `referencia`. `201`: `{ "message": "Pago registrado y saldo actualizado exitosamente", "nuevo_saldo_factura": "<saldo calculado>" }`. |

El monto debe ser mayor que cero y no superar el saldo pendiente. La operación
actualiza el pago, el saldo y el estado de la factura, y registra el movimiento
del estado de cuenta en una única transacción. Puede responder `400` por monto
inválido o superior al saldo y `404` si no existe la factura.

El endpoint guarda `FECHA_PAGO = SYSDATE`, `ESTADO = 'Aplicado'` y registra
`TIPO_MOVIMIENTO = 'Pago/Abono'`. El estado asignado a la factura es `Pagada`
cuando el nuevo saldo es exactamente cero; de lo contrario, `Abono parcial`.
El bloqueo `FOR UPDATE` protege la fila de factura durante la aplicación. La
validación explícita de monto es `monto <= 0`; no existe validación de
presencia, formato numérico o precisión antes de llegar a Oracle.

### Cuentas por cobrar

Prefijo: `/api/cuentas-cobrar`. Todos los endpoints requieren `PUEDE_VER` del
menú `Cuentas por cobrar`.

| Método y ruta | Respuesta |
|---|---|
| `GET /pendientes` | Solo `SALDO_PENDIENTE > 0`, ordenado por `FECHA_VENCIMIENTO ASC`. Devuelve `ID_FACTURA`, `NUMERO_FACTURA`, `NOMBRE`, `APELLIDO`, `FECHA_EMISION`, `FECHA_VENCIMIENTO`, `TOTAL`, `SALDO_PENDIENTE`, y `DIAS_ATRASO = TRUNC(SYSDATE) - TRUNC(FECHA_VENCIMIENTO)`. Este cálculo también puede ser negativo antes del vencimiento. |
| `GET /antiguedad` | Solo saldos positivos; una fila por cliente, ordenada por `SALDO_TOTAL DESC`. Devuelve `ID_CLIENTE`, `NOMBRE`, `APELLIDO`, `SALDO_TOTAL`, `DIAS_1_30`, `DIAS_31_60`, `DIAS_61_90`, `MAS_DE_90`. Tramos: `<= 30`, `31–60`, `61–90`, `> 90` días desde vencimiento; el primer tramo también puede incluir facturas aún no vencidas. |
| `GET /estado-cuenta/:id_cliente` | Historial unido a facturas del `ID_CLIENTE`; orden `FECHA_MOVIMIENTO DESC, ID_ESTADO_CUENTA DESC`. Devuelve `ID_ESTADO_CUENTA`, `NUMERO_FACTURA`, `FECHA_MOVIMIENTO`, `TIPO_MOVIMIENTO`, `MONTO`, `SALDO`, `DESCRIPCION`. No devuelve filas sin factura asociada. |

### Notas de crédito y de abono

Prefijo: `/api/notas`.

| Método y ruta | Permiso | Solicitud / respuesta |
|---|---|---|
| `GET /credito` | `PUEDE_VER` en `Notas de credito` | Orden `ID_NC DESC`. Devuelve `ID_NC`, `FECHA`, `DESCRIPCION`, `MONTO`, `ESTADO`, `NUMERO_FACTURA`, `NOMBRE`, `APELLIDO` desde joins de notas, factura y cliente. |
| `POST /credito` | `PUEDE_CREAR` en `Notas de credito` | Lee `id_factura`, `id_cliente`, `descripcion`, `monto`. `201`: `{ "message": "Nota de crédito registrada y saldo actualizado exitosamente" }`. |
| `GET /abono` | `PUEDE_VER` en `Notas de abono` | Orden `FECHA DESC`. Devuelve `ID_NA`, `NUMERO_NA`, `FECHA`, `DESCRIPCION`, `MONTO`, `ESTADO`, `NUMERO_FACTURA`, `NOMBRE`, `APELLIDO`. |
| `POST /abono` | `PUEDE_CREAR` en `Notas de abono` | Lee `id_factura`, `id_cliente`, `numero_na`, `descripcion`, `monto`. `201`: `{ "message": "Nota de abono registrada exitosamente" }`. |

Ambos tipos requieren un monto mayor que cero y no superior al saldo de la
factura. Reducen el saldo y agregan un movimiento al estado de cuenta en una
transacción. Las creaciones pueden responder `400` por monto inválido o mayor
que el saldo y `404` si no existe la factura.

Ambas escrituras asignan `FECHA = SYSDATE` y `ESTADO = 'Aplicada'` a la nota.
La nota de crédito usa estado de factura `Pagada por Nota` si el saldo queda
exactamente en cero, o `Ajuste parcial` si no. La nota de abono usa
`Pagada por Abono` o `Abono parcial`, respectivamente. Los movimientos quedan
con tipo `Nota de Crédito` o `Nota de Abono`. El backend verifica que exista la
factura y que `monto` no exceda su saldo, pero no verifica que el `id_cliente`
del body sea el mismo cliente asociado a `id_factura`. No hay endpoint para
editar o eliminar notas.

### Dashboard

Prefijo: `/api/dashboard`. Requiere `PUEDE_VER` en el menú `Inicio`.

| Método y ruta | Respuesta |
|---|---|
| `GET /` | Objeto KPI: `total_clientes`, `total_facturado`, `saldo_pendiente`, `total_pagado`, `facturas_vencidas`. Calcula clientes `Activo`, sumas de facturas, pagos `Aplicado` y facturas con saldo positivo vencidas. |

El controlador no usa `OUT_FORMAT_OBJECT`; toma valores de filas por posición y
proyecta las cinco claves minúsculas anteriores. La suma de facturado y saldo
considera todas las facturas, sin filtro de estado.

### Movimientos y recibos

Prefijo: `/api/movimientos`. Ambos endpoints requieren `PUEDE_VER` en
`Reportes`.

| Método y ruta | Respuesta |
|---|---|
| `GET /historial` | `UNION ALL` de entradas y salidas, ordenado por `FECHA DESC`. Columnas: `TIPO` (literal `ENTRADA` o `SALIDA`), `ID_MOVIMIENTO`, `FECHA`, `DESCRIPCION`, `MONTO`, `ESTADO`. No se deduplican registros. |
| `GET /recibos` | Recibos autorizados unidos a facturas, orden `FECHA_EMISION DESC`. Columnas: `ID_RECIBO`, `NUMERO_RECIBO`, `FECHA_EMISION`, `IMPORTE`, `ESTADO`, `NUMERO_FACTURA`. |

### Auditoría

Prefijo: `/api/auditoria`. Ambos endpoints requieren `PUEDE_VER` en
`Reportes`.

| Método y ruta | Respuesta |
|---|---|
| `GET /clientes` | Orden `FECHA_CAMBIO DESC`. Columnas: `ID_AUDITORIA`, `ID_CLIENTE`, `OPERACION`, `USUARIO_BD`, `FECHA_CAMBIO`, `NOMBRE_ANTERIOR`, `NOMBRE_NUEVO`, `ESTADO_ANTERIOR`, `ESTADO_NUEVO`. |
| `GET /facturas` | Orden `FECHA_CAMBIO DESC`. Columnas: `ID_AUDITORIA`, `ID_FACTURA`, `OPERACION`, `USUARIO_BD`, `FECHA_CAMBIO`, `TOTAL_ANTERIOR`, `TOTAL_NUEVO`, `ESTADO_ANTERIOR`, `ESTADO_NUEVO`. |

### Usuarios y seguridad

Estos endpoints son de consulta; no hay rutas de creación o edición de usuarios,
perfiles o permisos implementadas actualmente.

| Método y ruta | Permiso | Respuesta |
|---|---|---|
| `GET /api/usuarios` | `PUEDE_VER` en `Usuarios` | Orden `ID_USUARIO`. Columnas: `ID_USUARIO`, `NOMBRE`, `APELLIDO`, `USUARIO`, `CORREO`, `ESTADO`, `FECHA_CREACION`, `NOMBRE_PERFIL`. Usa `LEFT JOIN` con perfil. |
| `GET /api/seguridad/perfiles` | `PUEDE_VER` en `Seguridad` | Orden `ID_PERFIL`. Columnas: `ID_PERFIL`, `NOMBRE_PERFIL`, `DESCRIPCION`, `ESTADO`, `FECHA_CREACION`. |
| `GET /api/seguridad/permisos` | `PUEDE_VER` en `Seguridad` | Orden `NOMBRE_PERFIL`, `M.ORDEN`. Columnas: `NOMBRE_PERFIL`, `NOMBRE_MENU`, `PUEDE_VER`, `PUEDE_CREAR`, `PUEDE_EDITAR`, `PUEDE_ELIMINAR`; usa joins internos a perfil y menú. |

### Reporte de cartera

Prefijo: `/api/reportes`. Requiere `PUEDE_VER` en `Reportes`.

| Método y ruta | Respuesta |
|---|---|
| `GET /cartera` | Orden `SALDO_PENDIENTE DESC, FECHA_VENCIMIENTO ASC`. Columnas: `NIT`, `CLIENTE` (nombre y apellido concatenados), `NUMERO_FACTURA`, `SERIE_FACTURA`, `FECHA_EMISION`, `FECHA_VENCIMIENTO`, `TOTAL`, `SALDO_PENDIENTE`, `ESTADO`, `DIAS_ATRASO`. Las fechas se convierten a texto `YYYY-MM-DD`. `DIAS_ATRASO` es `0` con saldo cero o si no está vencida; si tiene saldo y venció, es la diferencia en días. Incluye facturas con saldo cero. |

## Errores que debe contemplar el frontend

| HTTP | Casos representativos | Forma usual |
|---|---|---|
| `400` | Monto no positivo | Pago: `{ "message": "El monto del pago debe ser mayor a cero" }`; nota: `{ "message": "El monto debe ser mayor a cero" }`. |
| `400` | Monto supera el saldo | Pago: `El pago (<monto>) supera el saldo pendiente de la factura (<saldo>)`; nota: `La nota (<monto>) supera el saldo pendiente (<saldo>)`. Ambos en `{ "message": "..." }`. |
| `401` | Credenciales rechazadas o token inválido/vencido | `{ "message": "Usuario no encontrado" }`, `{ "message": "Contraseña incorrecta" }` o `{ "message": "Token inválido o expirado" }`. |
| `403` | Usuario inactivo, token faltante/mal formado, o permiso no concedido | `{ "message": "Usuario inactivo" }`, mensaje de token o mensaje de permiso. |
| `404` | Cliente o factura no encontrados | `{ "message": "Cliente no encontrado" }`, `{ "message": "Factura no encontrada" }`; actualizar cliente también devuelve `Cliente no encontrado o no hubo cambios`. |
| `500` | Fallo de consulta, conexión o transacción | `{ "message": "..." }`; `/api/health` además devuelve `status` y `error` |

Conviene mostrar el `message` recibido y redirigir a inicio de sesión cuando una
respuesta protegida indique token inválido o vencido. No asumir que todas las
respuestas exitosas tienen el mismo envoltorio: los listados suelen ser arrays
directos, los detalles un objeto, y varias escrituras un objeto con `message`.

Los `500` no comparten un texto único: cada controlador define su propio
`message`, por ejemplo `Error al consultar facturas`,
`Error al registrar la factura, transacción revertida` o
`Error interno al validar autorización`. No existe middleware global que
normalice errores. Tampoco hay un handler JSON propio para rutas inexistentes;
una URL no registrada queda al manejo predeterminado de Express. Las respuestas
de errores del parser JSON también pueden seguir el manejo de Express en vez de
los objetos `message` de los controladores.

## Flujo sugerido para conectar el frontend

1. Configurar la URL base del backend (por ejemplo, `http://localhost:3000/api`
   en desarrollo).
2. Al iniciar sesión, enviar `usuario` y `password` a `/auth/login` y conservar
   el `token` y el objeto `user`.
3. En solicitudes protegidas, enviar el token JWT en el encabezado
   `Authorization` con esquema `Bearer`. Para solicitudes con cuerpo JSON,
   enviar también `Content-Type: application/json`.
4. Consultar `/auth/me` para validar la sesión actual.
5. Consultar los recursos necesarios; representar los permisos y las acciones
   según el perfil, recordando que el backend también los valida.
6. Al registrar pagos o notas, actualizar en pantalla el saldo devuelto o volver
   a consultar la factura/estado de cuenta.
7. Gestionar por separado arrays, objetos y respuestas `{ message }`, y tratar
   explícitamente los estados HTTP de error.

## Organización del código

```text
src/
  app.js                  Configuración Express, CORS, rutas y /api/health
  config/
    oracle.js             Conexión Oracle
    sqlserver.js          Conexión SQL Server
  controllers/            Implementación SQL/reglas y respuestas HTTP
  middleware/
    auth.middleware.js    Validación JWT
    permisos.middleware.js Consulta de permisos en SQL Server
  routes/                 Paths, métodos y middlewares por endpoint
```

No hay carpetas de modelos, servicios, validadores, migraciones o pruebas
automatizadas en el backend actual. La lógica SQL y de negocio está en los
controladores; el montaje de rutas está en `app.js`.
