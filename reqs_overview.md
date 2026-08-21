> Secciones 1 y 2 del documento CRM SeguroPro del 2026-02-24: introducción, alcance,
> visión general y **catálogo de entidades**. Los requerimientos (sección 3) se
> repartieron entre `reqs_done.md` y `reqs_pending.md`.
>
> OJO: el catálogo de entidades de la sección 2.3 y los requerimientos de la sección 3
> no siempre coinciden en nombres de campo. Ver `CLAUDE.md` para las contradicciones
> detectadas.

## 1. Introducción

### 1.1 Objetivo del documento

El presente documento tiene como objetivo definir de manera clara, estructurada y formal los requerimientos funcionales para la implementación del **CRM SeguroPro**, un sistema SaaS multi-tenant orientado a la gestión integral de operaciones de agentes y despachos de seguros.

El sistema permitirá administrar de manera centralizada:

- Empresas (tenants) dentro del modelo SaaS.
- Gestión de usuarios por empresa (OWNER, AGENT y CLIENT).
- Catálogo de aseguradoras por empresa.
- Gestión de clientes asegurados.
- Administración de pólizas.
- Gestión y seguimiento de siniestros.
- Control de hitos y alertas operativas.
- Administración de archivos asociados a pólizas y siniestros.
- Control de suscripciones, planes y facturación SaaS.

Este documento establece la base estructural del sistema, sirviendo como referencia para análisis, diseño, desarrollo e implementación bajo un enfoque modular, escalable y orientado a buenas prácticas de arquitectura multi-tenant.

---

### 1.2 Alcance del sistema

El sistema incluirá las siguientes funcionalidades principales:

#### 1.2.1 Gestión SaaS (Nivel Plataforma)

- Administración global del catálogo de planes.
- Gestión de empresas (tenants).
- Control de suscripciones activas e históricas.
- Registro de órdenes asociadas a ciclos de facturación.
- Validación automática de acceso según estatus de suscripción.
- Control de límites de uso según plan contratado.

#### 1.2.2 Gestión de Usuarios

- Registro, edición y administración de usuarios:
  - MASTER_ADMIN
  - OWNER
  - AGENT
  - CLIENT
- Asignación de roles y control de permisos.
- Autenticación y control de seguridad.
- Validación de aislamiento multi-tenant.
- Restricciones de unicidad de correo por empresa.

#### 1.2.3 Gestión de Aseguradoras

- Creación y administración del catálogo interno de aseguradoras por empresa.
- Validación de unicidad por tenant.
- Asociación de aseguradoras a pólizas.

#### 1.2.4 Gestión de Clientes Asegurados

- Administración de usuarios con rol CLIENT.
- Registro y edición de información extendida (ClienteDetalle).
- Consulta histórica de pólizas y siniestros asociados.

#### 1.2.5 Gestión de Pólizas

- Registro de pólizas asociadas a:
  - Empresa
  - Cliente
  - Aseguradora
- Control de vigencia y estatus.
- Validación de duplicados por empresa.
- Asociación de archivos digitales.
- Registro del usuario creador de la póliza.

#### 1.2.6 Gestión de Kanban y Tareas

- Configuración de columnas Kanban por Empresa.
- Registro de tareas operativas dentro de una columna Kanban.
- Asociación opcional de una tarea con una Póliza.
- Movimiento de tareas entre columnas de la misma Empresa.

#### 1.2.7 Gestión de Siniestros

- Registro de siniestros asociados a una póliza.
- Control de estatus del proceso.
- Registro de montos estimados y pagados.
- Asociación de archivos digitales.
- Seguimiento operativo del caso.

#### 1.2.8 Gestión de Hitos y Alertas

- Registro de tareas críticas por siniestro.
- Definición de fechas límite.
- Generación de alertas automáticas por vencimiento.
- Asignación de responsables operativos.

#### 1.2.9 Gestión de Documentos

- Almacenamiento de metadatos de archivos.
- Asociación de documentos a pólizas y siniestros.
- Integración con servicios de almacenamiento externo (S3, Azure Blob u otros).
- Eliminación lógica para preservación histórica.

---

### 1.3 Público objetivo

El sistema está dirigido a los siguientes perfiles:

#### 1.3.1 Administrador Master (SaaS)

- Gestión global del catálogo de planes.
- Supervisión del sistema.
- Control de suscripciones y facturación.
- Administración técnica y soporte general.

#### 1.3.2 Propietario de la Empresa  
  
- Administración integral de su empresa.  
- Gestión de usuarios internos.  
- Supervisión de pólizas y siniestros.  
- Control operativo completo del entorno.  
  
#### 1.3.3 Agentes de Seguros  
  
- Registro y administración de pólizas.  
- Gestión de siniestros.  
- Registro de hitos y seguimiento operativo.  
- Carga y gestión de documentación.  
  
#### 1.3.4 Clientes Asegurados (si se habilita acceso)  
  
