# Requerimientos implementados

> Fuente: documento CRM SeguroPro del 2026-02-24. Ese archivo se fusionó en este y en
> `reqs_pending.md` para conservar el corte implementado/pendiente, que el documento
> original no distinguía. Las secciones 1 y 2 (introducción, alcance y **catálogo de
> entidades**) viven en `reqs_overview.md`.
>
> Cada requerimiento aquí está implementado y verificado. Las divergencias conocidas
> entre spec e implementación están documentadas en `CLAUDE.md`.

#### RF-AUTH-01 Iniciar sesión como MASTER_ADMIN

**Descripción:**  
Permite que un usuario con rol MASTER_ADMIN inicie sesión en la plataforma SeguroPro para acceder al panel global del sistema.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Existe un usuario con `role = MASTER_ADMIN`.
- El usuario tiene `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El usuario ingresa correo y contraseña.
2. El sistema valida credenciales.
3. El sistema verifica `role = MASTER_ADMIN`.
4. El sistema valida `status = ACTIVE` y `active = true`.
5. Se genera sesión/token.
6. Se actualiza `lastLoginAt`.
7. Se redirige al dashboard global.

**Reglas:**
- Solo usuarios con `role = MASTER_ADMIN` pueden acceder al panel global.
- Mensajes de error deben ser genéricos.

---

---

---

---

---

#### RF-ADMIN-01 Listar usuarios MASTER_ADMIN

**Descripción:**  
Permite visualizar el listado de todos los usuarios con rol MASTER_ADMIN registrados en la plataforma.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El sistema consulta usuarios con:
   - `role = MASTER_ADMIN`
2. El sistema muestra:
   - id
   - firstName
   - lastName
   - email
   - status
   - active
   - createdAt

**Reglas:**
- No mostrar `passwordHash`.
- Permitir paginación y filtros.

---

---

---

---

---

#### RF-ADMIN-02 Crear usuario MASTER_ADMIN

**Descripción:**  
Permite que un MASTER_ADMIN cree otro usuario con rol MASTER_ADMIN.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario ingresa datos:
   - firstName
   - lastName
   - email
   - phone
2. El sistema valida formato y obligatoriedad.
3. El sistema valida que el email no esté registrado para otro MASTER_ADMIN.
4. Se crea usuario con:
   - `role = MASTER_ADMIN`
   - `empresaId = NULL`
   - `status = ACTIVE`
   - `active = true`
5. Se genera contraseña temporal o enlace de activación.
6. Se registra auditoría.

**Reglas:**
- CHECK: (role = MASTER_ADMIN) ⇒ (empresaId IS NULL)
- Solo MASTER_ADMIN puede crear otro MASTER_ADMIN.

---

---

---

---

---

#### RF-ADMIN-03 Ver detalle de usuario MASTER_ADMIN

**Descripción:**  
Permite visualizar la información completa de un usuario con rol MASTER_ADMIN.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario selecciona un registro del listado.
2. El sistema muestra:
   - id
   - firstName
   - lastName
   - email
   - phone
   - status
   - active
   - createdAt
   - updatedAt
   - lastLoginAt

**Reglas:**
- No exponer `passwordHash`.
- Solo MASTER_ADMIN puede acceder.

---

---

---

---

---

#### RF-ADMIN-04 Editar usuario MASTER_ADMIN

**Descripción:**  
Permite modificar información de un usuario con rol MASTER_ADMIN.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- El usuario objetivo existe y tiene `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario edita campos permitidos:
   - firstName
   - lastName
   - phone
   - status
2. El sistema valida reglas.
3. Se actualiza registro.
4. Se registra auditoría.

**Reglas:**
- No se puede cambiar el `role`.
- No se puede asignar `empresaId`.
- Si `status = BLOCKED`, el usuario no podrá autenticarse.

---

---

---

---

---

#### RF-ADMIN-05 Eliminar (Desactivar) usuario MASTER_ADMIN

