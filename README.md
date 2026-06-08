# 🎃 ESCREAM — Documentación del proyecto

Plataforma de streaming (SVOD) de cine de terror. Es una **aplicación web full-stack**
dividida en dos proyectos independientes que se comunican por HTTP:

```
┌──────────────────────┐        HTTP / JSON         ┌──────────────────────┐        SQL        ┌──────────────┐
│      FRONTEND        │ ─────────────────────────▶ │       BACKEND        │ ───────────────▶ │  PostgreSQL  │
│   Angular 18 (SPA)   │  ◀───────────────────────  │  NestJS 11 + Prisma  │ ◀─────────────── │  (Docker)    │
│   localhost:4200     │     Bearer token (JWT)     │   localhost:3000     │                  │   :5432      │
└──────────────────────┘                            └──────────────────────┘                  └──────────────┘
```

- **Frontend** (`/frontend`): la interfaz que ve el usuario. No habla con la base de datos; solo pide datos al backend.
- **Backend** (`/backend`): la API REST. Valida, aplica reglas de negocio y autenticación, y es el único que toca la BD.
- **Base de datos**: PostgreSQL, modelada y consultada con **Prisma** (un ORM).

> Esta página es el índice y el resumen. Para detalles concretos hay documentos especializados,
> enlazados en cada sección.

---

## 📑 Índice