- Consulta de pólizas vigentes e históricas.  
- Consulta del estatus de siniestros.  
- Visualización de documentos asociados.
___
## 2. Visión general del sistema

### 2.1 Entidades principales

El sistema estará compuesto por un conjunto de entidades que representan la estructura administrativa, comercial y operativa del CRM SeguroPro bajo un modelo SaaS multi-tenant.

La arquitectura del sistema se divide en cuatro niveles claramente definidos:

1. **Nivel Plataforma (Global)**
   - MASTER_ADMIN.
   - Gestión del catálogo de planes.
   - Control global de empresas registradas.
   - Supervisión de suscripciones y órdenes.
   - Administración técnica del sistema.

2. **Nivel Tenant (Empresa Cliente del SaaS)**
   - Empresa que contrata el servicio.
   - Entorno aislado e independiente.
   - Configuración propia.
   - Suscripción activa asociada a un plan.
   - Control de límites según plan contratado.

3. **Nivel Usuarios del Tenant**
   - OWNER (propietario principal de la empresa).
   - AGENT (agentes de seguros).
   - CLIENT (clientes asegurados, si se habilita acceso).
   - Gestión de autenticación, roles y permisos internos.

4. **Nivel Operativo (Datos del Negocio Asegurador)**
   - Aseguradoras (catálogo por empresa).
   - Columnas Kanban y tareas configurables por Empresa.
   - Clientes asegurados (User con rol CLIENT + ClienteDetalle).
   - Pólizas.
   - Archivos de póliza.
   - Siniestros.
   - Hitos de siniestro.
   - Archivos de siniestro.

---

Cada entidad incluirá:

- Datos correspondientes al modelo de negocio (información funcional y operativa).
- Datos necesarios para el desarrollo técnico y control del sistema (identificadores únicos, fechas, estatus, referencias a empresaId, auditoría, etc.).

La estructura busca mantener separación clara entre:

- Configuración SaaS (planes, suscripciones y órdenes).
- Gestión organizacional (empresa y usuarios).
- Operación aseguradora (clientes, pólizas y siniestros).

---
### 2.2 Principios generales del sistema

1. Modelo Multi-Tenant

   - Cada Empresa registrada tendrá un entorno completamente aislado.
   - Todos los registros operativos deberán contener obligatoriamente un `empresaId`.
   - No existirá acceso cruzado de información entre empresas.
   - Las validaciones multi-tenant serán obligatorias en la capa de aplicación y recomendadas en la base de datos mediante claves foráneas, índices y restricciones.

2. Aislamiento de usuarios

   - Un usuario pertenece a una única Empresa, excepto el MASTER_ADMIN.
   - Si una persona opera en dos empresas distintas, deberá contar con cuentas independientes.
   - El acceso y visibilidad de datos estarán determinados por:
     - `empresaId`
     - Rol asignado
     - Estatus del usuario.

3. Eliminación lógica

   - Ningún registro será eliminado físicamente de la base de datos.
   - Se utilizará un campo lógico `active = false` para deshabilitar registros.
   - Esto permitirá mantener:
     - Integridad histórica.
     - Trazabilidad administrativa.
     - Consistencia de la información operativa y financiera.

4. Control de acceso y validaciones de rol

   - Todas las acciones estarán protegidas mediante validaciones de rol.
   - Solo roles autorizados podrán:
     - Crear o modificar pólizas.
     - Registrar y actualizar siniestros.
     - Gestionar usuarios internos.
     - Administrar suscripciones (según nivel).
   - El acceso a registros inactivos quedará restringido a perfiles autorizados.

5. Control por suscripción (Modelo SaaS)

   - Antes de permitir acciones de escritura, el sistema validará que la Empresa tenga una suscripción activa.
   - Si no existe suscripción activa o su estatus es distinto de ACTIVA o TRIAL:
     - Se bloquearán operaciones de creación o modificación.
     - Podrá permitirse acceso en modo solo lectura, según la política definida.
   - Los límites definidos en el Plan (usuarios, almacenamiento u otros) deberán validarse en tiempo de operación.

6. Consistencia relacional

   - Todas las relaciones entre entidades deberán validar coherencia de `empresaId`.
   - No se permitirá que una póliza, siniestro o archivo haga referencia a registros pertenecientes a otra Empresa.
   - Las restricciones críticas deberán reforzarse mediante:
     - Validaciones en la capa de aplicación.
     - Claves foráneas e índices en la base de datos.
___
### 2.3 Catálogo de Entidades

#### Plan (Catálogo)

Representa el catálogo de planes comerciales disponibles en SeguroPro.  
Un Plan define el precio, la periodicidad, los límites de uso y las funcionalidades habilitadas para las Empresas.

Los Planes son entidades de configuración del sistema y no representan compras, pagos ni suscripciones activas.

##### Modelo de Negocio