**Descripción:**  
Permite desactivar un usuario con rol MASTER_ADMIN mediante eliminación lógica.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- El usuario objetivo existe y tiene `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- Se recomienda no permitir que un MASTER_ADMIN se desactive a sí mismo si es el único administrador activo del sistema.
- Siempre debe existir al menos un MASTER_ADMIN activo.

___

---

---

---

---

#### RF-OWNER-01 Listar usuarios OWNER (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN visualizar el listado de todos los usuarios con rol OWNER registrados en el sistema.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El sistema consulta la entidad Usuario.
2. Filtra registros con:
   - `role = OWNER`
3. El sistema muestra:
   - id
   - firstName
   - lastName
   - email
   - empresaId (o nombre de Empresa)
   - status
   - active
   - createdAt

**Reglas:**
- No mostrar `passwordHash`.
- Debe poder filtrar por Empresa o estatus.
- Siempre debe existir exactamente un OWNER por Empresa.

---

---

---

---

---

#### RF-OWNER-02 Crear OWNER desde MASTER_ADMIN (con creación de Empresa)

**Descripción:**  
Permite que un MASTER_ADMIN cree un nuevo usuario con rol OWNER y, dentro del mismo flujo, cree la Empresa asociada.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El MASTER_ADMIN accede a “Crear Empresa + OWNER”.
2. Ingresa datos de Empresa:
   - nombreComercial
   - razonSocial (opcional)
   - emailContacto
   - telefonoContacto
3. Ingresa datos del OWNER:
   - firstName
   - lastName
   - email
   - phone
4. El sistema valida obligatoriedad.
5. El sistema crea:
   - Registro Empresa
   - Registro Usuario con:
     - `role = OWNER`
     - `empresaId = nuevaEmpresa.id`
     - `status = ACTIVE`
     - `active = true`
6. El sistema genera contraseña temporal o enlace de activación.
7. Se registra auditoría de creación.

**Postcondiciones:**
- Empresa creada.
- OWNER creado y asociado a la Empresa.

**Reglas:**
- No puede existir más de un OWNER por Empresa.
- La creación de Empresa y OWNER debe ejecutarse en una misma transacción.
- La Empresa no puede existir sin OWNER.

---

---

---

---

---

#### RF-OWNER-03 Ver detalle de OWNER (Nivel Plataforma)

**Descripción:**  
Permite que un MASTER_ADMIN visualice el detalle completo de un OWNER y su Empresa asociada.

**Roles:**  
- MASTER_ADMIN

**Flujo principal:**
1. El usuario selecciona un OWNER del listado.
2. El sistema muestra:
   - Datos del Usuario
   - Datos básicos de la Empresa asociada
   - status
   - active
   - createdAt
   - lastLoginAt

**Reglas:**
- No exponer `passwordHash`.
- Solo MASTER_ADMIN puede acceder a esta vista global.

---

---

---

---

---

#### RF-OWNER-04 Editar OWNER (Nivel Plataforma)

**Descripción:**  
Permite que el MASTER_ADMIN modifique la información de un OWNER.

**Roles:**  
- MASTER_ADMIN

**Flujo principal:**
1. El usuario edita:
   - firstName
   - lastName
   - phone
   - status
2. El sistema valida reglas.
3. Se actualiza el registro.
4. Se registra auditoría.

**Reglas:**
- No se puede cambiar el `role`.
- No se puede cambiar manualmente el `empresaId`.
- Si `status = BLOCKED`, el usuario no podrá autenticarse.

---

---

---

---

---

#### RF-OWNER-05 Eliminar (Desactivar) OWNER

**Descripción:**  
Permite desactivar un OWNER mediante eliminación lógica.

**Roles:**  
- MASTER_ADMIN

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- No puede quedar una Empresa activa sin OWNER activo.
- Si se desactiva un OWNER, debe definirse reemplazo previamente.

---

---

---

---

---

#### RF-OWNER-06 Registro público de OWNER (Onboarding por liga pública)

**Descripción:**  
Permite que una persona se registre como OWNER mediante una liga pública de onboarding.

**Roles:**  
- Usuario no autenticado (público)

**Precondiciones:**
- Existe una liga pública activa de registro.

**Flujo principal:**
1. El usuario accede a la liga pública.
2. Ingresa:
   - Datos de Empresa
   - Datos personales
   - Correo y contraseña
3. El sistema valida datos.
4. El sistema crea:
   - Empresa
   - Usuario con `role = OWNER`
5. El sistema inicia sesión automáticamente o solicita verificación de correo.

**Reglas:**
- Debe validarse unicidad de correo por Empresa.
- El registro debe ejecutarse en una sola transacción.
- Puede asignarse suscripción TRIAL automática si así se define.

---

---

---

---

---

#### RF-OWNER-07 Ver mi perfil (OWNER)

**Descripción:**  
Permite que un OWNER autenticado visualice su información personal y la información básica de su Empresa.

**Roles:**  
- OWNER

**Flujo principal:**
1. El OWNER accede a “Mi Perfil”.
2. El sistema muestra:
   - firstName
   - lastName
   - email
   - phone
   - status
   - Datos básicos de Empresa

**Reglas:**
- El OWNER solo puede ver información de su propia Empresa.
- No mostrar `passwordHash`.

---

---

---

---

---

#### RF-OWNER-08 Editar mi perfil (OWNER)

**Descripción:**  
Permite que un OWNER edite su información personal.

**Roles:**  
- OWNER

**Flujo principal:**
1. El OWNER modifica:
   - firstName
   - lastName
   - phone
2. El sistema valida datos.
3. Se actualiza el registro.
4. Se registra auditoría.

**Reglas:**
- No puede cambiar su `role`.
- No puede cambiar manualmente su `empresaId`.
- El cambio de correo puede requerir verificación adicional.

___

---

---

---

---

#### RF-OWNER-09 Ver información de mi Empresa

**Descripción:**  
Permite que un OWNER autenticado visualice la información completa de su Empresa (tenant).

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- `active = true`
- `status = ACTIVE`

**Flujo principal:**
1. El OWNER accede a la sección “Mi Empresa”.
2. El sistema obtiene la Empresa asociada a `usuario.empresaId`.
3. El sistema muestra:
   - razonSocial
   - nombreComercial
   - rfc
   - tipoPersona
   - emailContacto
   - telefonoContacto
   - pais
   - estado
   - createdAt
   - updatedAt

**Reglas:**
- El OWNER solo puede visualizar la Empresa asociada a su `empresaId`.
- No puede visualizar información de otras Empresas.
- No se permite acceso si la Empresa tiene `active = false`.

---

---

---

---

---

#### RF-OWNER-10 Editar información de mi Empresa

**Descripción:**  
Permite que un OWNER modifique la información de su propia Empresa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- La Empresa asociada tiene `active = true`.

**Flujo principal:**
1. El OWNER accede a “Editar Empresa”.
2. Modifica campos permitidos:
   - razonSocial
   - nombreComercial
   - rfc
   - tipoPersona
   - emailContacto
   - telefonoContacto
   - pais
   - estado
3. El sistema valida obligatoriedad y formatos.
4. El sistema guarda cambios.
5. Se actualiza `updatedAt`.
6. Se registra auditoría del cambio.

**Flujos alternos / errores:**
- A1: Datos inválidos  
  - El sistema rechaza la operación y muestra validaciones.
- A2: Empresa inactiva  
  - El sistema bloquea la edición.

**Reglas:**
- El OWNER no puede cambiar el `id` ni el estado `active`.
- El OWNER no puede modificar la Suscripción desde este flujo.
- La actualización debe respetar las reglas multi-tenant.
- Los cambios críticos (ej. RFC) pueden requerir validación adicional según política definida.

___

---

---

---

---

#### RF-PLAN-01 Listar Planes (Catálogo)

**Descripción:**  
Permite al MASTER_ADMIN visualizar el listado de planes comerciales disponibles en SeguroPro.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- Usuario con `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El MASTER_ADMIN accede al módulo “Planes”.
2. El sistema consulta la entidad Plan.
3. El sistema muestra el listado con al menos:
   - id
   - nombre
   - periodicidad
   - precio
   - limiteUsuarios
   - limiteAlmacenamientoGB
   - active
   - createdAt
