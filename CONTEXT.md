# CONTEXT.md — FundDreams (Crowdfunding Frontend)

> Pega este archivo al inicio de cada chat nuevo con Claude. Resume todo lo necesario para trabajar el Sprint 3 sin repetir explicaciones.

## 1. Quién soy y cómo trabajo
- Soy estudiante, **no sé programar ni usar GitHub a fondo**. Necesito instrucciones paso a paso, con comandos listos para copiar.
- Trabajo en el **frontend**. El backend lo hace otro grupo.
- Metodología Scrum. Sprints 1 y 2 terminados. Falta el **Sprint 3 (último)**.
- PC temporal de la universidad (Kali Linux). Todo debe quedar en GitHub (`git push` al terminar cada sesión). Nunca guardar tokens en el PC.
- Respuestas en español, claras, un paso a la vez.

## 2. Repositorios
- Frontend: https://github.com/EBP02-CodeFactory-2026-2/crowfunding-frontend
- Backend (otro grupo): https://github.com/EBP02-CodeFactory-2026-2/crowfunding-backend
- API en producción: `https://crowfunding-backend.onrender.com` (prefijo `/api/v1`). Render puede tardar en "despertar" en la primera petición.
- Rama de trabajo actual: `feature/sprint3` (sale de `main`). Los sprints anteriores se integraron con Pull Requests (`feature/...` → `main`).

