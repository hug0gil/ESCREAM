# Arquitectura config-driven para CRUD administrativos.

CRUD genérico basado en configuración: un solo CRUD reutilizable que cambia según ADMIN_CRUD_CONFIGS.
La clave no fue escribir siete CRUD desde cero. La clave fue ver que todos tenían una base común:

- una lista paginada
- buscador local
- botones de editar/eliminar
- modal de confirmación
- formulario de crear/editar
- llamadas HTTP `GET`, `POST`, `PATCH`, `DELETE`

Al principio películas parecía un caso aparte porque tiene relaciones múltiples (`actors`, `subgenres`), posters, rating con calaveras y botón de seed de imágenes. La conversión final consistió en enseñar al CRUD genérico esas capacidades especiales, para que `movies` también pudiera vivir dentro de `admin-crud`.

## 1. Miré el backend antes de tocar el frontend

Usé estos archivos como fuente de verdad:

- `backend/prisma/schema.prisma`
- `backend/src/*/dto/create-*.dto.ts`
- `backend/src/*/dto/update-*.dto.ts`
- `backend/src/*/*.controller.ts`
- `backend/src/*/*.service.ts`

Eso dice exactamente:

- qué campos existen
- cuáles son obligatorios
- qué tipo tienen
- qué endpoint usa cada recurso
- qué relaciones hay
- qué validaciones aplica el backend

Por ejemplo:

- `Actor` necesita `name`, `birthDate`, `country`.
- `ProductionCompany` necesita `name`, `country`.
- `Review` necesita `profileId`, `movieId`, `rating`, y `comment` opcional.
- `Subgenre` necesita `name`, y el backend genera el `slug`.
- `Movie` necesita `title`, `directorId`, `productionCompanyId`, `country`, y puede tener `year`, `rating`, `image`, `movieUrl`, `actorIds`, `subgenreIds`.
- `User` necesita `name`, `email`, `password` al crear, y puede tener `planId`, fechas y `subscribed`.

Así evité inventarme campos que luego el backend rechazaría por el `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`.

## 2. Separé “comportamiento común” de “configuración”

El comportamiento común está en:

- `src/app/components/admin/admin-crud/admin-crud-list/`
- `src/app/components/admin/admin-crud/admin-crud-form/`
- `src/app/services/admin-crud.service.ts`

La configuración está en:

- `src/app/components/admin/admin-crud/admin-crud.config.ts`

Ese archivo dice, para cada recurso:

- endpoint: `movies`, `reviews`, `users`, `actors`, etc.
- ruta dentro del admin
- columnas de la tabla
- campos del formulario
- campo que se muestra al confirmar borrado
- validaciones como `required`, `min`, `max`, `minLength`, `maxLength`
- selects que se cargan de otros endpoints
- campos especiales como `country`, `multiselect`, `rating` e imágenes

Ejemplo mental:

```ts
actors: {
  resource: 'actors',
  routePath: 'actors',
  columns: [...],
  fields: [
    { key: 'name', type: 'text', required: true },
    { key: 'birthDate', type: 'date', required: true },
    { key: 'country', type: 'country', required: true },
  ],
}
```

Con eso, el formulario genérico sabe qué pintar y qué mandar al backend.

## 3. Por qué hay interfaces

En `admin-crud.config.ts` hay varias interfaces:

- `AdminColumn`
- `AdminOptionSource`
- `AdminField`
- `AdminCrudConfig`

No están puestas por “hacer TypeScript bonito”. Están para que el objeto de configuración tenga contrato.

Sin interfaces, podrías escribir algo así por error:

```ts
{
  resurce: 'movies',
  colums: [],
}
```

Y Angular/TypeScript no se enteraría hasta que la app fallase en runtime.

Con interfaces, TypeScript te avisa al momento:

```ts
export interface AdminCrudConfig {
  resource: string;
  routePath: string;
  singular: string;
  plural: string;
  createLabel?: string;
  seedImages?: boolean;
  columns: AdminColumn[];
  fields: AdminField[];
  deleteLabelKey: string;
}
```

Eso significa:

- todo CRUD necesita un `resource`
- todo CRUD necesita un `routePath`
- todo CRUD necesita columnas
- todo CRUD necesita campos de formulario
- todo CRUD necesita saber qué texto mostrar al borrar

La interfaz convierte una idea informal en una estructura obligatoria.

### Por qué `AdminColumn`