4. El sistema permite paginación, filtros y ordenamiento.

**Reglas:**
- No se debe mostrar información sensible inexistente (no aplica password).
- Permitir filtrar por `active`.

---

---

---

---

---

#### RF-PLAN-02 Crear Plan

**Descripción:**  
Permite al MASTER_ADMIN crear un nuevo Plan del catálogo.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Crear Plan”.
2. Captura campos requeridos:
   - nombre
   - precio
   - periodicidad
   - limiteUsuarios
   - (opcionales) descripcion, limiteAlmacenamientoGB, features
3. El sistema valida obligatoriedad y tipos.
4. El sistema crea el Plan con:
   - `active = true`
5. Se registra auditoría de creación.

**Flujos alternos / errores:**
- A1: Nombre duplicado (si se configura unicidad)  
  - El sistema rechaza la creación.
- A2: Datos inválidos  
  - El sistema muestra validaciones.

**Reglas:**
- Solo MASTER_ADMIN puede crear planes.
- Se recomienda restricción UNIQUE en `nombre` (si el negocio lo requiere).

---

---

---

---

---

#### RF-PLAN-03 Ver detalle de Plan

**Descripción:**  
Permite al MASTER_ADMIN visualizar la información completa de un Plan.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario selecciona un Plan del listado.
2. El sistema muestra:
   - Todos los campos del Plan
   - createdAt, updatedAt
   - active

**Reglas:**
- Solo MASTER_ADMIN puede acceder.

---

---

---

---

---

#### RF-PLAN-04 Editar Plan

**Descripción:**  
Permite al MASTER_ADMIN modificar la información de un Plan existente.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- El Plan existe.

**Flujo principal:**
1. El usuario accede a “Editar Plan”.
2. Modifica campos permitidos:
   - nombre
   - descripcion
   - precio
   - periodicidad
   - limites
   - features
3. El sistema valida datos.
4. El sistema guarda cambios.
5. Se registra auditoría.

**Reglas:**
- No se permite eliminar físicamente un Plan.
- Si el Plan tiene suscripciones asociadas, se recomienda limitar cambios críticos (precio/límites) y preferir crear un nuevo Plan.

---

---

---

---

---

#### RF-PLAN-05 Eliminar (Desactivar) Plan

**Descripción:**  
Permite al MASTER_ADMIN desactivar un Plan del catálogo mediante eliminación lógica.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- El Plan existe.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Se registra auditoría.

**Reglas:**
- Un Plan desactivado no puede ser asignado a nuevas Suscripciones.
- Las Suscripciones existentes que referencian el Plan deben mantenerse sin cambios.
- No se permite eliminación física.

___

---

---

---

---

#### RF-SUS-01 Listar Suscripciones (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN visualizar el listado de suscripciones registradas en el sistema, incluyendo suscripción activa e historial por Empresa.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- Usuario con `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El MASTER_ADMIN accede al módulo “Suscripciones”.
2. El sistema consulta la entidad Suscripción.
3. El sistema muestra el listado con al menos:
   - id
   - empresaId (o nombre de Empresa)
   - planId (o nombre de Plan)
   - status
   - active (suscripción vigente)
   - fechaInicio
   - fechaFin
   - fechaProximoPago
   - createdAt
4. El sistema permite paginación, filtros y ordenamiento.

**Reglas:**
- Permitir filtrar por Empresa, status y `active = true`.
- No se permite acceso a roles distintos de MASTER_ADMIN.

---

---

---

---

---

#### RF-SUS-02 Crear Suscripción (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN crear una suscripción para una Empresa y asociarla a un Plan.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Empresa existe y está activa.
- El Plan existe y está activo.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Crear Suscripción”.
2. Selecciona:
   - Empresa
   - Plan
3. Captura:
   - status (TRIAL o ACTIVA)
   - fechaInicio
   - fechaProximoPago
   - renovacionAutomatica (opcional)
4. El sistema valida datos y coherencia de fechas.
5. Si la nueva suscripción se marca como vigente (`active = true`):
   - El sistema desactiva la suscripción vigente anterior (si existe) poniendo `active = false`.
6. El sistema crea la Suscripción.
7. Se registra auditoría.

**Reglas:**
- Solo puede existir una Suscripción con `active = true` por Empresa.
- Si `active = true`, entonces `status` debe ser TRIAL o ACTIVA.
- La operación debe ejecutarse en una sola transacción.

---

---

---

---

---

