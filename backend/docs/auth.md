# JWT Auth y Roles en NestJS — Guía completa

## 1. El token JWT

Cuando el usuario hace login, el servidor firma un token con sus datos:

```typescript
this.jwt.sign({ sub: 1, email: 'hugo@example.com', role: Role.USER })
```

Ese token viaja en cada request siguiente en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token tiene tres partes separadas por puntos: **header.payload.firma**. El payload contiene los datos que metiste con `sign()`. La firma garantiza que nadie ha manipulado el token.

---

## 2. Strategy — la lógica de verificación

`JwtUserStrategy` es la clase que sabe **cómo** verificar un token:

```typescript
export class JwtUserStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(private readonly users: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // dónde buscar el token
      ignoreExpiration: false,                                   // rechaza tokens expirados
      secretOrKey: process.env.JWT_USER_SECRET,                 // clave para verificar la firma
    });
  }

  async validate(payload: JwtUserPayload) {
    // payload = { sub: 1, email: 'hugo@example.com', role: Role.USER }
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException();
    return user; // esto se convierte en request.user
  }
}
```

`validate()` se llama automáticamente cuando el token es válido. Busca el usuario en BD porque el token puede ser válido pero el usuario puede haber sido borrado desde que se emitió.

Lo que devuelves en `validate()` Passport lo inyecta en `request.user`.

---

## 3. Guard — el activador

`JwtUserAuthGuard` es el "candado" que aplicas en los controladores:

```typescript
export class JwtUserAuthGuard extends AuthGuard('jwt-user') {}
```

El string `'jwt-user'` es el enlace entre Guard y Strategy — Passport busca la Strategy registrada con ese nombre.

Sin Guard, la ruta es pública. Con Guard, Passport ejecuta la Strategy antes de dejar pasar la request.

---

## 4. Cómo se enlazan

```
'jwt-user' en PassportStrategy(Strategy, 'jwt-user')
         ↕  mismo string
'jwt-user' en AuthGuard('jwt-user')
```

---

## 5. Flujo completo de una request protegida

```
Request con "Authorization: Bearer <token>"
        ↓
@UseGuards(JwtUserAuthGuard)  ← intercepta la request
        ↓
Passport busca la Strategy registrada como 'jwt-user'
        ↓
Strategy extrae el token del header
        ↓
Verifica la firma con JWT_USER_SECRET
        ↓
Decodifica el payload: { sub: 1, email: '...', role: 'USER' }
        ↓
Llama a validate(payload)
        ↓
validate() busca el usuario en BD por payload.sub
        ↓
return user  →  Passport lo mete en request.user
        ↓
La request llega al controlador con request.user disponible
```

---

## 6. Usar el usuario en el controlador

### Con `@Request()` (forma larga)

```typescript
@UseGuards(JwtUserAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user
}
```

### Con `@CurrentUser()` (decorador personalizado, forma limpia)

```typescript
@UseGuards(JwtUserAuthGuard)
@Post('refresh')
refresh(@CurrentUser() user: Omit<User, 'password'>) {
  return this.auth.refresh(user)
}
```

`@CurrentUser()` es simplemente un decorador que extrae `request.user` por ti:

```typescript
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
)
```

`Omit<User, 'password'>` le dice a TypeScript que el objeto tiene todos los campos de User excepto `password`. No elimina nada en runtime — es solo tipado.

---

## 7. Cuándo NO se usa request.user

Si una ruta solo necesita comprobar que el usuario está autenticado y tiene el rol correcto (como un panel de admin), el Guard hace su trabajo pero `request.user` no se usa dentro del controlador:

```typescript
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Get()
findAll() {
  return this.users.findAll() // no necesita saber quién pregunta
}
```

`request.user` se usa cuando la lógica depende de **quién** hace la petición (ver mi perfil, crear una review como yo, etc.).

---

## 8. Roles — control de acceso por rol

### Las tres piezas

**`@Roles()` — el decorador**

Es una etiqueta que pegas en una ruta para declarar qué roles pueden acceder. Por debajo solo guarda esa información en los metadatos de la ruta. No hace nada por sí solo:

```typescript
@Roles(Role.EDITOR, Role.ADMIN)
@Post()
create() { ... }
```

**`RolesGuard` — quien lee esa etiqueta**

```typescript
canActivate(context: ExecutionContext): boolean {
  // 1. Lee los roles que declaraste con @Roles()
  const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [...]);
  // required = [Role.EDITOR, Role.ADMIN]

  // 2. Si la ruta no tiene @Roles, deja pasar a todo el mundo
  if (!required || required.length === 0) return true;

  // 3. Coge el usuario que JwtUserAuthGuard dejó en request.user
  const user = context.switchToHttp().getRequest().user;

  // 4. Comprueba si su rol está en la lista
  if (!required.includes(user.role)) {
    throw new ForbiddenException('No tienes permisos');
  }
  return true;
}
```

### Por qué van juntos `JwtUserAuthGuard, RolesGuard`

El orden importa — no se pueden intercambiar:

```
JwtUserAuthGuard → verifica el token y mete el usuario en request.user
        ↓
RolesGuard → lee request.user.role y comprueba si tiene permiso
```

Si pusiera solo `RolesGuard` sin el JWT guard, `request.user` sería `undefined` y no habría rol que comprobar.

### Ejemplo real del controlador

```typescript
// Ruta pública — cualquiera
@Get()
findAll() { ... }

// Solo EDITOR o ADMIN — token requerido + rol comprobado
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles(Role.EDITOR, Role.ADMIN)
@Post()
create() { ... }

// Solo ADMIN
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete(':id')
remove() { ... }
```

### De dónde viene el rol

El rol viene de la BD, no del token. `validate()` en la Strategy busca el usuario en BD en cada request, así que si cambias el rol de un usuario en BD el cambio es inmediato — no hace falta que el usuario vuelva a hacer login.

---

## Resumen

| Pieza                            | Qué es                                       | Dónde va                          |
| -------------------------------- | -------------------------------------------- | --------------------------------- |
| `jwt.sign({ sub, email, role })` | Crea el token                                | AuthService al hacer login        |
| `JwtUserStrategy`                | Lógica de verificación                       | Se registra en el módulo          |
| `JwtUserAuthGuard`               | Activa la Strategy                           | `@UseGuards()` en el controlador  |
| `validate()`                     | Busca el usuario en BD                       | Dentro de la Strategy             |
| `request.user`                   | El usuario verificado                        | Disponible en el controlador      |
| `@CurrentUser()`                 | Extrae `request.user`                        | Decorador en parámetro del método |
| `@Roles(Role.ADMIN)`             | Declara qué roles pueden acceder             | Decorador en la ruta              |
| `RolesGuard`                     | Lee `@Roles` y comprueba `request.user.role` | Segundo en `@UseGuards()`         |