# API — ESCREAM Backend

Base URL: `http://localhost:3000/api`
Docs interactivas (Swagger): `http://localhost:3000/api/docs`

Leyenda de auth:

- 🌐 = pública
- 🔒 = requiere JWT de usuario (`Authorization: Bearer <token>` del `/auth/login`)
- 🛡️ `EDITOR/ADMIN` = JWT + rol `EDITOR` o `ADMIN`
- 👑 `ADMIN` = JWT + rol `ADMIN`

> Solo existe **un** tipo de JWT (de usuario). La autorización fina se hace por **rol**
> (`USER` / `EDITOR` / `ADMIN`) con `@Roles` + `RolesGuard`. No hay login de admin aparte.
> Para el contrato exacto de cada body, mirar el DTO indicado en cada fila.

---

## 🛂 Auth

Todo el controller pasa por `LogRequestsInterceptor` (loguea la petición sin `password` ni cabeceras sensibles).

| Método | Ruta | Auth | Body | Descripción |
|---|---|---|---|---|
| `POST`  | `/auth/register` | 🌐 | `RegisterDto` | Crea usuario y devuelve `{ access_token, user }`. |
| `POST`  | `/auth/login` | 🌐 | `LoginDto` | Valida credenciales, **activa la suscripción** y devuelve `{ access_token, user }`. |
| `POST`  | `/auth/logout` | 🔒 | — | `{ message: 'Logout successfully!' }`. JWT *stateless*: el cliente borra su token. |
| `POST`  | `/auth/refresh` | 🔒 | — | Re-emite token: `{ token, token_type: 'bearer' }`. |
| `PATCH` | `/auth/changeSubscription` | 🔒 | `ChangeSubscriptionDto` (`planId: 1\|2\|3`) | Cambia el plan del usuario actual. |
| `GET`   | `/auth/who` | 🔒 | — | Devuelve el usuario autenticado (`req.user`, sin `password`). |

---

## 🎬 Movies

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/movies` | 🌐 | `?page&perPage&search&directorId&subgenreIds&countries&yearMin&yearMax&rating` | Listado paginado con filtros. |
| `GET`    | `/movies/facets` | 🌐 | — | Valores disponibles para los filtros: `{ countries, years:{min,max}, subgenres }`. |
| `GET`    | `/movies/slug/:slug` | 🌐 | — | Detalle por *slug* (lo que usa el frontend en `/movies/:slug`). |
| `GET`    | `/movies/:id` | 🌐 | — | Detalle por id. |
| `POST`   | `/movies` | 🛡️ `EDITOR/ADMIN` | `CreateMovieDto` | Crear. |
| `POST`   | `/movies/seed-images` | 🛡️ `EDITOR/ADMIN` | — | Busca posters en TMDB para películas sin imagen. |
| `PATCH`  | `/movies/:id` | 🛡️ `EDITOR/ADMIN` | `UpdateMovieDto` | Actualizar parcial. |
| `DELETE` | `/movies/:id` | 👑 `ADMIN` | — | Borrar (204). |

### `POST /movies/seed-images`

Acción manual usada por el botón **Actualizar posters** del listado de películas del panel admin.

Funcionamiento del botón:

1. En `AdminMovieListComponent`, el botón se muestra junto a **Nueva película**.
2. Al pulsarlo, el frontend activa el estado `seedingImages` para deshabilitar el botón y cambiar el texto a `Buscando posters...`.
3. El frontend llama a `MovieService.seedMissingImages()`.
4. Ese método hace un `POST` a `/movies/seed-images`.
5. El backend busca únicamente películas cuyo campo `image` está en `null` o `''`.
6. Para cada película pendiente, consulta TMDB usando título, año y director para escoger el resultado más fiable.
7. Si TMDB devuelve `poster_path`, el backend actualiza `image` con una URL de tipo `https://image.tmdb.org/t/p/w500/...`.
8. Cuando el endpoint responde, el frontend muestra un toast con `Imágenes actualizadas: updated/processed`.
9. Después recarga la lista de películas para que los posters aparezcan en la tabla sin navegar a otra pantalla.

El backend replica la estrategia de `prisma/seed-images.ts`, pero ejecutada bajo demanda desde la API en lugar de como script de consola.

Requiere `TMDB_API_KEY` en el `.env` del backend. Si no existe, devuelve `400 Bad Request`.

Respuesta:

```json
{
  "processed": 3,
  "updated": 2,
  "skipped": 1,
  "failed": []
}
```