#### RF-SUS-03 Ver detalle de Suscripción (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN visualizar la información completa de una Suscripción, incluyendo Empresa y Plan asociados.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario selecciona una Suscripción del listado.
2. El sistema muestra:
   - Datos de Suscripción
   - Datos básicos de Empresa
   - Datos básicos de Plan
   - createdAt, updatedAt
   - active (vigencia)

**Reglas:**
- No se permite acceso a roles distintos de MASTER_ADMIN.

---

---

---

---

---

#### RF-SUS-04 Editar Suscripción (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN modificar información de una Suscripción existente (estatus, fechas y vigencia).

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Suscripción existe.

**Flujo principal:**
1. El MASTER_ADMIN accede a “Editar Suscripción”.
2. Modifica campos permitidos:
   - status
   - fechaInicio
   - fechaFin (si aplica)
   - fechaProximoPago
   - renovacionAutomatica
   - active (vigente)
3. El sistema valida reglas:
   - coherencia de fechas
   - unicidad de suscripción vigente por Empresa
4. Si se marca como vigente (`active = true`):
   - El sistema desactiva cualquier otra suscripción vigente de la misma Empresa.
5. El sistema guarda cambios.
6. Se registra auditoría.

**Reglas:**
- Si `active = true`, entonces `status` debe ser TRIAL o ACTIVA.
- No se permite que una Empresa tenga dos suscripciones vigentes.

---

---

---

---

---

#### RF-SUS-05 Eliminar (Desactivar) Suscripción (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN desactivar una Suscripción mediante eliminación lógica.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Suscripción existe.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false` (vigencia)
   - `activeRecord = false` (baja lógica) si se usa este campo; de lo contrario solo `active = false`.
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- Si se desactiva la suscripción vigente de una Empresa, la Empresa queda sin suscripción vigente a menos que se asigne otra.
- El control de acceso debe basarse en la suscripción vigente.

___

---

---

---

---

#### RF-ORD-01 Listar Órdenes (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN visualizar el listado de órdenes de facturación registradas en el sistema.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- Usuario con `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El MASTER_ADMIN accede al módulo “Órdenes”.
2. El sistema consulta la entidad Orden.
3. El sistema muestra el listado con al menos:
   - id
   - suscripcionId
   - Empresa (nombre)
   - cicloInicio
   - cicloFin
   - monto
   - moneda
   - status
   - createdAt
4. Permitir filtros por:
   - Empresa
   - status
   - rango de fechas
5. Permitir paginación y ordenamiento.

**Reglas:**
- No mostrar información sensible del proveedor más allá de lo necesario.
- Solo MASTER_ADMIN puede acceder a este listado global.

---

---

---

---

---

#### RF-ORD-02 Crear Orden (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN registrar manualmente una Orden asociada a una Suscripción.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Suscripción existe.
- La Suscripción pertenece a una Empresa válida.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Crear Orden”.
2. Selecciona:
   - Suscripción
3. Captura:
   - cicloInicio
   - cicloFin
   - monto
   - moneda
   - status
4. El sistema valida:
   - coherencia de fechas
   - que no exista otra Orden PAGADA para el mismo rango
5. Se crea la Orden.
6. Se registra auditoría.

**Reglas:**
- Si `status = PAGADA`, se debe actualizar `fechaProximoPago` de la Suscripción.
- La operación debe ser transaccional.
- No se permite duplicidad de Orden PAGADA para el mismo periodo.

---

---

---

---

---

#### RF-ORD-03 Ver detalle de Orden (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN visualizar la información completa de una Orden.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.

**Flujo principal:**
1. El usuario selecciona una Orden del listado.
2. El sistema muestra:
   - Datos completos de la Orden
   - Información básica de la Suscripción
   - Información básica de la Empresa
   - proveedor
   - proveedorOrdenId
   - proveedorPagoId
   - pagadaEn
   - motivoFallo
   - createdAt
   - updatedAt

**Reglas:**
- Solo MASTER_ADMIN puede acceder.
- No permitir modificación desde esta vista.

---

---

---

---

---

#### RF-ORD-04 Editar Orden (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN modificar el estado o datos administrativos de una Orden.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Orden existe.

**Flujo principal:**
1. El MASTER_ADMIN accede a “Editar Orden”.
2. Puede modificar:
   - status
   - proveedor (si aplica)
   - proveedorOrdenId
   - proveedorPagoId
   - motivoFallo
3. El sistema valida reglas de negocio.
4. Si el status cambia a PAGADA:
   - Se actualiza `fechaProximoPago` de la Suscripción.
5. Se guarda el registro.
6. Se registra auditoría.

**Reglas:**
- No se permite cambiar `suscripcionId`.
- No se permite modificar `cicloInicio` ni `cicloFin` si la Orden está PAGADA.
- No se permite alterar montos de órdenes ya PAGADAS (salvo política explícita).

---

---

---

---

---

#### RF-ORD-05 Eliminar (Desactivar) Orden (Nivel Plataforma)

**Descripción:**  
Permite al MASTER_ADMIN desactivar una Orden mediante eliminación lógica.

**Roles:**  
- MASTER_ADMIN

**Precondiciones:**
- Usuario autenticado con `role = MASTER_ADMIN`.
- La Orden existe.

**Flujo principal:**
1. El MASTER_ADMIN selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza:
   - `active = false`
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- No se debe permitir desactivar una Orden con `status = PAGADA` si impacta historial financiero (según política).
- Las Órdenes forman parte del historial contable y deben conservar trazabilidad.

___

---

---

---

---

#### RF-PLAN-OWNER-01 Listar Planes (Vista OWNER)