| Campo        | Tipo                 | Obligatorio | Notas                       |
| ------------ | -------------------- | ----------- | --------------------------- |
| id           | UUID                 | Sí          | PK                          |
| nombre       | string               | Sí          | Ej. Básico, Pro, Enterprise |
| descripcion  | string               | No          | Descripción breve del plan  |
| precio       | decimal              | Sí          | Precio por periodo          |
| periodicidad | enum(MENSUAL, ANUAL) | Sí          | Define el ciclo de cobro    |

##### Límites de Uso

| Campo                  | Tipo    | Obligatorio | Notas                                |
| ---------------------- | ------- | ----------- | ------------------------------------ |
| limiteUsuarios         | integer | Sí          | Máximo de usuarios por Empresa       |
| limiteAlmacenamientoGB | integer | No          | Límite de almacenamiento por Empresa |

##### Funcionalidades Habilitadas

| Campo                 | Tipo    | Obligatorio | Notas                              |
| --------------------- | ------- | ----------- | ---------------------------------- |
| permiteOCR            | boolean | Sí          | Habilita OCR de pólizas            |
| permiteKanban         | boolean | Sí          | Habilita tablero CRM               |
| permiteNotificaciones | boolean | Sí          | Habilita notificaciones por correo |
| permiteIA             | boolean | Sí          | Habilita funcionalidades de IA     |

##### Operatividad del Sistema

| Campo     | Tipo     | Obligatorio | Notas        |
| --------- | -------- | ----------- | ------------ |
| active    | boolean  | Sí          | Baja lógica  |
| createdAt | datetime | Sí          |              |
| updatedAt | datetime | Sí          |              |

##### Reglas del Sistema

- Los Planes son administrados exclusivamente por el MASTER_ADMIN.
- No deben eliminarse físicamente si existen Suscripciones asociadas.
- Si cambian precios o límites, se recomienda crear un nuevo Plan para preservar historial.

---

#### Empresa

Representa a la empresa, despacho o agente independiente que contrata el sistema SeguroPro.  
Constituye el entorno aislado (tenant) dentro del modelo SaaS.

La entidad Empresa es obligatoria para garantizar el aislamiento multi-tenant.  
En fases iniciales (MVP), los datos fiscales podrán ser opcionales para reducir fricción en el registro.

##### Modelo de Negocio

| Campo            | Tipo                | Obligatorio | Notas |
|------------------|--------------------|------------|------|
| id               | UUID               | Sí         | PK |
| razonSocial      | string             | No         | Nombre fiscal |
| nombreComercial  | string             | No         | Nombre visible en el sistema |
| rfc              | string             | No         | UNIQUE recomendado por Empresa |
| tipoPersona      | enum(FISICA, MORAL)| No         | Clasificación fiscal |
| emailContacto    | string (email)     | Sí         | Requerido para creación |
| telefonoContacto | string             | Sí         | Requerido para creación |
| pais             | string             | No         | |
| estado           | string             | No         | |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|-----------|-----------|------------|------|
| active    | boolean   | Sí         | Baja lógica |
| createdAt | datetime  | Sí         | |
| updatedAt | datetime  | Sí         | |

##### Reglas del Sistema

- La entidad Empresa es obligatoria para el modelo multi-tenant.
- Todos los registros operativos deben referenciar un `empresaId`.
- Cada Empresa debe tener exactamente un usuario con rol OWNER.
- La relación con Plan se gestiona exclusivamente a través de la entidad Suscripción.
- No debe eliminarse físicamente si existen registros operativos asociados.

___

#### Usuario

Entidad única de usuarios del sistema encargada de la autenticación y control de acceso.  
Todos los usuarios pertenecen a una Empresa, excepto el MASTER_ADMIN.

Tipos de usuario:

- MASTER_ADMIN → Administrador global del SaaS.
- OWNER → Propietario principal de la Empresa (único por empresa).
- AGENT → Agente operativo de la Empresa.
- CLIENT → Cliente asegurado con acceso al sistema (si se habilita).

##### Modelo de Negocio

| Campo     | Tipo                                     | Obligatorio | Notas                                              |
| --------- | ---------------------------------------- | ----------- | -------------------------------------------------- |
| id        | UUID                                     | Sí          | PK                                                 |
| empresaId | UUID                                     | Condicional | NULL solo si role = MASTER_ADMIN                   |
| role      | enum(MASTER_ADMIN, OWNER, AGENT, CLIENT) | Sí          | Rol base del usuario                               |
| firstName | string                                   | Sí          |                                                    |
| lastName  | string                                   | Sí          |                                                    |
| email     | string (email válido)                    | Sí          | UNIQUE recomendado por Empresa (empresaId + email) |
| phone     | string                                   | Sí          |                                                    |

##### Seguridad y Autenticación