## 3. Stack
- Next.js 16.3.5 (App Router, carpeta `src/`), React 19.2.8, TypeScript 5, Tailwind CSS 4.
- Sin librerías de UI adicionales. Tema claro forzado.
- Scripts: `npm run dev` (http://localhost:3000), `npm run build`, `npm start`.

## 4. Estructura actual del código
```
src/app/layout.tsx, page.tsx, globals.css
src/app/login/page.tsx
src/app/register/page.tsx
src/app/projects/page.tsx                 (listado público)
src/app/projects/[id]/page.tsx            (detalle)
src/app/projects/[id]/edit/page.tsx
src/app/projects/my-projects/page.tsx
src/app/projects/new/page.tsx
src/components/Navbar.tsx, ProjectCard.tsx, RiskLabel.tsx
src/lib/api.ts          (HOST del backend y llamadas)
src/lib/auth.ts         (sesión / token)
src/lib/useUnsavedChanges.ts
src/types/index.ts      (tipos según contrato del backend)
```
Regla: las pantallas nuevas deben **imitar el estilo** de las existentes (revisar `ProjectCard.tsx`, `RiskLabel.tsx`, `Navbar.tsx`) y reutilizar `src/lib/api.ts` y `src/types/index.ts`.

## 5. Backend: contrato de la API
Auth: JWT. Header `Authorization: Bearer <accessToken>`.

| Método | Endpoint | Seguridad | Función |
|---|---|---|---|
| POST | /api/v1/auth/register | Público | Registro |
| POST | /api/v1/auth/login | Público | Login (devuelve accessToken, user) |
| POST | /api/v1/projects | Protegido | Crear borrador (campos pueden ir vacíos) |
| GET | /api/v1/projects | Público | Listar ACTIVE. Filtro `?riskTag=ALTO,MEDIO,BAJO` |
| GET | /api/v1/projects/{id} | Público | Detalle |
| GET | /api/v1/projects/me | Protegido | Mis proyectos |
| PUT | /api/v1/projects/{id} | Protegido | Editar (en ACTIVE, meta y plazo son inmutables, 409 si se envían) |
| DELETE | /api/v1/projects/{id} | Protegido | Eliminar solo si no tiene aportes |
| POST | /api/v1/projects/{id}/publish | Protegido | Publicar y calcular riesgo |
| POST | /api/v1/projects/{id}/contributions | Protegido | Aportar |
| GET | /api/v1/contributions/me | Protegido | Mis aportes. Filtro `?status=COMPLETED` |
| GET | /api/v1/contributions/me/{id}/receipt | Protegido | Comprobante (JSON) |
| POST | /api/v1/projects/{id}/process-closure | Sistema/Admin | Cierre y reembolsos (NO lo usa el front) |
| ??? | Notificaciones | — | **Aún no existen.** El backend los agregará después |

### Formato de error unificado
```json
{ "timestamp": "...", "status": 400, "error": "Bad Request", "message": "...", "path": "/api/v1/...", "details": null }
```
En errores de validación, `details` es un arreglo `[{ "field": "...", "issue": "..." }]`.
Error 401 (token inválido/ausente/expirado), formato simplificado: `{ "status": 401, "error": "Unauthorized", "message": "Token inválido o ausente" }`.

### Proyecto (respuestas de listar / detalle)
Campos: `id, title, description, imageUrl, fundingGoal, currentAmount, deadline, status, riskTag, creator{id, fullName}, createdAt`.
- `status`: `DRAFT | ACTIVE | FUNDED | FAILED | DELETED`
- `riskTag` (texto): `"Riesgo Alto" | "Riesgo Medio" | "Riesgo Bajo"` (puede ser null en DRAFT)
- **NO viene `riskScore`** en listar ni detalle (solo en la respuesta de publicar).

### Aportar (POST .../contributions)
Request: `{ amount, paymentMethod: "SIMULATED_CARD", nonce: "<uuid único por intento>", riskWarningAccepted: true|false }`
Response: `{ contributionId, projectId, amount, status, transaction{referenceCode, paymentMethod, processedAt}, projectNewAmount, createdAt }`
Reglas y errores:
- Monto mínimo **$10.000** (400).
- Proyecto "Riesgo Alto" y `riskWarningAccepted` false/nulo → 400.
- Proyecto FUNDED o FAILED → **403**. Proyecto no ACTIVE → 409.
- Nonce repetido o error de pasarela → 422. **Generar un nonce nuevo (uuid) en cada intento.**
- Aportar a su propio proyecto → 403 (si aplica).

### Mis aportes (GET /contributions/me)
Lista: `[{ id, projectName, projectId, amount, status, createdAt }]`, de más reciente a más antiguo, con `?status=` opcional.
- Estados reales: **`COMPLETED`, `REFUNDED`, `CANCELLED`** (y `PENDING` en el modelo).
- `DECLINED` NO existe (fue error de redacción del backend).
- Mapeo a texto en pantalla (los prototipos usan estos nombres):
  - `COMPLETED` → **Aprobado**
  - `REFUNDED` → **Reembolsado**
  - `CANCELLED` → **Fallido**
  - `PENDING` → **Pendiente**

### Comprobante (GET /contributions/me/{id}/receipt)
```json
{ "receiptId": "RCP-...", "contributionId": "...", "projectName": "...", "amount": 50000.00, "status": "COMPLETED",
  "transactionDetails": { "referenceCode": "MOCK-REF-...", "paymentMethod": "SIMULATED_CARD **** 4242", "processedAt": "..." },
  "generatedAt": "..." }
```
Errores: 403 (no es titular), 404 (no existe), 409 (aporte CANCELLED: no hay comprobante). El enmascarado de tarjeta lo hace el backend. La "descarga" se hace desde el front (imprimir / guardar como PDF o archivo generado en el navegador).

## 6. Decisiones acordadas con el backend
1. **Notificaciones**: todavía no hay endpoints. Tipos en el modelo: `PROJECT_FUNDED`, `PROJECT_FAILED`; campos `id, type, message, is_read, created_at`. Mientras tanto la pantalla usa **datos de ejemplo (mock)**, aislados en un solo archivo para cambiarlos fácil por la API real.
2. **Fecha de cierre** de un proyecto FUNDED/FAILED = **`updatedAt`** del proyecto. ⚠️ El ejemplo de GET /projects/{id} solo muestra `createdAt`: confirmar con backend que el detalle incluya `updatedAt`.
3. **Riesgo**: solo existe `riskTag`. El aviso de riesgo alto se basa en la etiqueta. **No mostrar "puntaje"** (los prototipos lo muestran, pero ese dato no llega).
4. **Estados de aportes**: ver mapeo de la sección 5.
5. Pendiente a confirmar con backend (si hace falta): número de patrocinadores en el reporte de cierre (el listado de "mis proyectos" ya trae `backersCount`), y endpoint de notificaciones y de marcar como leída.

## 7. Reglas de negocio (Sprint 2 y 3)
- Eliminar proyecto solo si no tiene aportes.
- Meta y plazo inmutables cuando el proyecto está ACTIVE. Editar un ACTIVE recalcula el riesgo.
- Proyectos FUNDED/FAILED no reciben aportes (403).
- Reembolsos de proyectos FAILED: asíncronos en backend (máx. 10 min). Un aporte se reembolsa una sola vez.
- Aportes en proyectos FUNDED **no** son reembolsables.
- Accesibilidad en TODAS las pantallas: contraste mínimo 4.5:1 (WCAG 2.1 AA) y **fuente no menor a 14px**.
- Rendimiento: listados y filtros < 3 s; advertencia de riesgo < 2 s.

## 8. Sprint 3: pantallas a construir (prototipos en `FundDreams - Prototipos Sprint 3.pdf`)
Orden sugerido (de más simple a más compleja):

1. **Mis aportes (historial)** — HU-2.2.2. Ruta `/contributions`. Tabla (proyecto, monto, fecha y hora, estado), filtros Todos/Aprobado/Fallido/Reembolsado, estado vacío "Aún no has realizado aportes", clic en aporte → página del proyecto. Sin sesión → redirigir a login. Si 403 → "No autorizado".
2. **Comprobante** — HU-3.1.2. Detalle (número de transacción, fecha y hora, proyecto, monto, estado, medio de pago) y botón "Descargar comprobante". Si el aporte es Fallido: "No hay comprobante disponible para este aporte" con botón deshabilitado.
3. **Filtro de riesgo en Explorar** — HU-2.3.5. Botones Riesgo Alto/Medio/Bajo (selección múltiple), muestra etiqueta en cada proyecto, "Limpiar filtros", sin resultados: "No hay proyectos con esa etiqueta de riesgo". Query: `?riskTag=ALTO,MEDIO`.
4. **Advertencia de riesgo alto antes de aportar** — HU-2.2.3. Modal "Este proyecto tiene riesgo alto" (sin puntaje) con "Cancelar" y "Entiendo el riesgo, continuar". Riesgo medio/bajo: va directo al formulario. Si entra al formulario sin confirmar: "Debes confirmar la advertencia de riesgo antes de aportar". Enviar `riskWarningAccepted: true`.
5. **Formulario de aporte** — monto (mín. $10.000), método de pago (SIMULATED_CARD), nonce nuevo por intento.
6. **Estados cerrados del proyecto** — HU-4.1.3. En el detalle, si es FUNDED: "Proyecto finalizado: meta alcanzada". Si es FAILED: "Proyecto caducado: no alcanzó su meta". Mostrar estado, monto recaudado, meta, fecha de cierre (`updatedAt`), botón "Apoyar" deshabilitado y mensaje "Esta campaña ya no recibe aportes". Si el backend responde 403 al aportar → modal con ese mensaje y "Volver al proyecto".
7. **Reembolsos** — HU-4.1.4. En Mis aportes: estado Reembolsado + mensaje "No se realizará otra devolución por el mismo pago". En aporte de proyecto FUNDED: "Este proyecto fue financiado con éxito, el aporte no es reembolsable" y botón "Solicitar reembolso" deshabilitado.
8. **Notificaciones** — HU-4.1.1 y 4.1.2 (con datos mock). Alerta de proyecto finalizado (nombre y monto total) y de caducado (nombre, recaudado, meta, y aviso de que los aportes serán reembolsados). **Sin datos personales de otros patrocinadores.** Una sola alerta por proyecto.
9. **Reporte de cierre (creador)** — HU-4.1.1 CA2 y 4.1.2 CA3. En "Mis proyectos": monto final, meta, patrocinadores, fecha de cierre; en caducados también el porcentaje alcanzado.

## 9. Flujo de trabajo con Git (para recordar)
```bash
cd ~/crowfunding-frontend
git status                      # ver qué cambió
git add .
git commit -m "Describe lo que hiciste"
git push -u origin feature/sprint3
```
Al terminar el sprint: abrir un Pull Request en GitHub de `feature/sprint3` hacia `main`.
Para subir cambios hay que ser colaborador del repo y usar un token temporal (se borra al terminar la sesión).

## 10. Cómo usar este archivo en un chat nuevo
1. Abre un chat nuevo por tarea (ej. "pantalla Mis aportes").
2. Pega este `CONTEXT.md`.
3. Pega el contenido de los archivos que haya que tocar o imitar (por ejemplo `src/lib/api.ts`, `src/types/index.ts`, `src/components/RiskLabel.tsx`).
4. Pide la tarea y pega los errores tal cual salen.
5. Al terminar, actualiza la sección "Avance" de abajo.

## 11. Avance del Sprint 3
- [ ] 1. Mis aportes
- [ ] 2. Comprobante
- [ ] 3. Filtro de riesgo
- [ ] 4. Advertencia de riesgo alto
- [ ] 5. Formulario de aporte
- [ ] 6. Estados cerrados
- [ ] 7. Reembolsos
- [ ] 8. Notificaciones (mock)
- [ ] 9. Reporte de cierre