**Descripción:**  
Permite a un usuario con rol OWNER visualizar el catálogo de Planes disponibles en el sistema para fines informativos o de posible cambio de suscripción.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- Usuario con `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El OWNER accede a la sección “Planes”.
2. El sistema consulta la entidad Plan.
3. El sistema filtra:
   - `active = true`
4. El sistema muestra el listado con al menos:
   - nombre
   - descripcion
   - precio
   - periodicidad
   - limiteUsuarios
   - limiteAlmacenamientoGB
   - funcionalidades habilitadas

**Reglas:**
- El OWNER solo puede visualizar Planes activos.
- No puede crear, editar ni eliminar Planes.
- No se muestran identificadores internos técnicos innecesarios (ej. id si no es necesario).

---

---

---

---

---

#### RF-PLAN-OWNER-02 Ver detalle de Plan (Vista OWNER)

**Descripción:**  
Permite a un usuario con rol OWNER visualizar la información completa de un Plan específico.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- El Plan existe y está `active = true`.

**Flujo principal:**
1. El OWNER selecciona un Plan del listado.
2. El sistema muestra:
   - nombre
   - descripcion
   - precio
   - periodicidad
   - limiteUsuarios
   - limiteAlmacenamientoGB
   - funcionalidades habilitadas
   - createdAt (opcional si se desea mostrar información técnica)

**Reglas:**
- El OWNER no puede modificar información del Plan.
- El acceso es únicamente de lectura.
- No se permite visualizar Planes inactivos.

___

---

---

---

---

#### RF-SUS-OWNER-01 Ver mi Suscripción Activa

**Descripción:**  
Permite al OWNER visualizar la Suscripción activa asociada a su Empresa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- Usuario con `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El OWNER accede a la sección “Mi Suscripción”.
2. El sistema consulta la entidad Suscripción filtrando:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Si existe suscripción activa, el sistema muestra:
   - Plan (nombre)
   - status
   - fechaInicio
   - fechaFin
   - fechaProximoPago
   - renovacionAutomatica
4. Si no existe suscripción activa, el sistema muestra mensaje indicando que no hay suscripción vigente.

**Reglas:**
- El OWNER solo puede visualizar la Suscripción de su propia Empresa.
- No puede visualizar suscripciones históricas desde este flujo (salvo que se defina explícitamente).
- El acceso es solo lectura.

---

---

---

---

---

#### RF-SUS-OWNER-02 Crear Suscripción desde OWNER (Si no tiene activa)

**Descripción:**  
Permite al OWNER crear una nueva Suscripción para su Empresa seleccionando un Plan, siempre que no tenga una Suscripción activa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- La Empresa no tiene una Suscripción con `active = true`.
- El Plan seleccionado está `active = true`.

**Flujo principal:**
1. El OWNER accede a la sección “Contratar Plan”.
2. El sistema muestra Planes disponibles (`active = true`).
3. El OWNER selecciona un Plan.
4. El sistema genera una nueva Suscripción con:
   - `empresaId = usuario.empresaId`
   - `planId = planSeleccionado.id`
   - `status = ACTIVA` o `TRIAL` (según política)
   - `active = true`
   - `fechaInicio = fecha actual`
   - `fechaProximoPago` calculada según periodicidad
5. El sistema crea el registro.
6. Se registra auditoría.

**Reglas:**
- Solo puede existir una Suscripción activa por Empresa.
- La creación debe ejecutarse en una transacción.
- Si existe integración con proveedor de pago, puede requerir confirmación previa.

---

---

---

---

---

#### RF-SUS-OWNER-03 Dar de Baja mi Suscripción

**Descripción:**  
Permite al OWNER cancelar o desactivar la Suscripción activa de su Empresa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- Existe una Suscripción con:
  - `empresaId = usuario.empresaId`
  - `active = true`

**Flujo principal:**
1. El OWNER accede a “Cancelar Suscripción”.
2. El sistema solicita confirmación.
3. El sistema actualiza la Suscripción:
   - `status = CANCELADA`
   - `active = false`
   - `fechaFin = fecha actual` (si aplica)
4. Se registra auditoría.
5. El sistema aplica restricciones de acceso según reglas SaaS.

**Reglas:**
- No se permite eliminación física.
- Una Empresa sin Suscripción activa no podrá realizar operaciones de escritura.
- Puede definirse si la cancelación es inmediata o al final del periodo facturado.
- Si `renovacionAutomatica = true`, debe deshabilitarse al cancelar.

___

---

---

---

---

#### RF-ORD-OWNER-01 Crear Orden desde Suscripción (Ciclo de Facturación)

**Descripción:**  
Permite al OWNER generar una Orden asociada a la Suscripción activa de su Empresa para un ciclo de facturación específico.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- Existe una Suscripción activa para `empresaId = usuario.empresaId`.
- La Suscripción activa tiene `status = TRIAL` o `ACTIVA`.

**Flujo principal:**
1. El OWNER accede a “Facturación / Órdenes”.
2. El sistema obtiene la Suscripción activa de la Empresa.
3. El OWNER selecciona o confirma el ciclo de facturación:
   - `cicloInicio`
   - `cicloFin`
4. El sistema valida que no exista una Orden PAGADA para el mismo rango:
   - (`suscripcionId + cicloInicio + cicloFin`)
5. El sistema crea una Orden con:
   - `suscripcionId`
   - `cicloInicio`
   - `cicloFin`
   - `monto` (calculado desde el Plan de la Suscripción)
   - `moneda`
   - `status = PENDIENTE`
   - `creadoPorUsuarioId = usuario.id`
   - `active = true`
