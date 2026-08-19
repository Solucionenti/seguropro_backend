

#### RF-ASEG-01 Listar Aseguradoras

**Descripción:**  
Permite a usuarios con rol OWNER o AGENT visualizar el catálogo de Aseguradoras registradas dentro de su Empresa.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Usuario con `status = ACTIVE` y `active = true`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario accede al módulo “Aseguradoras”.
2. El sistema consulta la entidad Aseguradora filtrando:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. El sistema muestra listado con:
   - nombre
   - descripcion
   - createdAt
4. Permitir búsqueda por nombre.
5. Permitir paginación y ordenamiento.

**Reglas:**
- No se muestran Aseguradoras de otras Empresas.
- Acceso solo lectura desde este flujo.

---

#### RF-ASEG-02 Crear Aseguradora

**Descripción:**  
Permite a usuarios con rol OWNER o AGENT registrar una nueva Aseguradora dentro de su Empresa.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario selecciona “Crear Aseguradora”.
2. Captura:
   - nombre
   - descripcion (opcional)
3. El sistema valida:
   - Nombre no vacío.
   - Restricción recomendada: UNIQUE (empresaId, nombre).
4. El sistema crea el registro con:
   - `empresaId = usuario.empresaId`
   - `active = true`
5. Se registra auditoría.

**Flujos alternos / errores:**
- A1: Nombre duplicado en la Empresa  
  - Rechazar operación.

**Reglas:**
- La Aseguradora creada queda disponible para asociarse a Pólizas.
- No existe catálogo global compartido.

---

#### RF-ASEG-03 Ver detalle de Aseguradora

**Descripción:**  
Permite a usuarios con rol OWNER o AGENT consultar la información completa de una Aseguradora.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- La Aseguradora pertenece a la misma Empresa.

**Flujo principal:**
1. El usuario selecciona una Aseguradora del listado.
2. El sistema muestra:
   - nombre
   - descripcion
   - createdAt
   - updatedAt
   - active

**Reglas:**
- Validación obligatoria de coherencia `empresaId`.
- No se permiten modificaciones desde este flujo.

---

#### RF-ASEG-04 Editar Aseguradora

**Descripción:**  
Permite a usuarios con rol OWNER o AGENT modificar la información de una Aseguradora.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Aseguradora activa (`active = true`).
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario accede a “Editar Aseguradora”.
2. Modifica campos permitidos:
   - nombre
   - descripcion
3. El sistema valida:
   - Restricción recomendada: UNIQUE (empresaId, nombre).
4. El sistema guarda cambios y actualiza `updatedAt`.
5. Se registra auditoría.

**Reglas:**
- No se permite cambiar `empresaId`.
- Si la Aseguradora tiene pólizas asociadas, la edición solo afecta campos informativos (no rompe relaciones).

---

#### RF-ASEG-05 Eliminar (Desactivar) Aseguradora

**Descripción:**  
Permite a usuarios con rol OWNER o AGENT desactivar una Aseguradora mediante eliminación lógica.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- La Aseguradora pertenece a la misma Empresa.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- Si existen Pólizas asociadas:
  - No se eliminan ni modifican.
  - La Aseguradora queda histórica.
- Una Aseguradora inactiva no puede usarse para crear nuevas Pólizas.

___

#### RF-POL-01 Listar Pólizas