`AdminColumn` describe una columna de tabla.

```ts
export interface AdminColumn {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'boolean' | 'number' | 'image';
}
```

El `key` puede ser simple:

```ts
title
```

O anidado:

```ts
director.name
```

Por eso la tabla genérica puede pintar tanto una propiedad directa como una relación del backend.

El `type` existe porque no todos los valores se pintan igual:

- `date`: se formatea como fecha.
- `boolean`: se muestra como `Sí` / `No`.
- `image`: se pinta como poster.
- `number`: se mantiene como número.
- `text`: se pinta normal.

### Por qué `AdminField`

`AdminField` describe un campo de formulario.

```ts
export interface AdminField {
  key: string;
  label: string;
  type: AdminFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  optionSource?: AdminOptionSource;
  relationArray?: {
    path: string;
    itemPath?: string;
    idKey?: string;
  };
  omitWhenEmpty?: boolean;
}
```

Esto permite que el formulario genérico se pregunte:

- ¿qué control tengo que crear?
- ¿es obligatorio?
- ¿tiene longitud máxima?
- ¿es un select?
- ¿de dónde saco sus opciones?
- ¿es un multiselect?
- ¿hay que convertir relaciones anidadas a IDs?
- ¿lo omito si está vacío?

Por eso no hace falta escribir un formulario nuevo para cada recurso.

### Por qué `AdminOptionSource`

Hay campos que no son texto libre. Por ejemplo:

- una review necesita elegir una película
- una review necesita elegir un perfil
- un usuario puede elegir un plan
- una película necesita elegir director y productora

Para eso está:

```ts
export interface AdminOptionSource {
  resource: string;
  labelKey: string;
  perPage?: number;
}
```

Ejemplo:

```ts
optionSource: {
  resource: 'directors',
  labelKey: 'name',
  perPage: 200
}
```

Eso significa:

- llama a `/api/directors`
- trae hasta 200 resultados
- usa `name` como texto visible del `<option>`

Así el formulario no necesita saber qué es un director. Solo sabe que debe cargar opciones desde un recurso.

### Por qué `AdminFieldType`

`AdminFieldType` es una unión de strings:

```ts
export type AdminFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'country'
  | 'multiselect'
  | 'rating';
```

Esto limita los tipos válidos. No puedes poner accidentalmente:

```ts
type: 'calendar'
```

si el formulario no sabe pintar `calendar`.

Cada tipo corresponde a una rama en el HTML:

- `text`, `email`, `password`, `number`, `date`: `<input>`
- `textarea`: `<textarea>`
- `select`: `<select>`
- `checkbox`: checkbox
- `country`: chips con banderas usando facets
- `multiselect`: chips seleccionables
- `rating`: calaveras

Es decir: la config no solo guarda datos, también decide qué UI se renderiza.

## 4. Por qué `Record<string, AdminCrudConfig>`

La configuración principal está declarada así:

```ts
export const ADMIN_CRUD_CONFIGS: Record<string, AdminCrudConfig> = {
  movies: { ... },
  reviews: { ... },
  users: { ... },
}
```

`Record<string, AdminCrudConfig>` significa:

> “Esto es un objeto cuyas claves son strings y cuyos valores tienen forma de `AdminCrudConfig`.”

En sencillo:

```ts
{
  movies: AdminCrudConfig,
  reviews: AdminCrudConfig,
  users: AdminCrudConfig,
}
```

¿Por qué no un array?

Podría haber sido:

```ts
const configs = [
  { resource: 'movies', ... },
  { resource: 'reviews', ... },
]
```

Pero un objeto con claves permite acceder directamente:

```ts
ADMIN_CRUD_CONFIGS['movies']
ADMIN_CRUD_CONFIGS['reviews']
ADMIN_CRUD_CONFIGS['users']
```

Eso encaja muy bien con las rutas:

```ts
data: {
  adminCrud: ADMIN_CRUD_CONFIGS['movies']
}
```

Ventajas:

- acceso directo por nombre
- menos búsqueda manual
- rutas más claras
- cada sección del admin apunta explícitamente a su configuración
- TypeScript comprueba que cada valor cumple `AdminCrudConfig`

La parte `Record<string, AdminCrudConfig>` es el candado de tipos. Dice: “puedes tener tantas claves como quieras, pero cada una debe ser una config válida”.

## 5. Por qué la configuración se pasa en `routes`