| Campo        | Tipo                             | Obligatorio | Notas |
|-------------|----------------------------------|------------|------|
| passwordHash| string                           | Sí         | Puede ser NULL si se utiliza SSO/OAuth |
| status      | enum(ACTIVE, SUSPENDED, BLOCKED) | Sí         | Control de acceso |
| lastLoginAt | datetime                         | No         | Último acceso registrado |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|-----------|-----------|------------|------|
| active    | boolean   | Sí         | Baja lógica |
| createdAt | datetime  | Sí         | |
| updatedAt | datetime  | Sí         | |

##### Reglas del Sistema

- CHECK: (role = MASTER_ADMIN) ⇒ (empresaId IS NULL)
- CHECK: (role != MASTER_ADMIN) ⇒ (empresaId IS NOT NULL)
- Debe existir exactamente un usuario con role = OWNER por cada Empresa.
- Restricción recomendada: UNIQUE (empresaId, email)
- Solo usuarios con `status = ACTIVE` y `active = true` pueden autenticarse.

___

#### Suscripción

Representa el contrato o estado de servicio entre una Empresa y un Plan durante un periodo determinado.  
Permite llevar historial de planes contratados, renovaciones, vencimientos y estatus de acceso.

Relaciones:
- Empresa 1—N Suscripción (historial).
- Suscripción N—1 Plan (catálogo).

##### Modelo de Negocio

| Campo      | Tipo                                                | Obligatorio | Notas                                             |
| ---------- | --------------------------------------------------- | ----------- | ------------------------------------------------- |
| id         | UUID                                                | Sí          | PK                                                |
| empresaId  | UUID                                                | Sí          | FK a Empresa                                      |
| planId     | UUID                                                | Sí          | FK a Plan                                         |
| status     | enum(TRIAL, ACTIVA, VENCIDA, SUSPENDIDA, CANCELADA) | Sí          | Estado actual de la suscripción                   |
| `esActiva` | boolean                                             | Sí          | Indica si es la suscripción vigente de la Empresa |

##### Ciclo de Facturación

| Campo                | Tipo     | Obligatorio | Notas |
| -------------------- | -------- | ----------- | --------------------------- |
| fechaInicio          | datetime | Sí          | Inicio de vigencia |
| fechaFin             | datetime | No          | Fin de vigencia (si aplica) |
| fechaProximoPago     | datetime | Sí          | Próxima fecha de cobro o renovación |
| renovacionAutomatica | boolean  | No          | Indica si la renovación es automática |

##### Operatividad del Sistema

| Campo     | Tipo     | Obligatorio | Notas                    |
| --------- | -------- | ----------- | ------------------------ |
| active    | boolean  | Sí          | Baja lógica del registro |
| createdAt | datetime | Sí          |                          |
| updatedAt | datetime | Sí          |                          |

##### Reglas del Sistema

- Solo puede existir una Suscripción con `active = true` por Empresa.
  - Restricción recomendada: UNIQUE (empresaId) WHERE (active = true)
- Si `active = true`, entonces `status` debe ser TRIAL o ACTIVA.
- Si `status` cambia a VENCIDA, SUSPENDIDA o CANCELADA:
  - El sistema debe establecer `active = false`.
- El control de acceso del sistema debe basarse en la Suscripción activa:
  - Si no existe Suscripción activa o `status` ≠ ACTIVA/TRIAL → bloquear operaciones de escritura.
- La eliminación de una Suscripción debe ser lógica (activeRecord = false).

___

#### Orden

Representa un evento de cobro asociado a una Suscripción (un ciclo de facturación).
Permite registrar el historial de pagos, intentos, fallos y confirmaciones provenientes del proveedor de pago.

Relaciones:
- Suscripción 1—N Orden.
- (Opcional) Usuario 1—N Orden (creadaPor).

##### Modelo de Negocio

| Campo            | Tipo                                | Obligatorio | Notas |
|------------------|-------------------------------------|------------|------|
| id               | UUID                                | Sí         | PK |
| suscripcionId    | UUID                                | Sí         | FK a Suscripción |
| cicloInicio      | datetime                            | Sí         | Inicio del periodo facturado |
| cicloFin         | datetime                            | Sí         | Fin del periodo facturado |
| monto            | decimal                             | Sí         | Total cobrado |
| moneda           | string                              | Sí         | Ej. MXN, USD |
| status           | enum(PENDIENTE, PAGADA, FALLIDA, CANCELADA, REEMBOLSADA) | Sí | Estado de la orden |
| creadoPorUsuarioId | UUID                              | No         | FK a Usuario (NULL si fue generada automáticamente) |

##### Integración con Proveedor de Pago (Opcional)

| Campo                 | Tipo     | Obligatorio | Notas |
|-----------------------|----------|------------|------|
| proveedor             | string   | No         | Ej. Stripe, MercadoPago |
| proveedorOrdenId      | string   | No         | ID externo de la orden |
| proveedorPagoId       | string   | No         | ID externo del pago |
| pagadaEn              | datetime | No         | Fecha real de confirmación |
| motivoFallo           | string   | No         | Descripción resumida del fallo |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|-----------|-----------|------------|------|
| active    | boolean   | Sí         | Baja lógica |
| createdAt | datetime  | Sí         | |
| updatedAt | datetime  | Sí         | |