6. El sistema confirma creación y muestra la Orden.

**Reglas:**
- El monto debe derivarse del Plan asociado a la Suscripción.
- La Orden creada corresponde a un único ciclo.
- Si la suscripción no está ACTIVA/TRIAL, bloquear creación.

---

---

---

---

---

#### RF-ORD-OWNER-02 Listar mis Órdenes

**Descripción:**  
Permite al OWNER visualizar las Órdenes asociadas a la Suscripción de su Empresa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.

**Flujo principal:**
1. El OWNER accede al módulo “Mis Órdenes”.
2. El sistema consulta Órdenes filtrando por:
   - Empresa del usuario (vía Suscripción/Epresa)
   - `active = true`
3. El sistema muestra listado con al menos:
   - id
   - cicloInicio
   - cicloFin
   - monto
   - moneda
   - status
   - createdAt
4. El sistema permite filtros por status y fechas.

**Reglas:**
- El OWNER solo puede visualizar Órdenes de su propia Empresa.
- No se muestran órdenes de otras Empresas.

---

---

---

---

---

#### RF-ORD-OWNER-03 Ver detalle de mi Orden

**Descripción:**  
Permite al OWNER visualizar la información completa de una Orden específica.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- La Orden pertenece a la Empresa del usuario (validación multi-tenant).

**Flujo principal:**
1. El OWNER selecciona una Orden del listado.
2. El sistema muestra:
   - cicloInicio
   - cicloFin
   - monto
   - moneda
   - status
   - proveedor (si aplica)
   - proveedorOrdenId / proveedorPagoId (si aplica)
   - pagadaEn (si aplica)
   - motivoFallo (si aplica)
   - createdAt
   - updatedAt

**Reglas:**
- Solo lectura (excepto pago a través del flujo RF-ORD-OWNER-04).
- No exponer información sensible del proveedor más allá de los identificadores necesarios.

---

---

---

---

---

#### RF-ORD-OWNER-04 Pagar Orden

**Descripción:**  
Permite al OWNER iniciar y completar el pago de una Orden pendiente mediante un proveedor de pago.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- La Orden existe, pertenece a su Empresa y tiene `status = PENDIENTE`.
- La Suscripción asociada corresponde a la Empresa.

**Flujo principal:**
1. El OWNER selecciona “Pagar” en una Orden pendiente.
2. El sistema crea una intención de pago con el proveedor (si aplica) y registra:
   - `proveedor`
   - `proveedorOrdenId` (invoice/checkout/session)
3. El sistema redirige al flujo de pago o presenta el checkout embebido.
4. El proveedor confirma el pago (webhook o callback).
5. El sistema actualiza la Orden:
   - `status = PAGADA`
   - `pagadaEn = fecha/hora de confirmación`
   - `proveedorPagoId`
6. El sistema actualiza la Suscripción asociada:
   - `fechaProximoPago` según periodicidad del Plan
   - (opcional) `status = ACTIVA` si venía de TRIAL y la política lo define
1. El sistema muestra confirmación al usuario.

**Reglas:**
- No permitir pagar una Orden que no esté en PENDIENTE.
- La confirmación final de pago debe depender del proveedor (webhook) para evitar fraudes.
- No debe existir más de una Orden PAGADA para el mismo ciclo.
- La actualización de Orden y Suscripción debe ser transaccional.

___

---

---

---

---

#### RF-USR-EMP-01 Crear usuario AGENT (bajo límites del Plan)

**Descripción:**  
Permite al OWNER crear un usuario con rol AGENT dentro de su Empresa, validando el límite de usuarios definido por el Plan de la Suscripción activa.

**Roles:**  
- OWNER

**Precondiciones:**
- Usuario autenticado con `role = OWNER`.
- La Empresa tiene una Suscripción activa con `status = TRIAL` o `ACTIVA`.
- El Plan asociado define `limiteUsuarios`.
- El OWNER cuenta con permisos para gestión de usuarios.

**Flujo principal:**
1. El OWNER accede a “Usuarios” y selecciona “Crear Agente”.
2. Ingresa los datos del nuevo usuario:
   - firstName
   - lastName
   - email
   - phone
   - password (o enlace de activación, según política)
3. El sistema valida obligatoriedad y formato de correo.
4. El sistema valida unicidad de correo en la Empresa:
   - UNIQUE (empresaId, email)
5. El sistema valida el límite de usuarios del Plan:
   - Cuenta usuarios activos de la Empresa (OWNER + AGENT + CLIENT, según política definida)
   - Verifica que `conteo < limiteUsuarios`
6. Si cumple, el sistema crea el Usuario con:
   - `empresaId = usuario.empresaId`
   - `role = AGENT`
   - `status = ACTIVE`
   - `active = true`
7. El sistema registra auditoría del evento y confirma creación.

**Postcondiciones:**
- Usuario AGENT creado y asociado a la Empresa.

**Reglas / Validaciones:**
- Solo OWNER puede crear usuarios AGENT.
- El usuario creado debe pertenecer a la misma Empresa del OWNER.
- No se permite crear usuarios si la Suscripción activa no está ACTIVA/TRIAL.

---

---

---

---

---

#### RF-USR-CLI-01 Crear usuario CLIENT + DetalleCliente (flujo único)

**Descripción:**  
Permite a OWNER o AGENT crear un usuario con rol CLIENT y, dentro del mismo flujo, crear su registro DetalleCliente asociado.

**Roles:**  
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con `role = OWNER` o `role = AGENT`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).
- No exceder el `limiteUsuarios` del Plan.
- Operación dentro del `empresaId` del usuario autenticado.