En `app.routes.ts` hay rutas como:

```ts
{
  path: 'admin-dashboard/movies',
  component: AdminMoviesListComponent,
  canActivate: [authGuard],
  data: {
    adminCrud: ADMIN_CRUD_CONFIGS['movies']
  }
}
```

La pregunta importante es: ¿por qué meter `adminCrud` en `data`?

Porque así el mismo componente genérico puede comportarse distinto según la ruta.

`AdminCrudListComponent` no sabe de antemano si está en movies, reviews o users. Lo descubre leyendo:

```ts
this.route.snapshot.data['adminCrud']
```

Entonces, si entras en:

```txt
/admin-dashboard/movies
```

recibe la config de películas.

Si entras en:

```txt
/admin-dashboard/actors
```

recibe la config de actores.

Es el mismo componente, pero con distinta configuración.

Esto evita tener:

- `AdminMoviesListComponent` con 300 líneas
- `AdminActorsListComponent` con 300 líneas parecidas
- `AdminDirectorsListComponent` con otras 300 líneas parecidas

En vez de eso:

- las rutas dicen qué recurso es
- la config dice cómo se pinta
- el componente genérico ejecuta la lógica

## 6. Por qué existen wrappers por sección

Aunque la lógica es genérica, se crearon wrappers como:

- `AdminMoviesListComponent`
- `AdminReviewsListComponent`
- `AdminUsersListComponent`
- `AdminActorsListComponent`

Ejemplo:

```ts
@Component({
  selector: 'app-admin-movies-list',
  standalone: true,
  imports: [AdminCrudListComponent],
  template: '<app-admin-crud-list />',
})
export class AdminMoviesListComponent {}
```

Parece una tontería porque solo envuelve al CRUD común, pero tiene sentido:

- mantiene una jerarquía clara en carpetas
- cada ruta apunta a un componente semántico
- si mañana movies necesita algo exclusivo, ya tiene su sitio
- si haces tests por sección, tienes componente por sección
- el proyecto se entiende mejor: “admin-movies” existe como apartado

Sin wrappers, podrías apuntar todas las rutas directamente a `AdminCrudListComponent`. Funcionaría, pero el árbol de admin sería menos claro.

Los wrappers son como etiquetas semánticas: no hacen mucho ahora, pero ordenan el sistema.

### Por qué esos componentes solo tienen `.ts`

Los componentes wrapper se crearon solo con archivo `.ts` porque no tienen vista ni estilos propios.

Por ejemplo:

```ts
@Component({
  selector: 'app-admin-movies-list',
  standalone: true,
  imports: [AdminCrudListComponent],
  template: '<app-admin-crud-list />',
})
export class AdminMoviesListComponent {}
```

Ese componente no necesita:

- `.html`
- `.css`
- `.spec.ts`
- lógica interna

porque su única responsabilidad es decir:

> “Esta ruta pertenece al apartado de movies, pero la pantalla real la pinta `AdminCrudListComponent`.”

El HTML está inline:

```ts
template: '<app-admin-crud-list />'
```

Por eso no hace falta un `admin-movies-list.component.html`. Sería un archivo con una sola línea:

```html
<app-admin-crud-list />
```

Y eso añadiría ruido sin aportar nada.

Lo mismo pasa con CSS. El estilo real está en:

- `admin-crud-list.component.css`
- `admin-crud-form.component.css`

Si cada wrapper tuviera su propio CSS vacío, habría más archivos que abrir, mantener y revisar, pero sin comportamiento real.

### Por qué no tienen lógica

No tienen lógica porque la lógica vive en los componentes genéricos:

- cargar datos
- paginar
- buscar
- crear
- editar
- borrar
- construir formularios
- cargar selects
- convertir payloads

Todo eso está en:

- `AdminCrudListComponent`
- `AdminCrudFormComponent`

El wrapper no debe repetir esa lógica. Si la repitiera, volveríamos al problema inicial: muchos CRUD casi iguales duplicados.

### Por qué no tienen `.spec.ts`

Ahora mismo no añadí specs para cada wrapper porque serían tests de muy poco valor.

Un test de wrapper solo comprobaría algo como:

```ts
expect(component).toBeTruthy();
```

o que renderiza:

```html
<app-admin-crud-list />
```

Eso no prueba la lógica importante. La lógica importante está en el CRUD genérico, así que los tests útiles deberían centrarse en:

- `AdminCrudListComponent`
- `AdminCrudFormComponent`
- `AdminCrudService`
- la config de `ADMIN_CRUD_CONFIGS`

Tendría sentido crear `.spec.ts` para wrappers si en el futuro alguno empieza a tener lógica propia.

### Cuándo sí tendría sentido crear HTML/CSS/spec propios

Si mañana `movies` necesitase una pantalla realmente distinta, entonces sí tendría sentido pasar de esto:

```ts
template: '<app-admin-crud-list />'
```

a archivos separados:

```txt
admin-movies-list.component.html
admin-movies-list.component.css
admin-movies-list.component.spec.ts
```

Por ejemplo, si movies necesitara:

- estadísticas arriba de la tabla
- acciones exclusivas
- layout completamente distinto
- filtros avanzados propios
- tests específicos de ese comportamiento

Mientras no tenga eso, mantenerlo como wrapper `.ts` es más limpio.

La idea es: archivo solo cuando aporta algo. Si no aporta lógica, vista o estilo real, se queda inline y pequeño.

## 7. Por qué hay campos especiales

Al principio un CRUD genérico simple solo necesita:

- input de texto
- textarea
- select
- checkbox

Pero películas necesitaba más.

En vez de dejar películas fuera, añadí capacidades al CRUD:

### `country`

Problema:

- actores, productoras y películas tienen país
- no queremos escribir países a mano
- ya existe `movies/facets` con países usados por la app

Solución:

```ts
{ key: 'country', type: 'country' }
```

El formulario detecta ese tipo y llama a:

```ts
MovieService.getFacets()
```

Después pinta chips con banderas.

### `multiselect`

Problema:

- una película tiene muchos actores
- una película tiene muchos subgéneros
- el backend espera `actorIds` y `subgenreIds`

Solución:

```ts
{
  key: 'actorIds',
  type: 'multiselect',
  optionSource: { resource: 'actors', labelKey: 'name' }
}
```

El formulario pinta chips y guarda un array:

```ts
[1, 4, 8]
```

### `rating`

Problema:

- películas usaba calaveras, no un input numérico normal

Solución:

```ts
{ key: 'rating', type: 'rating' }
```

El formulario pinta el componente visual de calaveras y guarda un número.

### `image`

Problema:

- la lista de películas necesita mostrar poster

Solución:

```ts
{ key: 'image', type: 'image' }
```

La tabla genérica detecta ese tipo y pinta una miniatura en vez de texto.

### `seedImages`

Problema:

- solo películas necesita el botón `Actualizar posters`

Solución:

```ts
seedImages: true
```

La lista genérica muestra ese botón solo cuando la config lo pide.

Así el CRUD sigue siendo común, pero permite excepciones controladas.

## 8. Por qué existe `relationArray`

Este es uno de los puntos más importantes.

Cuando editas una película, el backend puede devolver actores así:

```ts
actors: [
  {
    actor: {
      id: 1,
      name: 'Neve Campbell'
    }
  }
]
```

Pero el formulario no trabaja con objetos anidados. El formulario necesita esto:

```ts
actorIds: [1]
```

Para explicar esa conversión a la config, añadí:

```ts
relationArray: {
  path: 'actors',
  itemPath: 'actor',
  idKey: 'id'
}
```

Eso significa:

- ve a `movie.actors`
- dentro de cada item, entra en `.actor`
- de ahí saca `.id`
- construye un array de IDs

Resultado:

```ts
[1]
```

Lo mismo pasa con subgéneros:

```ts
relationArray: {
  path: 'subgenres',
  itemPath: 'subgenre',
  idKey: 'id'
}
```

Sin esto, el formulario de edición no sabría qué chips marcar como seleccionados.

## 9. Por qué `omitWhenEmpty`

Hay campos opcionales que no conviene mandar vacíos.

Ejemplo:

```ts
{ key: 'year', type: 'number', omitWhenEmpty: true }
```

Si el usuario deja el año vacío, hay dos opciones:

```ts
year: null
```

o directamente no mandar `year`.

Con `omitWhenEmpty`, el payload no incluye ese campo.

Esto suele ser más seguro con DTOs parciales y campos opcionales, porque dejas que el backend mantenga defaults o ignore valores no enviados.

También se usa en:

- `image`
- `movieUrl`
- `rating`
- `actorIds`
- `subgenreIds`
- `comment`
- `planId`
- fechas opcionales de usuario