##### Reglas del Sistema

- Cada Orden pertenece a una Suscripción y representa un ciclo de facturación.
- No debe existir más de una Orden en estado PAGADA para el mismo rango de ciclo (`suscripcionId + cicloInicio + cicloFin`).
- Si una Orden cambia a PAGADA:
  - La Suscripción debe actualizar su `fechaProximoPago` según la periodicidad del Plan.
- `creadoPorUsuarioId` es opcional:
  - NULL si la orden fue generada automáticamente por el proveedor.
  - Se registra si fue creada manualmente por un usuario con rol OWNER.

___

#### Aseguradora

Representa el catálogo de compañías aseguradoras disponibles dentro de una Empresa (tenant).
Cada Empresa administra su propio catálogo de Aseguradoras.

No es un catálogo global del sistema; cada entorno es independiente.

Relaciones:
- Empresa 1—N Aseguradora.

##### Modelo de Negocio

| Campo        | Tipo    | Obligatorio | Notas |
|-------------|---------|------------|------|
| id          | UUID    | Sí         | PK |
| empresaId   | UUID    | Sí         | FK a Empresa |
| nombre      | string  | Sí         | Nombre de la aseguradora |
| descripcion | string  | No         | Texto opcional de referencia interna |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|-----------|-----------|------------|------|
| active    | boolean   | Sí         | Baja lógica |
| createdAt | datetime  | Sí         | |
| updatedAt | datetime  | Sí         | |

##### Reglas del Sistema

- El nombre de la Aseguradora debe ser único por Empresa.
  - Restricción recomendada: UNIQUE (empresaId, nombre)
- No debe eliminarse físicamente si existen Pólizas asociadas.
- Toda Póliza debe estar asociada a una Aseguradora perteneciente a la misma Empresa.

___
#### Detalle de Cliente

Almacena información extendida del cliente asegurado.
Aplica únicamente a usuarios con rol `CLIENT`.

Relación:
- Usuario (CLIENT) 1—1 Detalle de Cliente

##### Información Extendida

| Campo           | Tipo                | Obligatorio | Notas |
|-----------------|--------------------|------------|------|
| id              | UUID               | Sí         | PK |
| usuarioId       | UUID               | Sí         | FK a Usuario (role = CLIENT) |
| rfcTaxId        | string             | No         | RFC / Tax ID |
| tipoPersona     | enum(FISICA, MORAL)| No         | |
| fechaNacimiento | date               | No         | Solo aplica a persona física |
| direccion       | string             | No         | Calle y número |
| colonia         | string             | No         | |
| ciudad          | string             | No         | |
| estado          | string             | No         | |
| codigoPostal    | string             | No         | |
| pais            | string             | No         | |
| notasInternas   | text               | No         | Notas del agente |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|------------|-----------|------------|------|
| active     | boolean   | Sí         | Baja lógica |
| createdAt  | datetime  | Sí         | |
| updatedAt  | datetime  | Sí         | |

##### Reglas del Sistema

- Debe existir máximo un registro DetalleCliente por `usuarioId`.
  - Restricción recomendada: UNIQUE (usuarioId)
- Validación obligatoria: el Usuario asociado debe tener role = CLIENT.
- El `empresaId` no se duplica en esta entidad; se obtiene desde Usuario.

___
#### Columna Kanban

Representa una columna configurable del tablero Kanban de una Empresa. Cada registro permite que la Empresa defina sus propias columnas, sin depender de un catálogo fijo de estatus.

Relaciones:
- Empresa 1—N Columna Kanban.
- Columna Kanban 1—N TAREA KANBAN.

##### Modelo de Negocio

| Campo      | Tipo    | Obligatorio | Notas |
|------------|---------|-------------|-------|
| id         | UUID    | Sí          | PK |
| empresaId  | UUID    | Sí          | Identificador de la Empresa (company id); FK a Empresa |
| nombre     | string  | Sí          | Nombre visible de la columna |
| prioridad  | integer | Sí          | Prioridad u orden numérico dentro de la Empresa |

##### Operatividad del Sistema

| Campo     | Tipo     | Obligatorio | Notas       |
| --------- | -------- | ----------- | ----------- |
| createdAt | datetime | Sí          |             |
| updatedAt | datetime | Sí          |             |

##### Reglas del Sistema

- Cada COLUMNA KANBAN debe pertenecer a una sola Empresa.
- No debe existir acceso cruzado entre Empresas.
- `prioridad` debe ser un número entero positivo y se recomienda que sea única por Empresa: UNIQUE (empresaId, prioridad).
- Las Pólizas no tienen una columna Kanban directa; la relación se gestiona mediante TAREA KANBAN.

___
#### Tarea Kanban

