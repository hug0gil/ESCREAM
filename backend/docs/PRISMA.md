# Prisma — Cheatsheet

Comandos principales para el día a día con Prisma 7 + PostgreSQL en este proyecto.
Todos se ejecutan desde la raíz: `~/Desktop/Development/NestJS/BackEndESCREAM`.

---

## Migraciones

| Acción | Comando |
|---|---|
| Crear una migración a partir de cambios en `schema.prisma` | `npx prisma migrate dev --name nombre_descriptivo` |
| Aplicar migraciones pendientes en otro entorno (sin crear nuevas) | `npx prisma migrate deploy` |
| Ver estado (qué hay aplicado, qué falta) | `npx prisma migrate status` |
| **Reset** total: borra la BD, reaplica todo y ejecuta el seed | `npx prisma migrate reset --force` |

> `migrate dev` también regenera el client y ejecuta el seed automáticamente.
> `migrate reset` es destructivo: úsalo solo en dev.

---

## Prisma Client

| Acción | Comando |
|---|---|
| Regenerar el client tras tocar `schema.prisma` o aplicar migración | `npx prisma generate` |
| Ver/editar datos en navegador (GUI) | `npx prisma studio` |

> Si ves errores tipo `column X does not exist`, casi seguro es client desactualizado → `prisma generate`.

---

## Seeding

| Acción | Comando |
|---|---|
| Ejecutar el seed principal (`prisma/seed.ts`) | `npx prisma db seed` |
| Ejecutar el seed de imágenes TMDB (`prisma/seed-images.ts`) | `npx ts-node --transpile-only prisma/seed-images.ts` |

> El seed se configura en `prisma.config.ts` bajo `migrations.seed`.

---

## Schema

| Acción | Comando |
|---|---|
| Formatear `schema.prisma` | `npx prisma format` |
| Validar sintaxis del schema | `npx prisma validate` |
| Sincronizar schema con la BD sin crear migración (prototipos) | `npx prisma db push` |
| Generar `schema.prisma` a partir de una BD existente | `npx prisma db pull` |

> `db push` es rápido pero **no genera migración** → no apto para producción.

---

## Workflows típicos

### Cambié algo en `schema.prisma`
```bash
npx prisma migrate dev --name lo_que_cambie
# genera migración, la aplica, regenera el client y ejecuta el seed
```

### Quiero empezar de cero con datos limpios
```bash
npx prisma migrate reset --force
npx ts-node --transpile-only prisma/seed-images.ts   # opcional: pósters TMDB
```

### Solo quiero refrescar el client
```bash
npx prisma generate
```

### Quiero inspeccionar la BD
```bash
npx prisma studio   # abre http://localhost:5555
```

---

## Resetear la BD en dev (resumen)

Tres formas, de menos a más drástica:

### 1. Reaplicar las migraciones existentes (lo más común)
```bash
npx prisma migrate reset --force
```
Borra la BD, vuelve a ejecutar **todas** las migraciones existentes, regenera el client y corre el seed. Usar cuando el `schema.prisma` y las migraciones siguen valiendo y solo quieres datos limpios.

### 2. Sincronizar schema con la BD sin migración (prototipos rápidos)
```bash
npx prisma db push --force-reset
npx prisma db seed
```
Tira la BD, recrea el schema directamente desde `schema.prisma` (sin tocar `prisma/migrations/`), regenera el client. Bueno cuando aún no tienes nada en producción y no te importa el historial. **No apto para prod.**

### 3. Empezar de cero también con las migraciones (cuando hay cambios destructivos)
```bash
rm -rf prisma/migrations
npx prisma migrate dev --name init    # responde "y" al prompt de drift/reset
npx prisma generate                   # por si el migrate dijo "Already in sync"
npx prisma db seed                    # idem
```
Usar cuando has tocado `schema.prisma` quitando columnas/tablas y prefieres una migración inicial limpia en vez de acumular `ALTER TABLE`.

> ⚠️ Si `migrate dev` te dice **"Already in sync, no schema change…"** se salta `prisma generate`. Lánzalo a mano si después ves errores tipo `column X does not exist`.

### Checklist tras cualquier reset
1. `npx prisma generate` (si no lo hizo el comando).
2. `npx prisma db seed` (si no lo encadenó).
3. Reiniciar el server de Nest (el dist puede tener el client viejo).

---

## Notas del proyecto

- Driver: `@prisma/adapter-pg` (obligatorio en Prisma 7).
- El `PrismaService` (`src/prisma/prisma.service.ts`) instancia el client con el adapter — replicar el mismo patrón en cualquier script ad-hoc (ver `prisma/seed.ts` y `prisma/seed-images.ts`).
- Las variables `.env` no se cargan automáticamente: `prisma.config.ts` hace `import "dotenv/config"`.
- Necesario Postgres corriendo en `localhost:5432` (contenedor Docker).