## 10. Por qué hay un servicio `AdminCrudService`

`AdminCrudService` concentra las llamadas HTTP comunes:

```ts
list(resource, page, perPage)
getById(resource, id)
create(resource, payload)
update(resource, id, payload)
delete(resource, id)
```

La idea es que el componente no tenga que saber si está llamando a `/movies`, `/actors` o `/reviews`.

Solo hace:

```ts
this.adminCrud.list(this.config.resource)
```

Si `resource` es `movies`, llama a:

```txt
/api/movies
```

Si `resource` es `actors`, llama a:

```txt
/api/actors
```

Esto reduce duplicación y mantiene todos los CRUD con la misma forma de comunicación.

Para películas, la configuración es más rica:

```ts
movies: {
  resource: 'movies',
  routePath: 'movies',
  seedImages: true,
  columns: [
    { key: 'image', type: 'image' },
    { key: 'title', label: 'Título' },
    { key: 'director.name', label: 'Director' },
  ],
  fields: [
    { key: 'title', type: 'text', required: true },
    { key: 'rating', type: 'rating' },
    { key: 'country', type: 'country', required: true },
    { key: 'actorIds', type: 'multiselect', relationArray: { path: 'actors', itemPath: 'actor' } },
    { key: 'subgenreIds', type: 'multiselect', relationArray: { path: 'subgenres', itemPath: 'subgenre' } },
  ],
}
```

Eso es lo que permite que películas use el CRUD común sin perder lo que tenía de especial.

## 11. Creé componentes propios sin duplicar pantallas enormes

Para cumplir la jerarquía del admin, cada apartado tiene componentes propios:

- `admin-reviews-list`
- `admin-reviews-form`
- `admin-users-list`
- `admin-users-form`
- `admin-directors-list`
- `admin-directors-form`
- `admin-actors-list`
- `admin-actors-form`
- `admin-production-companies-list`
- `admin-production-companies-form`
- `admin-subgenres-list`
- `admin-subgenres-form`
- `admin-movies-list`
- `admin-movies-form`

Pero esos componentes envuelven el CRUD común. Es decir: existen como piezas separadas en la estructura del proyecto, pero no duplican 300 líneas de HTML cada uno.

Esto acelera muchísimo porque si mañana mejoras el modal, la tabla o un input, se mejora en todos los CRUD a la vez.

## 12. Las rutas son explícitas

En `src/app/app.routes.ts` añadí rutas explícitas como:

- `/admin-dashboard/movies`
- `/admin-dashboard/movies/new`
- `/admin-dashboard/movies/:id/edit`
- `/admin-dashboard/reviews`
- `/admin-dashboard/reviews/new`
- `/admin-dashboard/reviews/:id/edit`
- `/admin-dashboard/users`
- `/admin-dashboard/users/new`
- `/admin-dashboard/users/:id/edit`

Y lo mismo para usuarios, directores, actores, productoras y subgéneros.

Cada ruta pasa su configuración con `data: { adminCrud: ... }`.

## 13. Los selects se cargan solos

El formulario genérico mira si un campo tiene `optionSource`.

Por ejemplo, reviews necesita:

- perfiles desde `/profiles`
- películas desde `/movies`

Películas necesita:

- directores desde `/directors`
- productoras desde `/production-companies`
- actores desde `/actors`
- subgéneros desde `/subgenres`

Usuarios necesita:

- planes desde `/plans`

Entonces el formulario carga esas opciones con `AdminCrudService.listAll(...)` y pinta un `<select>`.

## 14. Los países usan facets como en películas

Para no escribir países a mano, los campos `country` usan:

```ts
MovieService.getFacets()
```

Es la misma idea que `admin-movie-form`: se sacan los países desde las facets del backend y se pintan como chips con bandera.

Esto se aplica a:

- películas
- actores
- productoras

Además, al editar, si el país guardado no aparece en facets, se añade al principio de la lista para no perder el valor actual.

## 15. Cómo se convirtió películas al CRUD

Películas antes tenía componentes propios:

- `admin-movie-list`
- `admin-movie-form`

La conversión no fue “tirarlo todo y hacerlo simple”. Fue mover sus piezas especiales al sistema común.

### Lista de películas

La lista genérica aprendió:

- columna `type: 'image'` para pintar poster o placeholder
- `seedImages: true` para mostrar el botón `Actualizar posters`
- uso de `deleteLabelKey: 'title'` para el modal de borrado