Representa una actividad operativa dentro del tablero Kanban de una Empresa. Una tarea siempre pertenece a una columna Kanban y puede asociarse opcionalmente con una Póliza. Esto permite registrar tareas generales de la Empresa que no estén relacionadas con una Póliza específica.

Relaciones:
- Empresa 1—N Tarea Kanban.
- Columna Kanban 1—N Tarea Kanban.
- Póliza 1—N Tarea Kanban (opcional desde la tarea).

##### Modelo de Negocio

| Campo           | Tipo   | Obligatorio | Notas                                                   |
| --------------- | ------ | ----------- | ------------------------------------------------------- |
| id              | UUID   | Sí          | PK                                                      |
| empresaId       | UUID   | Sí          | Identificador de la Empresa; FK a Empresa               |
| columnaKanbanId | UUID   | Sí          | FK a Columna Kanban de la misma Empresa; puede ser NULL |
| polizaId        | UUID   | No          | FK a Póliza de la misma Empresa; puede ser NULL         |
| titulo          | string | Sí          | Nombre o descripción corta de la tarea                  |
| descripcion     | text   | No          | Detalle adicional de la tarea                           |

##### Operatividad del Sistema

| Campo     | Tipo     | Obligatorio | Notas       |
| --------- | -------- | ----------- | ----------- |
| createdAt | datetime | Sí          |             |
| updatedAt | datetime | Sí          |             |

##### Reglas del Sistema

- Cada Tarea Kanban debe pertenecer a una sola Empresa.
- `polizaId` es opcional; si existe, la Póliza debe pertenecer a la misma Empresa.
- Una tarea sin `polizaId` es válida y representa una actividad general de la Empresa.
- No se permite asignar una tarea a una columna o Póliza de otra Empresa.
- Para mover una tarea de columna solo se permite usar una columna activa de la misma Empresa.

___
#### Póliza

Representa una póliza de seguro registrada dentro de una Empresa (tenant), incluyendo su etapa previa de **Cotización** y su trazabilidad de **Renovaciones**.

Cada Póliza pertenece a una Empresa y está asociada a:

- Un Cliente (Usuario con rol CLIENT).
- Una Aseguradora (catálogo propio de la Empresa).
- Un Usuario creador (OWNER o AGENT).
- (Opcional) Una póliza anterior, cuando se trata de una renovación.

Relaciones:
- Empresa 1—N Póliza.
- Usuario (CLIENT) 1—N Póliza.
- Aseguradora 1—N Póliza.
- Póliza 1—N TAREA KANBAN (opcional desde la tarea).
- Usuario (OWNER/AGENT) 1—N Póliza (creadoPor).
- Póliza (anterior) 1—0..1 Póliza (renovación).

##### Modelo de Negocio

| Campo               | Tipo                                                                 | Obligatorio | Notas |
|---------------------|----------------------------------------------------------------------|------------|------|
| id                  | UUID                                                                 | Sí         | PK |
| empresaId           | UUID                                                                 | Sí         | FK a Empresa |
| clienteUsuarioId    | UUID                                                                 | Sí         | FK a Usuario (role = CLIENT) |
| aseguradoraId       | UUID                                                                 | Sí         | FK a Aseguradora |
| polizaAnteriorId    | UUID                                                                 | No         | FK a Póliza (renovación). Debe pertenecer a la misma Empresa |
| ramo                | enum(AUTO, VIDA, HOGAR, NEGOCIO, OTRO)                               | Sí         | Tipo de póliza |
| numeroPoliza        | string                                                               | Condicional | Obligatorio cuando `status != COTIZACION` |
| primaNeta           | decimal                                                              | No         | |
| primaTotal          | decimal                                                              | No         | |
| fechaInicio         | date                                                                 | Condicional | Obligatorio cuando `status != COTIZACION` |
| fechaVencimiento    | date                                                                 | Condicional | Obligatorio cuando `status != COTIZACION` |
| status              | enum(COTIZACION, ACTIVA, PROXIMA_A_VENCER, VENCIDA, CANCELADA)       | Sí         | |
| creadoPorUsuarioId  | UUID                                                                 | Sí         | FK a Usuario (role = OWNER o AGENT) |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|------------|-----------|------------|------|
| active     | boolean   | Sí         | Baja lógica |
| createdAt  | datetime  | Sí         | |
| updatedAt  | datetime  | Sí         | |

##### Reglas del Sistema

- Consistencia multi-tenant obligatoria:
  - `Póliza.empresaId` debe coincidir con:
    - `Usuario.empresaId` (cliente).
    - `Aseguradora.empresaId`.
    - `creadoPorUsuarioId.empresaId`.
    - `polizaAnteriorId.empresaId` (si aplica).
- Kanban:
  - La Póliza no contiene una referencia directa a Kanban.
  - La relación con Kanban se realiza mediante TAREA KANBAN.
  - Una Póliza puede tener cero, una o varias tareas Kanban relacionadas.