**Descripción:**  
Permite listar las Pólizas registradas dentro de la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar todas las pólizas de la Empresa.
- AGENT → Puede listar todas las pólizas de la Empresa.
- CLIENT → Solo puede listar sus propias pólizas (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Pólizas”.
2. El sistema filtra por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Filtro adicional:
   - Si CLIENT → `clienteUserId = usuario.id`
4. Mostrar:
   - numeroPoliza
   - ramo
   - aseguradora
   - cliente
   - fechaInicio
   - fechaVencimiento
   - status

**Reglas:**
- No se permite visualizar pólizas de otras Empresas.
- CLIENT solo ve sus pólizas.

___

#### RF-POL-01 Listar Pólizas

**Descripción:**  
Permite listar las Pólizas registradas dentro de la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar todas las pólizas de la Empresa.
- AGENT → Puede listar todas las pólizas de la Empresa.
- CLIENT → Solo puede listar sus propias pólizas (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Pólizas”.
2. El sistema filtra por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Filtro adicional:
   - Si CLIENT → `clienteUserId = usuario.id`
4. Mostrar:
   - numeroPoliza
   - ramo
   - aseguradora
   - cliente
   - fechaInicio
   - fechaVencimiento
   - status

**Reglas:**
- No se permite visualizar pólizas de otras Empresas.
- CLIENT solo ve sus pólizas.

___

#### RF-POL-01 Listar Pólizas

**Descripción:**  
Permite listar las Pólizas registradas dentro de la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar todas las pólizas de la Empresa.
- AGENT → Puede listar todas las pólizas de la Empresa.
- CLIENT → Solo puede listar sus propias pólizas (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Pólizas”.
2. El sistema filtra por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Filtro adicional:
   - Si CLIENT → `clienteUserId = usuario.id`
4. Mostrar:
   - numeroPoliza
   - ramo
   - aseguradora
   - cliente
   - fechaInicio
   - fechaVencimiento
   - status

**Reglas:**
- No se permite visualizar pólizas de otras Empresas.
- CLIENT solo ve sus pólizas.

___

#### RF-POL-04 Editar Póliza

**Descripción:**  
Permite modificar información de una Póliza.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Póliza activa.
- Empresa con Suscripción activa.

**Flujo principal:**
1. Acceso a “Editar”.
2. Puede modificar:
   - primaNeta
   - primaTotal
   - fechaVencimiento
   - status
3. Validaciones:
   - fechaVencimiento ≥ fechaInicio.
   - coherencia multi-tenant.
4. Guardar cambios.
5. Actualizar `updatedAt`.
6. Registrar auditoría.

**Reglas:**
- No se puede cambiar empresaId.
- No se puede cambiar clienteUserId si rompe coherencia histórica (opcional según política).
- CLIENT no puede editar.

___

#### RF-POL-05 Eliminar (Desactivar) Póliza

**Descripción:**  
Permite desactivar una Póliza mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Póliza pertenece a la Empresa.

**Flujo principal:**
1. Selección de “Desactivar”.
2. Confirmación.
3. Actualizar:
   - active = false
4. Registrar auditoría.

**Reglas:**
- No eliminación física.
- Si existen Siniestros asociados:
  - No se deben eliminar.
  - Se conserva trazabilidad histórica.
- CLIENT no puede desactivar pólizas.

___

#### RF-ARCH-01 Listar Archivos de Póliza

**Descripción:**  
Permite listar los archivos asociados a una Póliza.

**Roles y Alcance:**
- OWNER → Puede listar archivos de cualquier póliza de su Empresa.
- AGENT → Puede listar archivos de cualquier póliza de su Empresa.
- CLIENT → Solo puede listar archivos de sus pólizas (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- La Póliza pertenece a la misma Empresa.
- Si es CLIENT: `poliza.clienteUserId = usuario.id`.

**Flujo principal:**
1. El usuario accede al detalle de una Póliza y abre la sección “Archivos”.
2. El sistema consulta la entidad Archivo filtrando:
   - `polizaId = <id>`
   - `active = true`
3. El sistema muestra:
   - id
   - mimeType
   - url
   - createdAt

**Reglas:**
- Validación estricta multi-tenant (la póliza debe pertenecer a la Empresa del usuario).
- No se listan archivos inactivos salvo perfil autorizado (opcional).

---

#### RF-ARCH-02 Cargar (Crear) Archivo de Póliza

**Descripción:**  
Permite cargar un archivo asociado a una Póliza. El sistema almacena únicamente metadatos y la URL del archivo.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa.
- La Póliza pertenece a la misma Empresa.
- No exceder el límite de almacenamiento del Plan (si aplica).

**Flujo principal:**
1. El usuario selecciona “Cargar Archivo”.
2. El usuario adjunta el archivo.
3. El sistema valida:
   - `mimeType` permitido.
   - Tamaño máximo permitido (si aplica).
4. El sistema carga el archivo al proveedor de almacenamiento (S3/Blob) y obtiene `url`.
5. El sistema crea el registro Archivo con:
   - `polizaId`
   - `mimeType`
   - `url`
   - `active = true`
6. Se registra auditoría.

**Flujos alternos / errores:**
- A1: Archivo con tipo no permitido  
  - Rechazar carga.
- A2: Límite de almacenamiento excedido  
  - Rechazar carga.

**Reglas:**
- No se guardan binarios en base de datos.
- Solo OWNER/AGENT pueden cargar archivos.

---

#### RF-ARCH-03 Ver detalle de Archivo de Póliza

**Descripción:**  
Permite consultar el detalle de un archivo asociado a una póliza.

**Roles y Alcance:**
- OWNER
- AGENT
- CLIENT (solo sus pólizas, si aplica)

**Precondiciones:**
- Usuario autenticado.
- Archivo pertenece a una póliza dentro de la Empresa.
- Si es CLIENT: la póliza debe pertenecer al cliente.

**Flujo principal:**
1. El usuario selecciona un archivo del listado.
2. El sistema muestra:
   - id
   - mimeType
   - url
   - createdAt
   - updatedAt
   - active
3. El sistema permite abrir/descargar desde `url` (según permisos).

**Reglas:**
- No exponer llaves privadas, tokens o credenciales del storage.
- Se recomienda usar URLs firmadas si se requiere seguridad.

---

#### RF-ARCH-04 Editar metadatos de Archivo de Póliza

**Descripción:**  
Permite modificar metadatos del archivo (si se requiere), manteniendo el archivo físico externo sin cambios.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Archivo activo.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario accede a “Editar Archivo”.
2. Puede modificar:
   - mimeType (opcional, si se permite)
   - url (solo si se reasigna por recarga o migración)
3. El sistema valida consistencia multi-tenant.
4. Guarda cambios y actualiza `updatedAt`.
5. Registra auditoría.

**Reglas:**
- En la práctica, suele preferirse “reemplazar” creando un nuevo archivo y desactivando el anterior.
- No permitir editar para cambiar el archivo a otra póliza.

---

#### RF-ARCH-05 Eliminar (Desactivar) Archivo de Póliza

**Descripción:**  
Permite desactivar un archivo asociado a una Póliza mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Archivo pertenece a póliza de la Empresa.

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Registra auditoría.

**Reglas:**
- No se permite eliminación física del registro.
- El archivo físico en storage puede eliminarse o conservarse según política, pero el registro debe mantenerse para trazabilidad.
- CLIENT no puede eliminar archivos.

___

#### RF-SIN-01 Listar Siniestros

**Descripción:**  
Permite listar los siniestros registrados dentro de la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar todos los siniestros de la Empresa.
- AGENT → Puede listar todos los siniestros de la Empresa.
- CLIENT → Solo puede listar siniestros asociados a sus pólizas (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Siniestros”.
2. El sistema consulta la entidad Siniestro filtrando por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Filtro adicional:
   - Si CLIENT → `clienteUserId = usuario.id`
4. Mostrar:
   - polizaId (o numeroPoliza)
   - tipoSiniestro
   - fechaEvento
   - status
   - montoEstimado
   - montoPagado
   - createdAt

**Reglas:**
- No se permite visualizar siniestros de otras Empresas.
- CLIENT solo ve sus siniestros.

---

#### RF-SIN-02 Crear Siniestro

**Descripción:**  
Permite registrar un siniestro asociado a una Póliza.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa.
- La Póliza pertenece a la misma Empresa.
- El `clienteUserId` coincide con el cliente de la póliza.

**Flujo principal:**
1. El usuario selecciona “Crear Siniestro”.
2. Selecciona Póliza.
3. Captura:
   - tipoSiniestro (opcional)
   - fechaEvento
   - descripcion (opcional)
   - ajustador (opcional)
   - montoEstimado (opcional)
4. El sistema valida:
   - coherencia multi-tenant (empresaId)
   - fechaEvento válida
5. El sistema crea el siniestro con:
   - empresaId
   - polizaId
   - clienteUserId (derivado de póliza)
   - status = REPORTADO
   - creadoPorUserId = usuario.id
   - active = true
6. Registrar auditoría.

**Reglas:**
- CLIENT no puede crear siniestros.
- creadoPorUserId debe pertenecer a la misma Empresa.

---

#### RF-SIN-03 Ver detalle de Siniestro

**Descripción:**  
Permite consultar la información completa de un siniestro, incluyendo póliza asociada y archivos.

**Roles y Alcance:**
- OWNER → Puede ver todos.
- AGENT → Puede ver todos.
- CLIENT → Solo puede ver los propios (si aplica).

**Precondiciones:**
- El siniestro pertenece a la Empresa.
- Si es CLIENT: `clienteUserId = usuario.id`.

**Flujo principal:**
1. El usuario selecciona un siniestro del listado.
2. El sistema muestra:
   - Datos generales del siniestro
   - Póliza asociada
   - status
   - montos
   - creadoPorUserId
   - createdAt / updatedAt
   - Archivos de siniestro
   - Hitos del siniestro

**Reglas:**
- Validación estricta de `empresaId`.
- No exponer datos sensibles.

---

#### RF-SIN-04 Editar Siniestro

**Descripción:**  
Permite modificar información de un siniestro.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Siniestro activo.
- Empresa con Suscripción activa.

**Flujo principal:**
1. Acceso a “Editar Siniestro”.
2. Puede modificar:
   - tipoSiniestro
   - descripcion
   - ajustador
   - montoEstimado
   - montoPagado
   - status
3. El sistema valida consistencia multi-tenant.
4. Guardar cambios.
5. Actualizar `updatedAt`.
6. Registrar auditoría.

**Reglas:**
- No se puede cambiar `empresaId`, `polizaId`, ni `clienteUserId`.
- CLIENT no puede editar siniestros.
- Reglas de transición de status pueden aplicarse (si se define flujo).

---

#### RF-SIN-05 Eliminar (Desactivar) Siniestro

**Descripción:**  
Permite desactivar un siniestro mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Siniestro pertenece a la Empresa.

**Flujo principal:**
1. Selección de “Desactivar”.
2. Confirmación.
3. Actualizar:
   - `active = false`
4. Registrar auditoría.

**Reglas:**
- No eliminación física.
- Los archivos e hitos asociados deben permanecer históricos.
- CLIENT no puede desactivar siniestros.

___

#### RF-HITO-01 Listar Hitos de Siniestro

**Descripción:**  
Permite listar los hitos asociados a un Siniestro específico.

**Roles y Alcance:**
- OWNER → Puede listar todos los hitos de siniestros de la Empresa.
- AGENT → Puede listar todos los hitos de siniestros de la Empresa.
- CLIENT → Solo puede visualizar hitos de sus siniestros (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Siniestro pertenece a la misma Empresa.
- Empresa con Suscripción activa.
- Si es CLIENT: el siniestro debe estar asociado a su póliza.

**Flujo principal:**
1. El usuario accede al detalle de un Siniestro.
2. El sistema consulta la entidad HitoSiniestro filtrando:
   - `siniestroId = <id>`
   - `active = true`
3. El sistema muestra:
   - titulo
   - descripcion
   - fechaLimite
   - status
   - responsableUserId
   - createdAt

**Reglas:**
- Validación obligatoria de coherencia multi-tenant.
- CLIENT solo lectura.

---

#### RF-HITO-02 Crear Hito de Siniestro

**Descripción:**  
Permite registrar un nuevo hito (tarea o evento clave) dentro de un Siniestro.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa.
- El Siniestro pertenece a la misma Empresa.

**Flujo principal:**
1. El usuario selecciona “Crear Hito”.
2. Captura:
   - titulo
   - descripcion (opcional)
   - fechaLimite (opcional)
   - responsableUserId (opcional)
3. El sistema valida:
   - coherencia multi-tenant (responsableUserId debe pertenecer a la misma Empresa).
4. El sistema crea el hito con:
   - siniestroId
   - status inicial (ej. PENDIENTE)
   - active = true
5. Registrar auditoría.

**Reglas:**
- CLIENT no puede crear hitos.
- El responsable asignado debe pertenecer a la misma Empresa.

---

#### RF-HITO-03 Ver detalle de Hito de Siniestro

**Descripción:**  
Permite consultar la información completa de un Hito.

**Roles y Alcance:**
- OWNER
- AGENT
- CLIENT (solo lectura de sus siniestros si aplica)

**Precondiciones:**
- Hito pertenece a un Siniestro de la misma Empresa.
- Si es CLIENT: el siniestro debe estar asociado a su póliza.

**Flujo principal:**
1. El usuario selecciona un Hito.
2. El sistema muestra:
   - titulo
   - descripcion
   - fechaLimite
   - status
   - responsableUserId
   - createdAt
   - updatedAt

**Reglas:**
- Validación estricta de empresaId vía siniestro.
- No exponer información fuera del entorno.

---

#### RF-HITO-04 Editar Hito de Siniestro

**Descripción:**  
Permite modificar la información de un Hito.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Hito activo.
- Empresa con Suscripción activa.

**Flujo principal:**
1. Acceso a “Editar Hito”.
2. Puede modificar:
   - titulo
   - descripcion
   - fechaLimite
   - status
   - responsableUserId
3. El sistema valida:
   - coherencia multi-tenant.
4. Guardar cambios.
5. Actualizar `updatedAt`.
6. Registrar auditoría.

**Reglas:**
- No se puede cambiar `siniestroId`.
- CLIENT no puede editar hitos.
- Se pueden aplicar reglas de transición de status si se define flujo formal.

---

#### RF-HITO-05 Eliminar (Desactivar) Hito de Siniestro

**Descripción:**  
Permite desactivar un Hito mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Hito pertenece a un Siniestro de la Empresa.

**Flujo principal:**
1. Selección de “Desactivar”.
2. Confirmación.
3. Actualizar:
   - `active = false`
4. Registrar auditoría.

**Reglas:**
- No eliminación física.
- Se mantiene trazabilidad histórica.
- CLIENT no puede eliminar hitos.

___

#### RF-ARCH-SIN-01 Listar Archivos de Siniestro

**Descripción:**  
Permite listar los archivos asociados a un Siniestro.

**Roles y Alcance:**
- OWNER → Puede listar archivos de cualquier siniestro de su Empresa.
- AGENT → Puede listar archivos de cualquier siniestro de su Empresa.
- CLIENT → Solo puede listar archivos de sus siniestros (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- El Siniestro pertenece a la misma Empresa.
- Si es CLIENT: `siniestro.clienteUserId = usuario.id`.

**Flujo principal:**
1. El usuario accede al detalle de un Siniestro y abre la sección “Archivos”.
2. El sistema consulta la entidad ArchivoSiniestro filtrando:
   - `siniestroId = <id>`
   - `active = true`
3. El sistema muestra:
   - id
   - mimeType
   - url
   - createdAt

**Reglas:**
- Validación estricta multi-tenant (el siniestro debe pertenecer a la Empresa del usuario).
- CLIENT solo lectura.

---

#### RF-ARCH-SIN-02 Cargar (Crear) Archivo de Siniestro

**Descripción:**  
Permite cargar un archivo asociado a un Siniestro. El sistema almacena únicamente metadatos y la URL del archivo.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa.
- El Siniestro pertenece a la misma Empresa.
- No exceder el límite de almacenamiento del Plan (si aplica).

**Flujo principal:**
1. El usuario selecciona “Cargar Archivo”.
2. Adjunta el archivo.
3. El sistema valida:
   - `mimeType` permitido.
   - tamaño máximo permitido (si aplica).
4. El sistema carga el archivo al proveedor de almacenamiento (S3/Blob) y obtiene `url`.
5. El sistema crea el registro ArchivoSiniestro con:
   - `siniestroId`
   - `mimeType`
   - `url`
   - `active = true`
6. Se registra auditoría.

**Flujos alternos / errores:**
- A1: Archivo con tipo no permitido  
  - Rechazar carga.
- A2: Límite de almacenamiento excedido  
  - Rechazar carga.

**Reglas:**
- No se guardan binarios en base de datos.
- Solo OWNER/AGENT pueden cargar archivos.

---

#### RF-ARCH-SIN-03 Ver detalle de Archivo de Siniestro

**Descripción:**  
Permite consultar el detalle de un archivo asociado a un siniestro.

**Roles y Alcance:**
- OWNER
- AGENT
- CLIENT (solo sus siniestros, si aplica)

**Precondiciones:**
- Usuario autenticado.
- El archivo pertenece a un siniestro dentro de la misma Empresa.
- Si es CLIENT: `siniestro.clienteUserId = usuario.id`.

**Flujo principal:**
1. El usuario selecciona un archivo del listado.
2. El sistema muestra:
   - id
   - mimeType
   - url
   - createdAt
   - updatedAt
   - active
3. El sistema permite abrir/descargar desde `url` (según permisos).

**Reglas:**
- No exponer tokens/credenciales del storage.
- Se recomienda URL firmada si se requiere control de acceso.

---

#### RF-ARCH-SIN-04 Editar metadatos de Archivo de Siniestro

**Descripción:**  
Permite modificar metadatos del archivo (si se requiere), manteniendo el archivo físico externo sin cambios.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Archivo activo.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario accede a “Editar Archivo”.
2. Puede modificar:
   - mimeType (opcional, si se permite)
   - url (solo si se reasigna por recarga o migración)
3. El sistema valida consistencia multi-tenant.
4. Guarda cambios y actualiza `updatedAt`.
5. Registra auditoría.

**Reglas:**
- En práctica se recomienda “reemplazar” creando uno nuevo y desactivando el anterior.
- No permitir cambiar `siniestroId`.

---

#### RF-ARCH-SIN-05 Eliminar (Desactivar) Archivo de Siniestro

**Descripción:**  
Permite desactivar un archivo asociado a un siniestro mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Archivo pertenece a un siniestro de la Empresa.

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. Confirmación.
3. Actualizar:
   - `active = false`
4. Registrar auditoría.

**Reglas:**
- No se permite eliminación física.
- Si el Siniestro se desactiva, los archivos permanecen históricos.
- CLIENT no puede eliminar archivos.

___

#### RF-GLO-01 Listar Términos de Glosario

**Descripción:**  
Permite listar los términos registrados en el Glosario de la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar todos los términos.
- AGENT → Puede listar todos los términos.
- CLIENT → Solo lectura (si el acceso está habilitado).

**Precondiciones:**
- Usuario autenticado.
- Usuario pertenece a una Empresa.
- Empresa con Suscripción activa (TRIAL o ACTIVA).
- `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Glosario”.
2. El sistema consulta la entidad Glosario filtrando:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. El sistema muestra:
   - titulo
   - descripcion (resumen o preview)
   - createdAt
4. Permitir búsqueda por título.
5. Permitir paginación y ordenamiento.

**Reglas:**
- No se muestran términos de otras Empresas.
- CLIENT solo puede visualizar (sin edición).

---

#### RF-GLO-02 Crear Término de Glosario

**Descripción:**  
Permite registrar un nuevo término en el Glosario de la Empresa.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario selecciona “Crear Término”.
2. Captura:
   - titulo
   - descripcion
3. El sistema valida:
   - Título no vacío.
   - UNIQUE (empresaId, titulo).
4. El sistema crea el registro con:
   - `empresaId = usuario.empresaId`
   - `active = true`
5. Registrar auditoría.

**Reglas:**
- CLIENT no puede crear términos.
- No existe glosario global compartido.

---

#### RF-GLO-03 Ver detalle de Término

**Descripción:**  
Permite consultar la información completa de un término del Glosario.

**Roles y Alcance:**
- OWNER
- AGENT
- CLIENT (solo lectura)

**Precondiciones:**
- Término pertenece a la misma Empresa.
- `active = true`.

**Flujo principal:**
1. El usuario selecciona un término.
2. El sistema muestra:
   - titulo
   - descripcion
   - createdAt
   - updatedAt

**Reglas:**
- Validación estricta de `empresaId`.
- No exponer términos inactivos salvo perfil autorizado (opcional).

---

#### RF-GLO-04 Editar Término de Glosario

**Descripción:**  
Permite modificar un término existente del Glosario.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa.
- Término activo.

**Flujo principal:**
1. El usuario accede a “Editar Término”.
2. Puede modificar:
   - titulo
   - descripcion
3. El sistema valida:
   - UNIQUE (empresaId, titulo).
4. Guardar cambios.
5. Actualizar `updatedAt`.
6. Registrar auditoría.

**Reglas:**
- No se permite cambiar `empresaId`.
- CLIENT no puede editar términos.

---

#### RF-GLO-05 Eliminar (Desactivar) Término de Glosario

**Descripción:**  
Permite desactivar un término mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Término pertenece a la Empresa.

**Flujo principal:**
1. El usuario selecciona “Eliminar”.
2. Confirmación.
3. Actualizar:
   - `active = false`
4. Registrar auditoría.

**Reglas:**
- No eliminación física.
- CLIENT no puede eliminar términos.
- Los términos inactivos no deben mostrarse en búsquedas normales.

___

#### RF-AUTH-AGT-01 Iniciar sesión (AGENT) mediante liga de acceso por Empresa

**Descripción:**  
Permite que un usuario con rol AGENT inicie sesión accediendo desde una liga específica de su Empresa (tenant).  
La liga de inicio de sesión será generada en el frontend e incluirá el identificador de la Empresa, para asegurar que el acceso ocurra dentro del entorno correcto.

**Roles:**  
- AGENT

**Precondiciones:**
- Existe una Empresa activa.
- El usuario AGENT existe, pertenece a la Empresa y tiene:
  - `status = ACTIVE`
  - `active = true`
- La Empresa cuenta con Suscripción activa (`status = TRIAL` o `ACTIVA`) para habilitar escritura.
- El frontend tiene disponible una ruta de login por Empresa (ej. `/login/{empresaId}`).

**Flujo principal:**
1. El AGENT accede a la liga de inicio de sesión de su Empresa (incluye `empresaId`).
2. El sistema muestra pantalla de login contextualizada a la Empresa.
3. El AGENT captura credenciales (email + password).
4. El sistema valida:
   - `empresaId` recibido en la liga.
   - Existencia de usuario con:
     - `empresaId = liga.empresaId`
     - `email = emailIngresado`
     - `role = AGENT`
     - `status = ACTIVE`
     - `active = true`
   - Coincidencia de contraseña (passwordHash).
5. Si es válido, el sistema autentica y crea sesión/token asociado al `empresaId`.
6. El sistema redirige al dashboard del entorno (Empresa) del usuario.

**Reglas / Validaciones:**
- La autenticación de AGENT debe estar siempre ligada a un `empresaId` explícito (liga).
- Debe existir restricción de unicidad recomendada: UNIQUE (empresaId, email).
- No se permite inicio de sesión sin contexto de Empresa (sin `empresaId`) para roles no globales.
- La sesión/token debe incluir `empresaId` y `role` como claims para validación en cada request.

___

#### RF-AUTH-CLI-01 Iniciar sesión (CLIENT) mediante liga de acceso por Empresa

**Descripción:**  
Permite que un usuario con rol CLIENT inicie sesión accediendo desde una liga específica de su Empresa (tenant).  
La liga de inicio de sesión será generada en el frontend e incluirá el identificador de la Empresa para garantizar el aislamiento multi-tenant.

**Roles:**  
- CLIENT

**Precondiciones:**
- Existe una Empresa activa.
- El usuario CLIENT existe y pertenece a la Empresa.
- El usuario tiene:
  - `status = ACTIVE`
  - `active = true`
- El frontend dispone de una ruta de login por Empresa (ej. `/login/{empresaId}`).

**Flujo principal:**
1. El CLIENT accede a la liga de inicio de sesión de su Empresa (incluye `empresaId`).
2. El sistema muestra pantalla de login contextualizada a la Empresa.
3. El CLIENT captura credenciales (email + password).
4. El sistema valida:
   - `empresaId` recibido en la liga.
   - Existencia de usuario con:
     - `empresaId = liga.empresaId`
     - `email = emailIngresado`
     - `role = CLIENT`
     - `status = ACTIVE`
     - `active = true`
   - Coincidencia de contraseña (passwordHash).
5. Si es válido, el sistema autentica y crea sesión/token asociado al `empresaId`.
6. El sistema redirige al dashboard o portal de cliente.

**Reglas / Validaciones:**
- La autenticación de CLIENT siempre debe estar ligada a un `empresaId`.
- Restricción recomendada: UNIQUE (empresaId, email).
- No se permite inicio de sesión global para CLIENT.
- El token de sesión debe incluir:
  - `empresaId`
  - `userId`
  - `role`
- CLIENT solo tendrá acceso a información propia:
  - Sus pólizas
  - Sus siniestros
  - Archivos asociados

___

#### RF-KANBAN-POL-01 Tablero Kanban de Pólizas (mover por estatus)

**Descripción:**  
Permite visualizar y gestionar Pólizas en un tablero Kanban por columnas de estatus.  
El usuario puede mover una Póliza entre columnas, actualizando su `status` conforme a reglas de negocio.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- Pólizas pertenecen a `empresaId = usuario.empresaId`.

**Columnas del Kanban (estatus):**
- COTIZACION
- ACTIVA
- PROXIMA_A_VENCER
- VENCIDA
- CANCELADA

**Flujo principal:**
1. El usuario accede al módulo “Kanban de Pólizas”.
2. El sistema consulta Pólizas activas de la Empresa (`active = true`) y las agrupa por `status`.
3. El sistema muestra tarjetas con datos mínimos:
   - numeroPoliza (si existe) o identificador interno
   - cliente
   - aseguradora
   - ramo
   - fechaVencimiento (si existe)
4. El usuario arrastra una tarjeta a otra columna (nuevo status).
5. El sistema valida transición de estatus (ver reglas).
6. El sistema actualiza `Póliza.status` y registra auditoría.
7. El tablero se actualiza.

**Reglas / Validaciones:**
- No se permite mover pólizas de otra Empresa.
- Transiciones recomendadas:
  - COTIZACION → ACTIVA (requiere validar campos obligatorios)
  - ACTIVA → CANCELADA (permitido)
  - ACTIVA ↔ PROXIMA_A_VENCER (permitido, aunque PROXIMA_A_VENCER puede ser automático)
  - PROXIMA_A_VENCER → VENCIDA (preferentemente automático por fechas)
  - VENCIDA → ACTIVA (solo si se corrige vigencia, o por renovación; definir política)
- Para pasar de COTIZACION a ACTIVA, deben existir:
  - `numeroPoliza`
  - `fechaInicio`
  - `fechaVencimiento` con `fechaVencimiento >= fechaInicio`
- Se recomienda registrar historial de cambios de status (auditoría) para trazabilidad.

---

#### RF-POL-NOTIF-01 Notificación por correo de Póliza próxima a vencer

**Descripción:**  
Envía notificación por correo cuando una Póliza esté próxima a vencer, para alertar a los responsables y/o al cliente (si aplica).

**Roles:**  
- Sistema (proceso automático)
- (Configuración / consulta): OWNER

**Precondiciones:**
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- Existe configuración del umbral de aviso (ej. 30/15/7 días) a nivel Empresa o global (definir).
- La Póliza está activa (`active = true`) y tiene `fechaVencimiento`.

**Flujo principal (automático):**
1. Un proceso programado (cron) se ejecuta diariamente.
2. El sistema consulta pólizas con:
   - `status = ACTIVA`
   - `fechaVencimiento` dentro del umbral configurado (ej. hoy + N días)
3. El sistema actualiza `status` a `PROXIMA_A_VENCER` si aplica.
4. El sistema envía correo a:
   - OWNER de la Empresa (obligatorio)
   - AGENT creador o responsable (si se define)
   - CLIENT (opcional y solo si se habilita acceso / notificaciones)
5. El sistema registra bitácora de notificación enviada.

**Reglas / Validaciones:**
- Evitar duplicidad: no enviar el mismo correo múltiples veces para el mismo umbral (guardar log).
- Solo aplica a pólizas con `fechaVencimiento` válida.
- Si la suscripción está vencida/suspendida, se puede:
  - detener notificaciones, o
  - enviar solo notificaciones administrativas (definir política).
- Plantilla de correo debe incluir:
  - cliente
  - aseguradora
  - numeroPoliza
  - fechaVencimiento
  - enlace al detalle (con empresaId)

---

#### RF-POL-REN-01 Crear Renovación (genera Cotización con datos del antecesor)

**Descripción:**  
Permite crear una renovación a partir de una Póliza existente.  
El sistema crea una nueva Póliza en estatus `COTIZACION` con valores prellenados (placeholders) basados en la póliza anterior y con `polizaAnteriorId` apuntando al registro antecesor.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- La Póliza origen pertenece a la Empresa y está `active = true`.

**Flujo principal:**
1. El usuario abre el detalle de una Póliza.
2. Selecciona “Crear Renovación”.
3. El sistema crea una nueva Póliza con:
   - `empresaId` = pólizaOrigen.empresaId
   - `clienteUsuarioId` = pólizaOrigen.clienteUsuarioId
   - `aseguradoraId` = pólizaOrigen.aseguradoraId
   - `ramo` = pólizaOrigen.ramo
   - `primaNeta` / `primaTotal` = (copiar o dejar NULL según política)
   - `status = COTIZACION`
   - `polizaAnteriorId = pólizaOrigen.id`
   - `creadoPorUsuarioId = usuario.id`
   - `numeroPoliza = NULL` (placeholder hasta emisión)
   - `fechaInicio` / `fechaVencimiento` = NULL (o sugeridas, si se define)
4. El sistema guarda la nueva póliza en transacción.
5. El sistema redirige al detalle de la nueva Cotización para que el usuario complete datos y la “emita”.

**Reglas / Validaciones:**
- Consistencia multi-tenant obligatoria.
- No permitir renovación si:
  - la póliza origen ya tiene una renovación activa (si se adopta la restricción de 1→0..1).
- La nueva póliza debe iniciar como `COTIZACION`.
- La emisión final (mover a ACTIVA) debe validar campos obligatorios:
  - numeroPoliza, fechaInicio, fechaVencimiento, etc.
- Se recomienda registrar relación visible:
  - “Póliza anterior” y “Póliza renovada” (navegación bidireccional a nivel UI).

___

#### RF-HITO-ALERT-01 Alertas y notificaciones por Hitos (correo + alertas en sistema)

**Descripción:**  
Los Hitos de Siniestro funcionan como tareas críticas con fecha límite.  
El sistema debe:
1) Generar alertas visibles dentro del CRM (sin entidad de notificaciones), y  
2) Enviar correos automáticos cuando se acerque o se venza la fecha límite.

**Roles:**  
- Sistema (proceso automático)
- OWNER (consulta)
- AGENT (consulta)

**Precondiciones:**
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- Existe al menos un Hito activo (`active = true`) asociado a un Siniestro activo.
- Los Hitos tienen `fechaLimite` (cuando aplique) y un `status` operativo.

---

#### RF-HITO-ALERT-02 Listar Hitos siguientes de mi Empresa (Panel de alertas)

**Descripción:**  
Permite a OWNER y AGENT visualizar un panel con los próximos Hitos y vencidos de la Empresa, con severidad derivada, sin usar entidad de notificaciones.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `AGENT`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario accede a “Alertas” o “Hitos próximos”.
2. El sistema consulta Hitos con:
   - `empresaId = usuario.empresaId` (via siniestro)
   - `active = true`
   - `fechaLimite` no nula
   - `status` pendiente/en proceso (no completado/cancelado)
   - `fechaLimite <= hoy + N` (incluye vencidos)
3. El sistema calcula severidad (VENCIDO/HOY/PROXIMO).
4. El sistema muestra la lista ordenada por:
   - severidad (VENCIDO primero)
   - fechaLimite ascendente

**Filtros recomendados:**
- Por severidad
- Por responsableUserId
- Por siniestroId / cliente / póliza

**Reglas:**
- Validación estricta multi-tenant.
- No se muestran hitos inactivos.
- CLIENT no tiene acceso a este panel (salvo que se defina).

---

#### RF-HITO-EMAIL-01 Enviar correos por vencimiento o proximidad de Hitos

**Descripción:**  
Envía correos automáticos cuando un Hito esté próximo a vencer o vencido.

**Roles:**  
- Sistema (proceso automático)

**Precondiciones:**
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- Hitos con `fechaLimite` y `active = true`.
- Destinatarios configurados por regla (ver abajo).

**Flujo principal (automático):**
1. Un proceso programado (cron) se ejecuta diariamente (o cada X horas).
2. El sistema consulta Hitos de todas las Empresas con suscripción activa donde:
   - `fechaLimite` no nula
   - `status` no completado
   - `active = true`
   - `fechaLimite` dentro de umbrales de aviso (ej. hoy, hoy+1, hoy+3, vencidos)
3. Para cada Hito aplicable, el sistema envía correo a:
   - responsableUserId (si existe)
   - OWNER de la Empresa (siempre o configurable)
4. El sistema registra bitácora mínima (sin entidad Notificaciones):
   - Puede ser en logs del sistema o auditoría de eventos (recomendado).

**Reglas / Validaciones:**
- Anti-duplicado: el sistema debe evitar enviar el mismo aviso múltiples veces para el mismo Hito y umbral.
  - Recomendación sin entidad notificaciones: usar un campo en Hito para control mínimo, por ejemplo:
    - `lastNotifiedAt` (datetime, opcional)
    - `lastNotifiedType` (enum, opcional: PROXIMO, HOY, VENCIDO)
  - Si no quieres campos extra, entonces se requiere control vía logs/telemetría, pero es menos confiable.
- Plantilla de correo debe incluir:
  - titulo del hito
  - fechaLimite
  - severidad
  - referencia al siniestro/póliza/cliente
  - enlace al detalle (con empresaId)
- Si la suscripción no está activa, se puede:
  - no enviar correos, o
  - enviar solo a OWNER (definir política).