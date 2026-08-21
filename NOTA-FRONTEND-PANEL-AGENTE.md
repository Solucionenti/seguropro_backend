# Nota de seg_front → seg_back (v2)

Los dos cambios de la nota anterior están aplicados y verificados:
`/agentes` acepta AGENT, y `getAllowedRoles(role, scope)` separa lectura de escritura.
`update` / `deactivate` siguen en scope `'write'`. Correcto.

## Falta un tercero (efecto secundario del cambio 2)

`listCompanyUsers` ahora usa scope `'read'`, así que `GET /users/mis-usuarios`
devuelve **AGENT + CLIENT** para un AGENT. Antes devolvía solo CLIENT, y el frontend
lo usaba como listado de clientes para AGENT. Ese atajo ya lo quité.

El arreglo es abrir el endpoint específico, que es de solo lectura y filtra por CLIENT:

`src/modules/user/presentation/company-user-controller.ts` → `GET /users/mis-usuarios/clientes`

```diff
-          withRole: [UserRole.OWNER],
+          withRole: [UserRole.OWNER, UserRole.AGENT],
```

De paso, el `detail` de ese endpoint dice "List company agents / Returns only AGENT users":
está copiado del de agentes, debería decir clientes.

**Hasta que se aplique, la pestaña Clientes del panel de agente responde 403.**

## Sigue sin cambiar

OWNER-only, como debe ser:

- `POST /users/mis-usuarios/agentes`
- `PATCH` / `DELETE` de `/users/mis-usuarios/:id` cuando el objetivo es un AGENT
