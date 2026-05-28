# Autenticación y autorización (JWT + Guards + Roles)

Cómo funciona el sistema de auth del backend ESCREAM, pieza por pieza.

Dos conceptos a separar:

- **Autenticación** = "¿quién eres?" → JWT + estrategia Passport + `JwtUserAuthGuard`.
- **Autorización** = "¿puedes hacer esto?" → `@Roles(...)` + `RolesGuard`.

---

## 1. El JWT: creación, contenido y verificación

**Creación** (al hacer login/register) — `src/auth/auth.service.ts`:

```ts
private signToken(sub: number, email: string, role: Role): string {
  return this.jwt.sign({ sub, email, role });
}
```

`this.jwt` es el `JwtService` configurado en `src/auth/auth.module.ts`:

```ts
JwtModule.register({
  secret: process.env.JWT_USER_SECRET,
  signOptions: { expiresIn: process.env.JWT_USER_EXPIRES_IN ?? '7d' },
})
```

- El token se **firma** con `JWT_USER_SECRET`. Esa firma hace que el contenido
  (`sub`, `email`, `role`) sea **imposible de falsificar**: si el cliente cambia
  `role` a `ADMIN`, la firma deja de cuadrar y el token se rechaza.
- `sub` = id del usuario, `role` = su rol, y caduca en 7 días.

Un JWT son 3 partes (`header.payload.firma`) en base64. El **payload es legible por
cualquiera** (no está cifrado, solo firmado) → nunca metas secretos ahí, solo
identificadores.

**Envío**: el frontend manda en cada petición:

```
Authorization: Bearer <token>
```

(de eso se encarga el interceptor de Angular).

---

## 2. La estrategia Passport: el puente token → usuario

`src/auth/strategies/jwt-user.strategy.ts`:

```ts
@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // de dónde saca el token
      ignoreExpiration: false,                                  // rechaza caducados
      secretOrKey: process.env.JWT_USER_SECRET,                 // con qué verifica la firma
    });
  }

  async validate(payload: JwtUserPayload) {
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException();
    return user; // ← esto acaba en req.user
  }
}
```

Lo que hace Passport **antes** de llamar a `validate`:

1. Saca el token del header `Authorization: Bearer`.
2. Verifica la firma con el secret y comprueba que no esté caducado. Si falla → 401.
3. Si es válido, decodifica el `payload` y lo pasa a `validate`.

En `validate` hay un paso clave: **se recarga el usuario de la BD** por su `sub` (id).
Por tanto:

- Lo que acaba en `req.user` es el usuario **fresco de BD** (incluido su `role`
  actual), no el del token.
- Si degradas a alguien de ADMIN a USER, aplica en su siguiente petición aunque su
  token siga diciendo `ADMIN`.

El `'jwt-user'` de `PassportStrategy(Strategy, 'jwt-user')` es el **nombre** de la
estrategia; se usa en el guard.

---

## 3. `JwtUserAuthGuard`: guard de autenticación

`src/auth/guards/jwt-user-auth.guard.ts`:

```ts
@Injectable()
export class JwtUserAuthGuard extends AuthGuard('jwt-user') {}
```

Un **guard** es una clase con `canActivate()` que devuelve `true` (pasa) o lanza
excepción (corta). Este hereda de `AuthGuard('jwt-user')`, así que su `canActivate`
**dispara la estrategia `jwt-user`**. Resultado:

- Token válido → deja pasar y coloca el usuario en `req.user`.
- Token ausente/inválido/caducado → `401 Unauthorized`.

Se aplica con `@UseGuards(JwtUserAuthGuard)`.

---

## 4. `@Roles(...)` + `RolesGuard`: la autorización

El **decorador** solo **etiqueta** el endpoint con los roles permitidos —
`src/auth/decorators/roles.decorator.ts`:

```ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

`SetMetadata` adjunta metadatos (`'roles' → [EDITOR, ADMIN]`) a la ruta. **No comprueba
nada**, solo deja una nota.

El **guard** lee esa nota y decide — `src/auth/guards/roles.guard.ts`:

```ts
canActivate(context: ExecutionContext): boolean {
  const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
    context.getHandler(),  // metadatos del método
    context.getClass(),    // o de la clase
  ]);

  if (!required || required.length === 0) return true; // sin @Roles → libre

  const user = context.switchToHttp().getRequest().user; // lo puso JwtUserAuthGuard
  if (!user) throw new ForbiddenException('No autenticado');

  if (!required.includes(user.role)) {
    throw new ForbiddenException('No tienes permisos para esta acción');
  }
  return true;
}
```

- El `Reflector` **lee los metadatos** que puso `@Roles`. `getAllAndOverride` mira
  primero el método y, si no, la clase (puedes poner `@Roles` a nivel de clase y
  sobreescribir en un método).
- Lee `req.user.role` (fresco de BD, por el paso 2) y comprueba que esté entre los
  permitidos.
- Si el endpoint **no tiene** `@Roles`, devuelve `true` → no restringe por rol.

> ⚠️ `RolesGuard` **depende** de que `JwtUserAuthGuard` corra antes (es quien deja
> `req.user`).

---

## 5. `@CurrentUser`: decorador de parámetro

`src/auth/decorators/current-user.decorator.ts`:

```ts
export const CurrentUser = createParamDecorator(
  (_data, ctx) => ctx.switchToHttp().getRequest().user,
);
```

Atajo para inyectar `req.user` directamente en un argumento del controlador:

```ts
@Get('who')
who(@CurrentUser() user) { return user; }
```

No protege nada; solo entrega el usuario que dejó el guard.

---

## 6. Todo junto: una petición real

`DELETE /movies/:id` (en `src/movies/movies.controller.ts`):

```ts
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete(':id')
remove(...) { ... }
```

```
Petición: DELETE /api/movies/5  con header Authorization: Bearer eyJ...
        │
        ▼
1. JwtUserAuthGuard  → Passport saca el token, verifica firma+caducidad con
        │              JWT_USER_SECRET, decodifica payload {sub,email,role},
        │              validate() recarga el user de BD → req.user
        │              (si algo falla → 401)
        ▼
2. RolesGuard        → Reflector lee @Roles = [ADMIN]
        │              ¿req.user.role === ADMIN? sí → pasa / no → 403
        ▼
3. remove()          → se ejecuta el método del controlador
```

**Los guards corren en el orden de `@UseGuards(...)`**: primero autentica, luego
autoriza. Si pusieras `RolesGuard` primero, no habría `req.user` todavía y fallaría.

---

## Resumen mental

- **JWT** = carnet firmado que dice quién eres (y tu rol). El secret garantiza que no
  se falsifica.
- **Estrategia** = verifica el carnet y trae el usuario real de BD.
- **`JwtUserAuthGuard`** = "enseña un carnet válido o no pasas" (401).
- **`@Roles` + `RolesGuard`** = "además, tu rol tiene que estar en la lista" (403).
- **`@CurrentUser`** = "dame el usuario ya identificado".

---

## Dónde se usa hoy

| Endpoint | Protección |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Público |
| `POST/PATCH/GET /auth/*` (logout, refresh, who, changeSubscription) | `JwtUserAuthGuard` |
| `GET /movies`, `GET /movies/:id`, `/movies/facets`, `/movies/slug/:slug` | Público |
| `POST /movies`, `PATCH /movies/:id` | `JwtUserAuthGuard` + `RolesGuard` → `EDITOR`, `ADMIN` |
| `DELETE /movies/:id` | `JwtUserAuthGuard` + `RolesGuard` → `ADMIN` |
| `/users/*` (CRUD) | `JwtUserAuthGuard` + `RolesGuard` → `ADMIN` |
