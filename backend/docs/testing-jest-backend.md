# Pruebas unitarias con Jest en el backend

El backend de ESCREAM usa NestJS y Jest para las pruebas unitarias. La configuración vive en `package.json`, dentro de la clave `jest`.

## Comandos

```bash
npm test
```

Ejecuta todos los archivos `*.spec.ts` dentro de `src`.

```bash
npm test -- --runInBand
```

Ejecuta las pruebas en un solo proceso. Es útil si tu entorno muestra avisos de workers de Jest o si quieres una salida más estable al depurar.

```bash
npm run test:watch
```

Deja Jest en modo observador y vuelve a ejecutar las pruebas relacionadas cuando cambias código.

```bash
npm run test:cov
```

Ejecuta las pruebas y genera el informe de cobertura en `coverage/`.

```bash
npm run test:e2e
```

Ejecuta las pruebas end-to-end de `test/` usando `test/jest-e2e.json`.

## Cómo están organizadas

Las pruebas unitarias se colocan junto al archivo probado:

```text
src/users/users.service.ts
src/users/users.service.spec.ts
```

El patrón recomendado es:

1. Crear mocks de las dependencias externas.
2. Instanciar el servicio o controlador con esos mocks.
3. Ejecutar el método a probar.
4. Verificar la respuesta y las llamadas realizadas.

Ejemplo simplificado:

```ts
const prisma = {
  user: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const service = new UsersService(prisma as any);
```

Así las pruebas no dependen de PostgreSQL ni de Prisma real. Son rápidas, repetibles y sirven para comprobar la lógica del servicio.

## Qué cubren las pruebas añadidas

- `UsersService`: paginación, creación con hash de contraseña y traducción de errores de Prisma.
- `ProfilesService`: filtros por usuario, perfil inexistente y errores de relación.
- `AuthService`: registro, login inválido, login correcto y eliminación del password en la respuesta.
- `MoviesService`: filtros de listado, facets, creación con slug/relaciones y errores HTTP.

## Diferencia entre unitarias y e2e

Las unitarias prueban una clase aislada con mocks. Por ejemplo, `UsersService` recibe un Prisma falso.

Las e2e levantan la app Nest y prueban rutas HTTP completas. Son más realistas, pero también más lentas y sensibles al entorno.

## Consejos para nuevas pruebas

- No llames a la base de datos real en pruebas unitarias.
- Usa `jest.fn()` para simular dependencias.
- Comprueba tanto el resultado como los argumentos enviados a Prisma.
- Añade casos de error cuando el servicio traduzca errores de Prisma a excepciones de Nest.
- Mantén cada `it(...)` centrado en un comportamiento concreto.