1. [Cómo arrancar el proyecto](#1-cómo-arrancar-el-proyecto)
2. [Frontend (Angular)](#2-frontend-angular)
3. [Estilos de la app](#3-estilos-de-la-app)
4. [Backend (NestJS)](#4-backend-nestjs)
5. [Base de datos (Prisma + PostgreSQL)](#5-base-de-datos-prisma--postgresql)
6. [Autenticación de punta a punta](#6-autenticación-de-punta-a-punta)
7. [Mapa de documentación detallada](#7-mapa-de-documentación-detallada)

---

## 1. Cómo arrancar el proyecto

Hace falta **Node.js**, **Docker** (para Postgres) y dos terminales.

```bash
# 1) Base de datos (Postgres en Docker)
cd backend
docker compose up -d            # levanta Postgres en localhost:5432

# 2) Backend (API en localhost:3000)
npm install
npx prisma migrate dev          # crea las tablas
npm run seed:refreshAll         # carga datos de ejemplo (películas, planes, etc.)
npm run start:dev               # API con recarga en caliente

# 3) Frontend (web en localhost:4200)
cd ../frontend
npm install
npm start                       # ng serve
```

- API: `http://localhost:3000/api`
- Documentación interactiva (Swagger): `http://localhost:3000/api/docs`
- Web: `http://localhost:4200`

---

## 2. Frontend (Angular)

**Tecnología:** Angular 18 (componentes *standalone*, sin `NgModule`), TypeScript, RxJS y
**signals** para el estado reactivo. SPA (*Single Page Application*): una sola carga de página
y la navegación ocurre en el cliente.

### Estructura (`frontend/src/app/`)

| Carpeta | Qué contiene |
|---|---|
| `components/` | Las pantallas y piezas de UI (login, register, dashboard, `movies/`, `plans/`, `profiles/`…). |
| `layout/` | Estructuras de página: `main-layout` (con header/footer) y `blank-layout` (pantalla limpia). |
| `services/` | Lógica de datos: hablan con la API por HTTP (`auth`, `movie`, `plan`, `profile`, `subgenre`). |
| `guards/` | `auth.guard.ts`: protege rutas que requieren sesión. |
| `interceptors/` | `auth.interceptor.ts`: añade el token JWT a cada petición automáticamente. |
| `interfaces/` | Tipos TypeScript que describen la forma de los datos (Movie, Plan, Profile…). |

### Rutas (`app.routes.ts`)

Dos grupos de rutas según el layout:

- **Sin header/footer** (`BlankLayoutComponent`): `/` (inicio), `/login`, `/register`, `/profiles`.
- **Con header/footer** (`MainLayoutComponent`): `/movies`, `/movies/:slug` (detalle por *slug*), `/plans`, `/dashboard`.
- `/profiles` y `/dashboard` están protegidas con `authGuard` (redirige a `/login` si no hay sesión).
- Cualquier ruta desconocida (`**`) redirige al inicio.

### Cómo se piden los datos

Un **service** encapsula las llamadas HTTP. Ejemplo del flujo de sesión (`services/auth/auth.service.ts`):

- Usa `HttpClient` contra `environment.apiUrl` (`http://localhost:3000/api`).
- Guarda el estado del usuario en **signals** (`currentUser`, `isAuthenticated`, `isAdmin`, `canEdit`),
  que se rehidratan desde `localStorage` al recargar.
- El token y el usuario se persisten en `localStorage` (`escream_token`, `escream_user`).

El **interceptor** (`auth.interceptor.ts`) se ejecuta en cada petición: si hay token,
añade la cabecera `Authorization: Bearer <token>`. Así los componentes no se preocupan de eso.

### Configuración de entorno

`src/environments/environment.ts` (prod) y `environment.development.ts` (dev) solo definen `apiUrl`.
Cambiar ahí la URL del backend si despliegas en otro sitio.

> **Detalle del carrusel de portadas de la home:** `frontend/docs/carrusel-portadas-main.md`.

---

## 3. Estilos de la app

**Identidad visual:** *Retro Horror 80's + neón + cultura skate*. Estética VHS, neones, mucho
contraste y textura. La guía completa (paleta, tipografía, iconografía, efectos) está en
[`guia-estilo-escream.md`](guia-estilo-escream.md).

### Lo esencial (en código)

Los estilos globales viven en `frontend/src/styles.css`. Apóyate siempre en las
**variables CSS** definidas en `:root` en vez de escribir colores a mano:

```css
:root {
  --color-primary:   #0d0dff;   /* azul eléctrico — fondos/botones principales */
  --color-secondary: #1a1a1a;   /* gris cripta — superficies oscuras */
  --color-accent1:   #ff3c38;   /* rojo sangre — impacto, Play, urgencias */
  --color-accent2:   #ff9f1c;   /* naranja neón — labels y categorías */
  --color-text:      #ffffff;
  --degradado: linear-gradient(180deg, #180a31 0%, #0d0dff 100%);

  --neon-blue:  0 0 22px rgba(47,47,255,.55);   /* sellos de glow para hover */
  --neon-red:   0 0 22px rgba(255,60,56,.55);
  --neon-amber: 0 0 18px rgba(255,159,28,.5);

  --surface: #15102a;                            /* fondo de cards/paneles */
  --surface-border: rgba(255,255,255,.07);
}
```

### Tipografía (cargada desde Google Fonts en `styles.css`)

| Fuente | Uso |
|---|---|
| **Righteous** | Títulos de películas (`h1`, `h2`, `.movie-title`) y botones. |
| **Monoton** | Labels y categorías (`h3`, `.label`, `.category`) — el toque "neón". |
| **Montserrat** | Texto de cuerpo (`p`, sinopsis, descripciones). Legible. |

### Convenciones

- **Fondo global** con varios `radial-gradient` (resplandor azul arriba, brasa roja abajo, viñeta)
  + una textura de **grano de película** en `body::before` (SVG de ruido, opacidad ~5%).
- **Cards** (`.card`): borde naranja, esquinas redondeadas y *glow* al hacer hover.
- Cada componente tiene su propio `*.component.css` (estilos *scoped*, no se filtran a otros).
  Lo global y reutilizable va en `styles.css`; lo específico, en el CSS del componente.
- Hover típico: `transform: scale/translateY` + `box-shadow` con uno de los sellos `--neon-*`.

---

## 4. Backend (NestJS)

**Tecnología:** NestJS 11 + TypeScript, Prisma 7 (acceso a datos), Passport + JWT (auth),
`class-validator` (validación). Swagger para documentar la API.

### Arquitectura: módulos por recurso

Cada entidad del dominio es un **módulo** con el patrón estándar de Nest. Todos cuelgan de
`app.module.ts`:

```
src/<recurso>/
├── <recurso>.controller.ts   ← define las rutas HTTP y delega en el service
├── <recurso>.service.ts      ← lógica de negocio + consultas a la BD (vía Prisma)
├── <recurso>.module.ts       ← une controller + service
└── dto/                      ← Data Transfer Objects: forma + validación del body
```

Recursos: `auth`, `users`, `movies`, `actors`, `directors`, `production-companies`,
`subgenres`, `plans`, `profiles`, `reviews`. Además `prisma/` (el `PrismaService`
compartido) y `common/` (interceptors).

### Las tres capas (qué hace cada una)

1. **Controller** — recibe la petición HTTP, no tiene lógica. Aplica guards (`@UseGuards`),
   recoge parámetros/body y llama al service. Ej.: `GET /movies` → `movies.service.findAll()`.
2. **Service** — el "cerebro". Construye las consultas Prisma, aplica reglas y traduce errores
   de BD a errores HTTP (ver `movies.service.ts`: filtros, paginación, `handlePrismaError`).
3. **DTO** — clase con decoradores de `class-validator` que define qué campos son válidos.
   El `ValidationPipe` global los aplica automáticamente.

### Configuración global (`main.ts`)

- **Prefijo `api`**: todas las rutas cuelgan de `/api` (ej. `/api/movies`).
- **CORS** abierto solo a `localhost:4200` (el frontend).
- **`ValidationPipe` global** con `whitelist` + `forbidNonWhitelisted` + `transform`:
  descarta campos no declarados, rechaza los desconocidos y convierte tipos (string → number, etc.).
- **Swagger** en `/api/docs`.

### Convenciones de la API

- **Paginación:** `?page=1&perPage=10`. Respuesta: `{ data: [...], meta: { page, perPage, total, lastPage } }`.
- **Filtros** (movies): `?search`, `directorId`, `subgenreIds`, `countries`, `yearMin/yearMax`, `rating`.
  Hay un endpoint `/movies/facets` que devuelve los valores disponibles para construir los filtros.
- **Errores estándar:** `400` (DTO inválido / FK rota), `401` (sin token o inválido),
  `403` (rol insuficiente), `404` (no existe), `409` (conflicto único, p.ej. email repetido).

> **Tabla completa de endpoints:** [`backend/docs/API.md`](backend/docs/API.md).
> **Auth en profundidad (guards, roles, JWT):** [`backend/docs/auth.md`](backend/docs/auth.md).

---

## 5. Base de datos (Prisma + PostgreSQL)

**Prisma** es el ORM: en vez de escribir SQL a mano, defines el modelo en `schema.prisma` y
Prisma genera un cliente TypeScript con tipos y autocompletado, y gestiona las migraciones.

- **Motor:** PostgreSQL (en Docker, `localhost:5432`).
- **Esquema:** `backend/prisma/schema.prisma` (única fuente de verdad de las tablas).
- **Conexión:** vía `PrismaService` (`src/prisma/prisma.service.ts`) usando el adapter
  `@prisma/adapter-pg` (obligatorio en Prisma 7).

### Modelo de datos

```
Plan ──< User ──< Profile ──< Review >── Movie
                                            │
        Director ──<────────────────────────┤
ProductionCompany ──<────────────────────────┤
              Actor >──(MovieActor)──<────────┤
           Subgenre >──(MovieSubgenre)──<──────┘
```

| Modelo | Qué representa | Relaciones clave |
|---|---|---|
| `Plan` | Plan de suscripción (precio, nº dispositivos). | 1 plan → muchos usuarios. |
| `User` | Cuenta. Tiene `role` (`USER`/`EDITOR`/`ADMIN`), suscripción y plan. | pertenece a un `Plan`; tiene varios `Profile`. |
| `Profile` | Perfil dentro de una cuenta (con restricción de edad). | pertenece a un `User`; escribe `Review`s. |
| `Movie` | Película (título, slug, año, sinopsis, imagen, rating, país, URL). | tiene un `Director` y una `ProductionCompany`. |
| `Director` / `ProductionCompany` | Catálogo simple. | 1 → muchas películas. |
| `Actor` | Reparto. | N↔N con `Movie` vía `MovieActor`. |
| `Subgenre` | Subgénero de terror (con `slug` único). | N↔N con `Movie` vía `MovieSubgenre`. |
| `Review` | Valoración (`rating` + comentario) de un perfil sobre una película. | enlaza `Profile` y `Movie`. |
| `MovieActor` / `MovieSubgenre` | Tablas puente (relación muchos-a-muchos). | clave primaria compuesta. |

**Detalles de modelado relevantes:**

- Todos los modelos llevan `createdAt` / `updatedAt`. Los nombres de campo en camelCase
  se mapean a snake_case en la BD con `@map` (ej. `planId` → `plan_id`), y las tablas con `@@map`.
- `onDelete: Cascade` en `Profile`, `Review`, `MovieActor`, `MovieSubgenre`: al borrar el padre,
  se borran los hijos automáticamente.
- Campos opcionales marcados con `?` (ej. `Movie.year`, `Movie.image`, `User.endDate`).
- Decimales con precisión fija: `price Decimal(6,2)`, `rating Decimal(2,1)`.

### Comandos del día a día

```bash
npx prisma migrate dev --name <cambio>   # crea+aplica migración tras tocar el schema (y regenera el client)
npx prisma migrate reset --force         # borra y reconstruye la BD desde cero + seed (solo dev)
npx prisma generate                      # regenera el client (si ves "column X does not exist")
npx prisma studio                        # GUI para ver/editar datos (localhost:5555)
```

Seeds (datos de ejemplo): `npm run seed` (principal), `seed:images` (pósters TMDB),
`seed:urls`, `seed:refreshAll` (todos).

> **Cheatsheet completo de Prisma y workflows de reset:** [`backend/docs/PRISMA.md`](backend/docs/PRISMA.md).

---

## 6. Autenticación de punta a punta

Cómo encajan frontend y backend en una petición protegida:

```
1. El usuario hace login → POST /api/auth/login
2. El backend valida credenciales y devuelve { access_token, user }
3. El frontend (AuthService) guarda el token en localStorage y el user en una signal
4. En cada petición, el interceptor añade  Authorization: Bearer <token>
5. En el backend:
   - JwtUserAuthGuard verifica la firma del token y recarga el user FRESCO de la BD → req.user
   - RolesGuard (si la ruta tiene @Roles) comprueba que req.user.role esté permitido
6. authGuard (Angular) protege las rutas del cliente que requieren sesión
```

**Roles:** `USER` (por defecto), `EDITOR` (puede crear/editar películas) y `ADMIN` (todo,
incluido borrar y gestionar usuarios). El token va firmado con `JWT_USER_SECRET` y caduca a los 7 días.

> **Explicación pieza por pieza (estrategia Passport, guards, decoradores):** [`backend/docs/auth.md`](backend/docs/auth.md).

---

## 7. Mapa de documentación detallada

| Documento | Tema |
|---|---|
| [`guia-estilo-escream.md`](guia-estilo-escream.md) | Guía de estilo visual completa (paleta, tipografía, efectos). |
| [`backend/docs/API.md`](backend/docs/API.md) | Tabla de todos los endpoints, auth requerida y convenciones. |
| [`backend/docs/auth.md`](backend/docs/auth.md) | Autenticación/autorización: JWT, Passport, guards y roles. |
| [`backend/docs/PRISMA.md`](backend/docs/PRISMA.md) | Cheatsheet de Prisma: migraciones, seeds, reset, workflows. |
| [`frontend/docs/carrusel-portadas-main.md`](frontend/docs/carrusel-portadas-main.md) | Implementación del carrusel de portadas de la home. |
| `http://localhost:3000/api/docs` | Swagger: API interactiva (probar endpoints en vivo). |
