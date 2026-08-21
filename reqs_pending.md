# Requerimientos pendientes

> Fuente: documento CRM SeguroPro del 2026-02-24. Ver `reqs_done.md` para lo
> implementado y `reqs_overview.md` para el catálogo de entidades.

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