- Renovación:
  - `polizaAnteriorId` es opcional y solo aplica cuando la póliza es renovación de otra.
  - No se permite que `polizaAnteriorId = id` (autorreferencia).
  - Se recomienda evitar ciclos en cadena (validación en aplicación).
  - Recomendación de restricción para evitar dos renovaciones simultáneas de la misma póliza:
    - UNIQUE (empresaId, polizaAnteriorId) WHERE (polizaAnteriorId IS NOT NULL) AND (active = true)
- Un cliente puede tener múltiples pólizas.
- Restricción recomendada para evitar duplicados (cuando exista `numeroPoliza`):
  - UNIQUE (empresaId, numeroPoliza, aseguradoraId)
- Validación de fechas (cuando aplique):
  - Si `fechaVencimiento` < `fechaInicio`, la operación debe rechazarse.
- Cotización:
  - Si `status = COTIZACION`, `numeroPoliza`, `fechaInicio` y `fechaVencimiento` pueden permanecer sin captura.
  - Para cambiar `status` de `COTIZACION` a `ACTIVA` se deben validar campos obligatorios.
- El campo `status` puede actualizarse automáticamente mediante proceso programado (cron) para:
  - PROXIMA_A_VENCER
  - VENCIDA
- Solo usuarios con rol OWNER o AGENT pueden crear pólizas.

___

#### Archivo

Representa un archivo digital asociado a una Póliza.
Solo almacena metadatos y la ubicación del archivo.
El archivo físico se almacena en un sistema externo (por ejemplo: S3, Azure Blob u otro proveedor).

Relaciones:
- Póliza 1—N Archivo.

##### Modelo de Negocio

| Campo      | Tipo    | Obligatorio | Notas |
|------------|---------|------------|------|
| id         | UUID    | Sí         | PK |
| polizaId   | UUID    | Sí         | FK a Póliza |
| mimeType   | string  | Sí         | Ej. application/pdf, image/jpeg |
| url        | string  | Sí         | Ruta o URL del almacenamiento externo |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|------------|-----------|------------|------|
| active     | boolean   | Sí         | Baja lógica |
| createdAt  | datetime  | Sí         | Fecha de carga |
| updatedAt  | datetime  | Sí         | |

##### Reglas del Sistema

- Un Archivo debe pertenecer a una única Póliza.
- La eliminación es exclusivamente lógica (`active = false`).
- El sistema no almacena archivos binarios en la base de datos.
- Se recomienda validar el `mimeType` contra una lista de tipos permitidos.

___
#### Siniestro

Representa un evento o reclamación asociada a una Póliza dentro de una Empresa.
Permite dar seguimiento operativo, registrar evidencias y controlar el estatus del proceso.

Relaciones:
- Empresa 1—N Siniestro.
- Póliza 1—N Siniestro.
- Usuario (CLIENT) 1—N Siniestro.
- Usuario (OWNER/AGENT) 1—N Siniestro (creadoPor).

##### Modelo de Negocio

| Campo               | Tipo                                                    | Obligatorio | Notas |
|---------------------|--------------------------------------------------------|------------|------|
| id                  | UUID                                                   | Sí         | PK |
| empresaId           | UUID                                                   | Sí         | FK a Empresa |
| polizaId            | UUID                                                   | Sí         | FK a Póliza |
| clienteUsuarioId    | UUID                                                   | Sí         | FK a Usuario (role = CLIENT) |
| tipoSiniestro       | string                                                 | No         | Ej. Colisión, Robo, Daños |
| fechaEvento         | date                                                   | Sí         | Fecha del evento |
| descripcion         | text                                                   | No         | Detalle del siniestro |
| ajustador           | string                                                 | No         | Nombre o referencia |
| montoEstimado       | decimal                                                | No         | |
| montoPagado         | decimal                                                | No         | |
| status              | enum(REPORTADO, EN_PROCESO, PAGADO, RECHAZADO, CERRADO) | Sí | Estado actual |

##### Auditoría

| Campo               | Tipo | Obligatorio | Notas |
|---------------------|------|------------|------|
| creadoPorUsuarioId  | UUID | Sí         | FK a Usuario (role = OWNER o AGENT) |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|------------|-----------|------------|------|
| active     | boolean   | Sí         | Baja lógica |
| createdAt  | datetime  | Sí         | |
| updatedAt  | datetime  | Sí         | |

##### Reglas del Sistema

- Consistencia multi-tenant obligatoria:
  - `Siniestro.empresaId` debe coincidir con `Póliza.empresaId`.
  - `clienteUsuarioId` debe coincidir con `Póliza.clienteUsuarioId`.
  - `creadoPorUsuarioId` debe pertenecer a la misma Empresa.
- Solo usuarios con rol OWNER o AGENT pueden registrar siniestros.
- El estado puede actualizarse manualmente o mediante reglas de negocio automatizadas.

___

#### Hito Siniestro