**Flujo principal:**
1. El usuario accede a “Clientes” y selecciona “Crear Cliente”.
2. Captura datos del Usuario (CLIENT).
3. Captura datos de DetalleCliente.
4. El sistema valida:
   - Formato de correo.
   - UNIQUE (empresaId, email).
   - Límite de usuarios del Plan.
5. El sistema crea en una sola transacción:
   - Usuario con `role = CLIENT`
   - DetalleCliente 1—1
6. Confirmación de creación.

**Reglas:**
- Creación transaccional.
- Máximo un DetalleCliente por Usuario.
- Solo OWNER y AGENT pueden crear CLIENT.

 ___

---

---

---

---

#### RF-USR-EMP-02 Listar Usuarios de mi Empresa

**Descripción:**  
Permite listar usuarios pertenecientes a la Empresa.

**Roles y Alcance:**
- OWNER → Puede listar AGENT y CLIENT.
- AGENT → Solo puede listar CLIENT.

**Precondiciones:**
- Usuario autenticado.
- `status = ACTIVE` y `active = true`.

**Flujo principal:**
1. El usuario accede al módulo “Usuarios”.
2. El sistema filtra por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Filtro adicional por rol:
   - Si OWNER → mostrar AGENT y CLIENT.
   - Si AGENT → mostrar solo CLIENT.
4. Mostrar:
   - firstName
   - lastName
   - email
   - role
   - status

**Reglas:**
- No mostrar MASTER_ADMIN.
- No mostrar OWNER a AGENT.
- No mostrar usuarios de otras Empresas.

___

---

---

---

---

#### RF-USR-EMP-03 Ver detalle de Usuario

**Descripción:**  
Permite visualizar el detalle de un Usuario de la Empresa.

**Roles y Alcance:**
- OWNER → Puede ver detalle de AGENT y CLIENT.
- AGENT → Solo puede ver detalle de CLIENT.

**Precondiciones:**
- Usuario pertenece a la misma Empresa.

**Flujo principal:**
1. Selección del usuario.
2. Mostrar datos generales.
3. Si es CLIENT → mostrar también DetalleCliente.

**Reglas:**
- Validación estricta de rol y empresaId.
- No mostrar passwordHash.

___

---

---

---

---

#### RF-USR-EMP-04 Editar Usuario

**Descripción:**  
Permite modificar información de usuarios según jerarquía de rol.

**Roles y Alcance:**
- OWNER → Puede editar AGENT y CLIENT.
- AGENT → Solo puede editar CLIENT.

**Precondiciones:**
- Usuario activo.
- Mismo `empresaId`.

**Flujo principal:**
1. Acceso a “Editar”.
2. Puede modificar:
   - firstName
   - lastName
   - phone
   - status
3. Si es CLIENT → permitir editar DetalleCliente.
4. Guardar cambios.
5. Registrar auditoría.

**Reglas:**
- No se puede cambiar `role`.
- No se puede cambiar `empresaId`.
- AGENT no puede editar AGENT ni OWNER.
- OWNER no puede editar otro OWNER si existiera restricción de único.

___

---

---

---

---

#### RF-USR-EMP-05 Eliminar (Desactivar) Usuario

**Descripción:**  
Permite desactivar usuarios mediante eliminación lógica.

**Roles y Alcance:**
- OWNER → Puede desactivar AGENT y CLIENT.
- AGENT → Solo puede desactivar CLIENT.

**Precondiciones:**
- Usuario pertenece a la misma Empresa.

**Flujo principal:**
1. Selección de “Desactivar”.
2. Confirmación.
3. Actualizar `active = false`.
4. Registrar auditoría.

**Reglas:**
- No eliminación física.
- AGENT no puede desactivar AGENT ni OWNER.
- OWNER no puede desactivar al OWNER principal.
- Los registros históricos permanecen.

___

---

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

---

#### RF-KAN-COL-01 Listar Columnas Kanban

**Descripción:**  
Permite consultar las columnas Kanban activas configuradas para la Empresa.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Usuario con `status = ACTIVE` y `active = true`.
- Empresa con Suscripción activa (`status = TRIAL` o `ACTIVA`).

**Flujo principal:**
1. El usuario accede al tablero Kanban.
2. El sistema consulta COLUMNA KANBAN filtrando por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. El sistema ordena por `prioridad` ascendente.
4. El sistema muestra:
   - id
   - nombre
   - prioridad
   - createdAt

**Reglas:**
- No se muestran columnas de otras Empresas.
- No se muestran columnas inactivas en la consulta normal.

---

---

---

---

---

#### RF-KAN-COL-02 Crear Columna Kanban

**Descripción:**  
Permite crear una columna Kanban configurable para la Empresa.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con rol OWNER o AGENT.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario selecciona “Crear columna”.
2. Captura:
   - nombre
   - prioridad
3. El sistema valida que `prioridad` sea un entero positivo.
4. El sistema valida que no exista otra columna activa con la misma prioridad en la Empresa.
5. El sistema crea la columna con:
   - `empresaId = usuario.empresaId`
   - `active = true`
6. Se registra auditoría.

**Reglas:**
- El usuario no puede proporcionar ni modificar el `empresaId` de destino.
- No se permite crear columnas para otra Empresa.

---

---

---

---

---

#### RF-KAN-COL-03 Ver detalle de Columna Kanban

**Descripción:**  
Permite consultar el detalle de una columna Kanban de la Empresa.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- La columna existe, está activa y pertenece a la Empresa del usuario.

