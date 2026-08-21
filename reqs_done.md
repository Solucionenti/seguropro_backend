> **SUPERADO por `2026-02-24-CRM-SEGUROPRO.md`.**
> Ese archivo es la fuente de verdad de requerimientos.
> Se conserva este solo por el corte histórico de implementado vs pendiente, que el
> documento nuevo no distingue. Los 86 RF que comparten ambos son idénticos palabra
> por palabra; el nuevo agrega RF-KAN-COL-01..05 y RF-KAN-TAR-01..05, y elimina
> RF-KANBAN-POL-01. No editar este archivo: editar el nuevo.

## 3 Requerimientos

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
CHECKPOINT