Representa una tarea/hito con fecha límite dentro del seguimiento de un Siniestro.
Se utiliza para controlar actividades críticas (jurídicas o administrativas) y generar alertas por vencimiento.

Relaciones:
- Siniestro 1—N Hito Siniestro
- (Opcional) User (OWNER/AGENT) 1—N Hito Siniestro (asignado a)

##### Modelo de Negocio

| Campo       | Tipo                                                        | Obligatorio | Notas                                             |
| ----------- | ----------------------------------------------------------- | ----------- | ------------------------------------------------- |
| id          | UUID                                                        | Sí          | PK                                                |
| siniestroId | UUID                                                        | Sí          | FK a Siniestro                                    |
| tarea       | string                                                      | Sí          | Ej. "Entregar reporte", "Presentar documentación" |
| descripcion | text                                                        | No          | Detalle del hito                                  |
| fechaLimite | datetime                                                    | Sí          | Fecha/hora límite                                 |
| alerta      | boolean                                                     | Sí          | Indica si debe generar alerta al vencer           |
| status      | enum(PENDIENTE, EN_PROCESO, COMPLETADO, VENCIDO, CANCELADO) | Sí          |                                                   |

##### Asignación (Opcional)

| Campo           | Tipo | Obligatorio | Notas |
|----------------|------|------------|------|
| asignadoAUserId| UUID | No         | FK a User (OWNER o AGENT) |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|-----------|-----------|------------|------|
| activo    | boolean   | Sí         | Baja lógica |
| createdAt | datetime  | Sí         | |
| updatedAt | datetime  | Sí         | |

##### Reglas del Sistema

- El hito siempre pertenece a un siniestro existente.
- Si `fechaLimite` < `createdAt`, rechazar operación.
- Si `alerta = true`, el sistema debe evaluar vencimientos y notificar según la estrategia (cron/job).
- `asignadoAUserId` debe pertenecer a la misma Empresa del siniestro y tener rol OWNER o AGENT.
- El status puede actualizarse automáticamente:
  - Si `fechaLimite` ya pasó y no está COMPLETADO/CANCELADO → marcar como VENCIDO.

___

#### Archivo de Siniestro

Representa un archivo digital asociado a un Siniestro.
Solo almacena metadatos y la ubicación del archivo.
El archivo físico se almacena en un sistema externo (por ejemplo: S3, Azure Blob u otro proveedor).

Relaciones:
- Siniestro 1—N Archivo de Siniestro.

##### Modelo de Negocio

| Campo       | Tipo   | Obligatorio | Notas                                 |
| ----------- | ------ | ----------- | ------------------------------------- |
| id          | UUID   | Sí          | PK                                    |
| siniestroId | UUID   | Sí          | FK a Siniestro                        |
| mimeType    | string | Sí          | Ej. application/pdf, image/jpeg       |
| url         | string | Sí          | Ruta o URL del almacenamiento externo |

##### Operatividad del Sistema

| Campo      | Tipo      | Obligatorio | Notas |
|------------|-----------|------------|------|
| active     | boolean   | Sí         | Baja lógica |
| createdAt  | datetime  | Sí         | Fecha de carga |
| updatedAt  | datetime  | Sí         | |

##### Reglas del Sistema

- Cada Archivo de Siniestro debe pertenecer a un único Siniestro.
- La eliminación es exclusivamente lógica (`active = false`).
- No se almacenan archivos binarios en la base de datos.
- Se recomienda validar el `mimeType` contra una lista de tipos permitidos.
- Si el Siniestro se desactiva, los archivos deben conservarse para mantener trazabilidad histórica.

___

#### Glosario

Representa un catálogo interno de términos y definiciones propias de cada Empresa.
Permite estandarizar conceptos operativos, técnicos o comerciales dentro del entorno del tenant.

No es un catálogo global del sistema.
Cada Empresa administra su propio Glosario de forma independiente.

Relaciones:
- Empresa 1—N Glosario

##### Modelo de Negocio

| Campo        | Tipo   | Obligatorio | Notas |
|-------------|--------|------------|------|
| id          | UUID   | Sí         | PK |
| empresaId   | UUID   | Sí         | FK a Empresa |
| titulo      | string | Sí         | Término o concepto |
| descripcion | text   | Sí         | Definición del término |

##### Operatividad del Sistema

| Campo      | Tipo     | Obligatorio | Notas |
|------------|----------|------------|------|
| active     | boolean  | Sí         | Baja lógica |
| createdAt  | datetime | Sí         | |
| updatedAt  | datetime | Sí         | |

##### Reglas del Sistema

- El `titulo` debe ser único por Empresa.
  - Restricción recomendada: UNIQUE (empresaId, titulo)
- No debe existir acceso cruzado entre Empresas.
- La eliminación es exclusivamente lógica (`active = false`).
- Solo usuarios con rol OWNER o AGENT pueden crear o modificar términos del Glosario.

____