Así `/admin-dashboard/movies` ya usa:

- `admin-movies-list`
- `admin-crud-list`
- `ADMIN_CRUD_CONFIGS['movies']`

### Formulario de películas

El formulario genérico aprendió:

- director
- productora
- actores múltiples
- subgéneros múltiples
- país por facets
- rating con calaveras
- seed de imágenes en la lista
- payload con `actorIds` y `subgenreIds`

Para eso añadí nuevos tipos de campo:

- `country`: selector de países por facets, con chips y banderas.
- `multiselect`: chips seleccionables para relaciones muchos-a-muchos.
- `rating`: selector visual con calaveras.

También añadí `relationArray`, que sirve para leer relaciones anidadas cuando editas.

El backend devuelve actores más o menos así:

```ts
actors: [
  { actor: { id: 1, name: '...' } }
]
```

Pero el DTO espera:

```ts
actorIds: [1]
```

Entonces la config dice:

```ts
relationArray: {
  path: 'actors',
  itemPath: 'actor',
  idKey: 'id'
}
```

Y el formulario sabe convertir esa relación anidada en IDs.

Validaciones basadas en DTO:

- título obligatorio y máximo 255
- país obligatorio y máximo 255
- año entre 1800 y 2100
- rating entre 1 y 5
- URLs hasta 2048 caracteres
- director y productora obligatorios

## 16. Qué pasa al guardar

El formulario genérico hace esto:

1. Revisa si el formulario es válido.
2. Construye un `payload` usando los campos de la config.
3. Convierte `number`, `select` y `rating` a número.
4. Convierte `multiselect` a arrays de números.
5. Omite campos opcionales vacíos cuando tienen `omitWhenEmpty`.
6. Si estás creando, llama a `POST /api/<resource>`.
7. Si estás editando, llama a `PATCH /api/<resource>/<id>`.
8. Vuelve a la lista del recurso.

Para películas, eso produce un payload del estilo:

```ts
{
  title: 'Scream',
  country: 'US',
  directorId: 1,
  productionCompanyId: 2,
  actorIds: [1, 4, 8],
  subgenreIds: [2, 5]
}
```

Ese payload coincide con `CreateMovieDto` / `UpdateMovieDto`.

## 17. Por qué esto fue rápido

Porque no intenté “hacer pantallas” una por una.

El proceso fue:

1. Detectar el patrón repetido.
2. Leer los DTO para saber los campos reales.
3. Crear una configuración por recurso.
4. Hacer una lista genérica.
5. Hacer un formulario genérico.
6. Crear wrappers por apartado para mantener la jerarquía del proyecto.
7. Añadir capacidades especiales al CRUD cuando un recurso lo necesitaba.
8. Meter `movies` en la misma arquitectura.
9. Compilar y corregir errores.

Esto es una técnica muy común en paneles de administración: cuando muchos recursos son CRUD simples, se invierte un poco de tiempo en una base reutilizable y después cada CRUD nuevo cuesta muy poco.

No es que tú hubieses tardado muchísimo por hacerlo “mal”; es que hacerlo manualmente sí sería muchísimo trabajo. La diferencia está en detectar que el problema no eran siete CRUD aislados, sino un CRUD configurable repetido con variaciones.

## 18. Archivos importantes

- `src/app/components/admin/admin-crud/admin-crud.config.ts`
- `src/app/components/admin/admin-crud/admin-crud-list/`
- `src/app/components/admin/admin-crud/admin-crud-form/`
- `src/app/components/admin/admin-movies/admin-movies-list/`
- `src/app/components/admin/admin-movies/admin-movies-form/`
- `src/app/services/admin-crud.service.ts`
- `src/app/app.routes.ts`

Los componentes antiguos `admin-movie-list` y `admin-movie-form` pueden quedar como referencia, pero las rutas de admin de películas ya apuntan al sistema `admin-crud`.

## 19. Cómo comprobarlo

Compila el frontend con:

```bash
npm run build
```

Y prueba estas rutas con un usuario autorizado:

- `/admin-dashboard/movies`
- `/admin-dashboard/reviews`
- `/admin-dashboard/users`
- `/admin-dashboard/directors`
- `/admin-dashboard/actors`
- `/admin-dashboard/production-companies`
- `/admin-dashboard/subgenres`