**Flujo principal:**
1. El usuario selecciona una columna.
2. El sistema muestra:
   - id
   - nombre
   - prioridad
   - createdAt
   - updatedAt

**Reglas:**
- Si la columna no pertenece a la Empresa, debe tratarse como no encontrada.

---

---

---

---

---

#### RF-KAN-COL-04 Editar Columna Kanban

**Descripción:**  
Permite modificar el nombre o la prioridad de una columna Kanban.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Columna activa de la misma Empresa.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario accede a “Editar columna”.
2. Puede modificar:
   - nombre
   - prioridad
3. El sistema valida la unicidad de `prioridad` dentro de la Empresa.
4. Se actualiza la columna y `updatedAt`.
5. Se registra auditoría.

**Reglas:**
- No se puede cambiar `empresaId`.
- Las tareas relacionadas conservan su asociación con la columna.

---

---

---

---

---

#### RF-KAN-COL-05 Eliminar (Desactivar) Columna Kanban

**Descripción:**  
Permite desactivar una columna Kanban mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- La columna pertenece a la Empresa del usuario.
- La Empresa cuenta con Suscripción activa.

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza `active = false`.
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- Las tareas históricas permanecen asociadas para conservar trazabilidad.
- Una columna inactiva no puede recibir nuevas tareas ni utilizarse para mover tareas.

---

---

---

---

---

#### RF-KAN-TAR-01 Listar Tareas Kanban

**Descripción:**  
Permite consultar las tareas Kanban de la Empresa, con filtros opcionales por columna y Póliza.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado.
- Empresa con Suscripción activa.

**Flujo principal:**
1. El usuario accede al tablero Kanban.
2. El sistema consulta TAREA KANBAN filtrando por:
   - `empresaId = usuario.empresaId`
   - `active = true`
3. Puede filtrar por:
   - `columnaKanbanId`
   - `polizaId`
4. El sistema muestra:
   - id
   - titulo
   - descripcion
   - columnaKanbanId
   - polizaId (si existe)
   - createdAt

**Reglas:**
- No se muestran tareas de otras Empresas.
- Una tarea sin `polizaId` debe mostrarse como tarea general.

---

---

---

---

---

#### RF-KAN-TAR-02 Crear Tarea Kanban

**Descripción:**  
Permite crear una tarea dentro de una columna Kanban, con asociación opcional a una Póliza.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- Usuario autenticado con rol OWNER o AGENT.
- Empresa con Suscripción activa.
- La columna Kanban existe, está activa y pertenece a la Empresa.
- Si se proporciona `polizaId`, la Póliza existe, está activa y pertenece a la Empresa.

**Flujo principal:**
1. El usuario selecciona “Crear tarea”.
2. Captura:
   - titulo
   - descripcion (opcional)
   - columnaKanbanId
   - polizaId (opcional)
3. El sistema valida las relaciones multi-tenant.
4. El sistema crea la tarea con:
   - `empresaId = usuario.empresaId`
   - `active = true`
5. Se registra auditoría.

**Reglas:**
- `columnaKanbanId` es obligatorio.
- `polizaId` puede ser NULL.
- El usuario no puede proporcionar un `empresaId` diferente al de su sesión.

---

---

---

---

---

#### RF-KAN-TAR-03 Ver detalle de Tarea Kanban

**Descripción:**  
Permite consultar una tarea Kanban y sus relaciones con la columna y la Póliza, si existe.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- La tarea existe, está activa y pertenece a la Empresa del usuario.

**Flujo principal:**
1. El usuario selecciona una tarea.
2. El sistema muestra:
   - id
   - titulo
   - descripcion
   - columna Kanban
   - Póliza asociada, si existe
   - createdAt
   - updatedAt

**Reglas:**
- No se exponen tareas fuera del tenant.
- La ausencia de `polizaId` no debe impedir consultar la tarea.

---

---

---

---

---

#### RF-KAN-TAR-04 Editar o Mover Tarea Kanban

**Descripción:**  
Permite modificar los datos de una tarea y moverla a otra columna Kanban de la misma Empresa.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- La tarea pertenece a la Empresa del usuario y está activa.
- La nueva columna pertenece a la misma Empresa y está activa.
- Si se proporciona `polizaId`, la Póliza pertenece a la misma Empresa.

**Flujo principal:**
1. El usuario selecciona una tarea.
2. Puede modificar:
   - titulo
   - descripcion
   - columnaKanbanId
   - polizaId (puede establecerse o limpiarse con NULL)
3. El sistema valida la coherencia multi-tenant.
4. Guarda los cambios y actualiza `updatedAt`.
5. Se registra auditoría.

**Reglas:**
- No se puede cambiar `empresaId`.
- No se permite mover la tarea a una columna inactiva o de otra Empresa.
- La Póliza es opcional y puede quitarse de la tarea.

---

---

---

---

---

#### RF-KAN-TAR-05 Eliminar (Desactivar) Tarea Kanban

**Descripción:**  
Permite desactivar una tarea Kanban mediante eliminación lógica.

**Roles:**
- OWNER
- AGENT

**Precondiciones:**
- La tarea pertenece a la Empresa del usuario.

**Flujo principal:**
1. El usuario selecciona “Eliminar” o “Desactivar”.
2. El sistema solicita confirmación.
3. El sistema actualiza `active = false`.
4. Se registra auditoría.

**Reglas:**
- No se permite eliminación física.
- La Póliza asociada, si existe, no se modifica ni se elimina.

---

---

---

---

---

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

---

---

---

---

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

---

---

---

---

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

---

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

---

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

---

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

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

---

---

---

---

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

---

---

---

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

---

---

---

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