- `processed`: películas sin imagen que se han intentado procesar.
- `updated`: películas a las que se ha añadido URL de poster.
- `skipped`: películas para las que TMDB no devolvió un poster usable.
- `failed`: películas que fallaron durante la búsqueda/actualización.

---

## 👥 Users (CRUD admin)

Controller entero protegido con `@UseGuards(JwtUserAuthGuard, RolesGuard)` + `@Roles(ADMIN)`.

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/users` | 👑 `ADMIN` | `?page&perPage` | Listado paginado (`omit: password`). |
| `GET`    | `/users/:id` | 👑 `ADMIN` | — | Detalle. |
| `POST`   | `/users` | 👑 `ADMIN` | `CreateUserDto` | Crear. |
| `PATCH`  | `/users/:id` | 👑 `ADMIN` | `UpdateUserDto` | Actualizar parcial. |
| `DELETE` | `/users/:id` | 👑 `ADMIN` | — | Borrar (204). |

---

## ⭐ Reviews

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/reviews` | 🌐 | `?page&perPage&profileId&movieId` | Listado paginado, filtrable por perfil o película. |
| `GET`    | `/reviews/:id` | 🌐 | — | Detalle. |
| `POST`   | `/reviews` | 🌐 | `CreateReviewDto` | Crear. |
| `PATCH`  | `/reviews/:id` | 🌐 | `UpdateReviewDto` | Actualizar parcial. |
| `DELETE` | `/reviews/:id` | 🌐 | — | Borrar (204). |

---

## 🏷️ Subgenres

| Método | Ruta | Auth | Body / Query | Descripción |
|---|---|---|---|---|
| `GET`    | `/subgenres` | 🌐 | `?page&perPage` | Listado paginado. |
| `GET`    | `/subgenres/:id` | 🌐 | — | Detalle. |
| `GET`    | `/subgenres/:id/movies` | 🌐 | — | Subgénero con sus películas. |
| `POST`   | `/subgenres` | 🌐 | `CreateSubgenreDto` | Crear. |
| `PATCH`  | `/subgenres/:id` | 🌐 | `UpdateSubgenreDto` | Actualizar parcial. |
| `DELETE` | `/subgenres/:id` | 🌐 | — | Borrar (204). |

---

## 🎭 Actors · 🎥 Directors · 🏢 Production Companies · 💳 Plans · 👤 Profiles

Mismo patrón CRUD, **todas públicas por ahora** (pendiente protegerlas):

| Método | Ruta | Body / Query | Descripción |
|---|---|---|---|
| `GET`    | `/<recurso>` | `?page&perPage` | Listado paginado. |
| `GET`    | `/<recurso>/:id` | — | Detalle. |
| `POST`   | `/<recurso>` | `Create<X>Dto` | Crear. |
| `PATCH`  | `/<recurso>/:id` | `Update<X>Dto` | Actualizar parcial. |
| `DELETE` | `/<recurso>/:id` | — | Borrar (204). |

Rutas concretas:

- `/actors` · `Create/UpdateActorDto`
- `/directors` · `Create/UpdateDirectorDto`
- `/production-companies` · `Create/UpdateProductionCompanyDto`
- `/plans` · `Create/UpdatePlanDto`
- `/profiles` · `Create/UpdateProfileDto`

---

## 🩺 Misc

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/` | Healthcheck del `AppController`. |

---

## Convenciones

- **Prefijo global:** todas las rutas cuelgan de `/api` (configurado en `main.ts`).
- **Paginación:** `?page=1&perPage=10` por defecto. Respuesta: `{ data: [...], meta: { page, perPage, total, lastPage } }`.
- **Validación:** los `Create*Dto` / `Update*Dto` usan `class-validator`. El `ValidationPipe` global
  (`whitelist` + `forbidNonWhitelisted` + `transform`) descarta campos no declarados, rechaza los
  desconocidos con `400` y convierte tipos (string → number, etc.).
- **Errores comunes:**
  - `400` — DTO inválido o FK rota (director/compañía/actor/subgénero inexistente).
  - `401` — token ausente/inválido/caducado (rutas 🔒 / 🛡️ / 👑).
  - `403` — autenticado pero sin el rol requerido.
  - `404` — recurso inexistente.
  - `409` — conflicto único (p.ej. título de película o email ya en uso).
- **Logging:** las rutas de `/auth/*` pasan por `LogRequestsInterceptor` (loguea url, ip, method,
  headers sin `authorization/cookie`, body sin `password`, status).

> Detalle de cómo funcionan guards, roles y JWT pieza por pieza: [`auth.md`](auth.md).
