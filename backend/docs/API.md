# API — ESCREAM Backend

Base URL: `http://localhost:3000`

🔒 = requiere JWT de **usuario** (`Authorization: Bearer <token>` del `/auth/login`)
👑 = requiere JWT de **admin** (token del `/admin-auth/login`)
🌐 = pública

> Para el contrato exacto de cada body, mirar el DTO indicado en cada fila.

---

## 🛂 Auth (usuario)

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `POST` | `/auth/register` | 🌐 | `RegisterDto` | Crea usuario y devuelve `{access_token, user}`. |
| `POST` | `/auth/login` | 🌐 | `LoginDto` | Devuelve `{access_token, user}` y activa la suscripción. |
| `GET`  | `/auth/me` | 🔒 | — | Devuelve el usuario actual. |
| `GET`  | `/auth/who` | 🔒 | — | Alias de `/auth/me` (paridad Laravel). |
| `POST` | `/auth/logout` | 🔒 | — | `{message: 'Logout successfully!'}`. JWT stateless: el client borra su token. |
| `POST` | `/auth/refresh` | 🔒 | — | Re-emite token: `{token, token_type:'bearer'}`. |
| `PUT`  | `/auth/changeSubscription` | 🔒 | `ChangeSubscriptionDto` (`planId: 1\|2\|3`) | Cambia el plan del usuario. |

---

## 👑 Admin Auth

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| `POST` | `/admin-auth/login` | 🌐 | `AdminLoginDto` | Devuelve token de admin. |
| `GET`  | `/admin-auth/me` | 👑 | — | Devuelve el admin actual. |

---

## 👥 Users (CRUD admin)

Todo el controller protegido con `JwtAdminAuthGuard`.

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/users` | 👑 | `?page&perPage` | Listado paginado (`omit: password`). |
| `GET`    | `/users/:id` | 👑 | — | Detalle. |
| `POST`   | `/users` | 👑 | `CreateUserDto` | Crear. |
| `PATCH`  | `/users/:id` | 👑 | `UpdateUserDto` | Actualizar parcial. |
| `DELETE` | `/users/:id` | 👑 | — | Borrar (204). |

---

## 🎬 Movies

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/movies` | 🌐 | `?page&perPage&directorId&subgenreId&year&…` | Listado paginado con filtros. |
| `GET`    | `/movies/:id` | 🌐 | — | Detalle. |
| `POST`   | `/movies` | 🌐 | `CreateMovieDto` | Crear. |
| `PATCH`  | `/movies/:id` | 🌐 | `UpdateMovieDto` | Actualizar parcial. |
| `DELETE` | `/movies/:id` | 🌐 | — | Borrar. |

---

## 🎭 Actors · 🎥 Directors · 🏢 Production Companies · 🏷️ Subgenres · 💳 Plans · 👤 Profiles · ⭐ Reviews

Todos siguen el mismo patrón CRUD (públicas por ahora, pendiente protegerlas):

| Método | Ruta | Body / Query | Descripción |
|---|---|---|---|
| `GET`    | `/<recurso>` | `?page&perPage` | Listado paginado. |
| `GET`    | `/<recurso>/:id` | — | Detalle. |
| `POST`   | `/<recurso>` | `Create<X>Dto` | Crear. |
| `PATCH`  | `/<recurso>/:id` | `Update<X>Dto` | Actualizar parcial. |
| `DELETE` | `/<recurso>/:id` | — | Borrar. |

Rutas concretas:

- `/actors` · `Create/UpdateActorDto`
- `/directors` · `Create/UpdateDirectorDto`
- `/production-companies` · `Create/UpdateProductionCompanyDto`
- `/subgenres` · `Create/UpdateSubgenreDto`
- `/plans` · `Create/UpdatePlanDto`
- `/profiles` · `Create/UpdateProfileDto`
- `/reviews` · `Create/UpdateReviewDto`

---

## 🩺 Misc

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Healthcheck del `AppController`. |

---

## Convenciones

- **Paginación:** `?page=1&perPage=10` por defecto. Respuesta: `{ data: [...], meta: { page, perPage, total, lastPage } }`.
- **Validación:** todos los `Create*Dto` / `Update*Dto` usan `class-validator`. El `ValidationPipe` global devuelve `400` con detalle de errores.
- **Errores comunes:**
  - `401` — token ausente/inválido (rutas 🔒 / 👑).
  - `404` — recurso inexistente.
  - `409` — conflicto único (p.ej. email ya en uso).
  - `400` — DTO inválido o FK rota.
- **Logging:** todas las rutas de `/auth/*` pasan por `LogRequestsInterceptor` (loguea url, ip, method, headers sin `authorization/cookie`, body sin `password`, status).
