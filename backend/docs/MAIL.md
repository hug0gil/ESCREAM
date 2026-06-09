# Correo y verificación de cuentas

Este documento explica todo el flujo de correo de ESCREAM: qué se ha implementado en backend, cómo se conecta con Angular, cómo probarlo en local y qué hay que cambiar al subirlo a un servidor gratuito de Oracle Cloud.

## Qué hace el sistema

El sistema de correo cubre tres casos:

- Crear cuenta: el usuario se registra, recibe un enlace y solo puede iniciar sesión cuando verifica el correo.
- Recuperar contraseña: el usuario pide un enlace temporal para poner una contraseña nueva.
- Cambiar correo: el usuario autenticado introduce un correo nuevo y su contraseña actual; el cambio solo se aplica al confirmar el enlace enviado al nuevo correo.

La idea clave es esta: el backend no confía en que el usuario escriba un email, sino en que puede abrir el enlace enviado a ese email.

## Archivos importantes

Backend:

- `src/mail/mail.service.ts`: configura Nodemailer y genera los emails HTML.
- `src/mail/mail.module.ts`: exporta `MailService` para que lo use `AuthModule`.
- `src/auth/auth.service.ts`: genera tokens, los guarda hasheados, valida caducidad y ejecuta cada acción.
- `src/auth/auth.controller.ts`: expone los endpoints HTTP.
- `src/auth/dto/*.dto.ts`: valida los cuerpos de las peticiones.
- `prisma/schema.prisma`: contiene `VerificationToken` y `VerificationTokenType`.
- `docs/MAIL.md`: este documento.

Frontend:

- `frontend/src/app/services/auth/auth.service.ts`: métodos HTTP que llaman al backend.
- `frontend/src/app/app.routes.ts`: rutas que reciben los enlaces del correo.
- `frontend/src/app/components/auth/register/*`: registro y reenvío de verificación.
- `frontend/src/app/components/auth/login/*`: login y reenvío si la cuenta no está verificada.
- `frontend/src/app/components/auth/forgot-password/*`: solicitar recuperación.
- `frontend/src/app/components/auth/reset-password/*`: poner nueva contraseña con token.
- `frontend/src/app/components/auth/token-action/*`: confirmar verificación de cuenta o cambio de correo.
- `frontend/src/app/components/dashboard/*`: solicitar cambio de correo desde cuenta autenticada.

## Variables de entorno del backend

En `.env` del backend:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hgilbailon@gmail.com
SMTP_PASS=contraseña_de_aplicacion_de_google
MAIL_FROM="ESCREAM <hgilbailon@gmail.com>"
FRONTEND_URL=http://localhost:4200
```

Significado:

- `SMTP_HOST`: servidor SMTP. Para Gmail es `smtp.gmail.com`.
- `SMTP_PORT`: con Gmail se usa `587`.
- `SMTP_SECURE`: con puerto `587` debe ser `false`, porque se usa STARTTLS.
- `SMTP_USER`: cuenta Gmail que envía.
- `SMTP_PASS`: contraseña de aplicación de Google, no la contraseña normal.
- `MAIL_FROM`: remitente visible. Con Gmail debe coincidir con `SMTP_USER` para evitar problemas.
- `FRONTEND_URL`: URL base del frontend. El backend la usa para construir enlaces como `/verify-email?token=...`.

En desarrollo local:

```env
FRONTEND_URL=http://localhost:4200
```

En producción:

```env
FRONTEND_URL=https://tu-dominio.com
```

No uses `localhost` en producción. Si lo haces, el usuario recibirá un enlace que apunta a su propio ordenador, no a tu servidor.

## Gmail y spam

Con Gmail personal es normal que los correos caigan en spam durante desarrollo, sobre todo si:

- El remitente es una cuenta personal.
- Los enlaces apuntan a `localhost`.
- El dominio no tiene SPF, DKIM y DMARC.
- El contenido viene de una app nueva sin reputación.

Para desarrollo vale con marcar el correo como "No es spam". Para producción lo correcto es usar un proveedor de correo transaccional como Brevo, Resend, MailerSend, SendGrid o Amazon SES, y configurar DNS del dominio.

## Base de datos

El backend usa una tabla `verification_tokens`.

```prisma
enum VerificationTokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  EMAIL_CHANGE
}

model VerificationToken {
  id        Int                   @id @default(autoincrement())
  userId    Int                   @map("user_id")
  tokenHash String                @unique @map("token_hash")
  type      VerificationTokenType
  newEmail  String?               @map("new_email")
  expiresAt DateTime              @map("expires_at")
  usedAt    DateTime?             @map("used_at")
  createdAt DateTime              @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("verification_tokens")
}
```

El token real nunca se guarda en base de datos. El backend:

1. Genera un token aleatorio con `randomBytes`.
2. Envía el token real por email.
3. Guarda en base de datos `SHA-256(token)`.
4. Cuando el usuario confirma, vuelve a hashear el token recibido y busca ese hash.

Esto evita que alguien pueda usar enlaces activos aunque vea la tabla de tokens.

## Endpoints del backend

Todos tienen prefijo global `/api`.

### Registro

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Hugo",
  "email": "hugo@example.com",
  "password": "password123"
}
```

Qué hace:

1. Crea el usuario con `emailVerifiedAt = null`.
2. Genera un token `EMAIL_VERIFICATION`.
3. Envía un email con enlace a:

```text
${FRONTEND_URL}/verify-email?token=...
```

4. Devuelve mensaje de cuenta creada, pero no devuelve JWT.

### Verificar cuenta

```http
POST /api/auth/verify-email
```

Body:

```json
{
  "token": "token_del_enlace"
}
```

Qué hace:

- Busca el hash del token.
- Comprueba tipo, caducidad y que no esté usado.
- Actualiza `emailVerifiedAt`.
- Marca el token como usado.

### Reenviar verificación

```http
POST /api/auth/resend-verification
```

Body:

```json
{
  "email": "hugo@example.com"
}
```

Devuelve siempre un mensaje genérico para no revelar si una cuenta existe.

### Login

```http
POST /api/auth/login
```

El backend rechaza el login si `emailVerifiedAt` es `null`.

Respuesta en ese caso:

```json
{
  "message": "Email not verified"
}
```

El frontend detecta ese mensaje y muestra el botón para reenviar verificación.

### Solicitar recuperación de contraseña

```http
POST /api/auth/forgot-password
```

Body:

```json
{
  "email": "hugo@example.com"
}
```

Si el correo existe, envía un enlace a:

```text
${FRONTEND_URL}/reset-password?token=...
```

La respuesta también es genérica para no permitir enumeración de usuarios.

### Cambiar contraseña con token

```http
POST /api/auth/reset-password
```

Body:

```json
{
  "token": "token_del_enlace",
  "password": "nuevaPassword123"
}
```

Si el token es válido, se hashea la nueva contraseña con bcrypt y se consume el token.

### Solicitar cambio de correo

```http
POST /api/auth/request-email-change
Authorization: Bearer <jwt>
```

Body:

```json
{
  "newEmail": "nuevo@example.com",
  "currentPassword": "passwordActual123"
}
```

Qué hace:

- Exige sesión iniciada.
- Comprueba la contraseña actual.
- Comprueba que el nuevo correo no esté en uso.
- Envía un enlace al correo nuevo:

```text
${FRONTEND_URL}/confirm-email-change?token=...
```

### Confirmar cambio de correo

```http
POST /api/auth/confirm-email-change
```

Body:

```json
{
  "token": "token_del_enlace"
}
```

Si el token es válido, actualiza `user.email`, rellena `emailVerifiedAt` y consume el token.

## Cómo se conecta el frontend con el backend

El backend no envía enlaces directos a endpoints API. Envía enlaces al frontend.

Ejemplo:

```text
http://localhost:4200/verify-email?token=abc123
```

Angular abre esa ruta, lee el token de la query string y llama al backend:

```ts
this.auth.verifyEmail(token)
```

Mapa completo:

| Email recibido | Ruta Angular | Método Angular | Endpoint backend |
| --- | --- | --- | --- |
| Verificación de cuenta | `/verify-email?token=...` | `verifyEmail(token)` | `POST /api/auth/verify-email` |
| Reset de contraseña | `/reset-password?token=...` | `resetPassword(...)` | `POST /api/auth/reset-password` |
| Cambio de correo | `/confirm-email-change?token=...` | `confirmEmailChange(token)` | `POST /api/auth/confirm-email-change` |

Además:

| Pantalla Angular | Método Angular | Endpoint backend |
| --- | --- | --- |
| Registro | `register(...)` | `POST /api/auth/register` |
| Login | `login(...)` | `POST /api/auth/login` |
| Reenviar verificación | `resendVerification(email)` | `POST /api/auth/resend-verification` |
| Olvidé contraseña | `forgotPassword(email)` | `POST /api/auth/forgot-password` |
| Dashboard, cambiar correo | `requestEmailChange(...)` | `POST /api/auth/request-email-change` |

## Plantillas HTML de correo

Las plantillas están en `src/mail/mail.service.ts`.

Se usa HTML con estilos inline porque muchos clientes de correo eliminan CSS externo, `<style>`, fuentes remotas y reglas avanzadas. El diseño sigue la identidad de ESCREAM:

- Fondo oscuro.
- Cabecera morada/azul.
- Borde rojo.
- Botón principal rojo.
- Acentos ámbar.
- Caja secundaria con el enlace en texto plano.

Cada correo incluye:

- `html`: versión visual.
- `text`: versión plana para clientes que no renderizan HTML.
- Enlace como botón.
- Enlace completo visible por si el botón falla.
- Footer explicando qué hacer si el usuario no solicitó la acción.

## Logs de entrega

Después de enviar un correo, `MailService` escribe un log:

```ts
{
  msg: 'Mail sent',
  to: 'usuario@example.com',
  accepted: ['usuario@example.com'],
  rejected: [],
  messageId: '...',
  response: '250 ...'
}
```

Interpretación:

- `accepted`: Gmail/SMTP aceptó el correo.
- `rejected`: el servidor SMTP rechazó destinatarios.
- `response`: respuesta SMTP.

Si aparece en `accepted` pero no llega a entrada, revisa spam/promociones. Si aparece en `rejected` o se lanza una excepción, el problema está en SMTP, credenciales o configuración.

## Pruebas en local

1. Arrancar backend.
2. Arrancar Angular.
3. Crear cuenta desde `/register`.
4. Revisar correo.
5. Abrir enlace `/verify-email?token=...`.
6. Iniciar sesión.

Si la cuenta ya existe pero no está verificada:

1. Ir a `/login`.
2. Intentar iniciar sesión.
3. Pulsar "Reenviar verificación".

Para probar reset:

1. Ir a `/forgot-password`.
2. Escribir correo.
3. Abrir enlace recibido.
4. Poner contraseña nueva en `/reset-password?token=...`.

Para probar cambio de correo:

1. Iniciar sesión.
2. Entrar en dashboard.
3. Escribir correo nuevo y contraseña actual.
4. Abrir el enlace recibido en el correo nuevo.

## Despliegue en Oracle Cloud Free

En Oracle Cloud Free lo importante es que las URLs públicas ya no sean `localhost`.

Ejemplo de escenario:

- Frontend Angular servido con Nginx en `https://escream.midominio.com`.
- Backend NestJS corriendo en la misma VM en puerto interno `3000`.
- Nginx hace proxy de `/api` hacia `http://localhost:3000`.

### Variables del backend en Oracle

En la VM de Oracle:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/escream?schema=public"
JWT_USER_SECRET="un_secreto_largo_y_aleatorio"
JWT_USER_EXPIRES_IN="7d"

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=hgilbailon@gmail.com
SMTP_PASS=contraseña_de_aplicacion_de_google
MAIL_FROM="ESCREAM <hgilbailon@gmail.com>"

FRONTEND_URL=https://escream.midominio.com
```

`FRONTEND_URL` tiene que ser la URL pública que verá el usuario en el navegador.

### Environment del frontend

Si Nginx sirve backend y frontend en el mismo dominio, lo más cómodo es:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://escream.midominio.com/api',
};
```

Si frontend y backend están separados:

```ts
export const environment = {
  production: true,
  apiUrl: 'https://api.escream.midominio.com/api',
};
```

Después se recompila Angular:

```bash
npm run build
```

Y se sube `dist/front-end-escream` al directorio servido por Nginx.

### Nginx recomendado

Ejemplo usando mismo dominio para frontend y backend:

```nginx
server {
    listen 80;
    server_name escream.midominio.com;

    root /var/www/escream/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Con HTTPS usando Certbot, el bloque pasará a `listen 443 ssl`.

### Puertos en Oracle

Tienes que abrir:

- `80`: HTTP.
- `443`: HTTPS.

Si usas Nginx como proxy, no hace falta abrir `3000` públicamente. El backend puede escuchar en `localhost:3000` o en `0.0.0.0:3000`, pero el acceso externo pasa por Nginx.

Hay dos sitios que revisar:

- Security List o Network Security Group de Oracle.
- Firewall de la VM, por ejemplo `ufw` o `firewalld`.

### SMTP en Oracle

Para Gmail con puerto `587`, normalmente no necesitas abrir puertos entrantes. El backend hace una conexión saliente hacia Gmail.

Si el envío falla en Oracle pero funciona en local:

- Comprueba que la VM tiene salida a internet.
- Comprueba que `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS` están realmente cargados.
- Mira los logs de `MailService`.
- Evita puerto `25`; muchos proveedores cloud lo bloquean. Usa `587`.

### CORS

Ahora el backend tiene CORS permisivo para desarrollo:

```ts
app.enableCors({
  origin: true,
  credentials: true,
});
```

En producción sería mejor limitarlo:

```ts
app.enableCors({
  origin: ['https://escream.midominio.com'],
  credentials: true,
});
```

Si usas mismo dominio y Nginx proxy para `/api`, CORS deja de ser un problema porque frontend y API comparten origen.

### Proceso recomendado de despliegue

1. Crear VM Ubuntu en Oracle Cloud Free.
2. Instalar Node.js, npm, PostgreSQL y Nginx.
3. Clonar el proyecto.
4. Configurar `.env` del backend con URLs públicas.
5. Ejecutar migraciones Prisma.
6. Compilar backend.
7. Ejecutar backend con PM2 o systemd.
8. Configurar `environment.ts` del frontend con API pública.
9. Compilar frontend.
10. Copiar `dist/front-end-escream` a `/var/www/escream/frontend`.
11. Configurar Nginx.
12. Activar HTTPS con Certbot.
13. Probar registro y verificar que el enlace recibido apunta al dominio público.

## Checklist de problemas comunes

- El correo llega a spam: normal con Gmail personal y dominio sin reputación.
- El enlace apunta a `localhost`: `FRONTEND_URL` está mal en producción.
- Angular abre una página 404 al pulsar el enlace: falta `try_files ... /index.html` en Nginx.
- El backend recibe `POST /auth/...` sin `/api`: `apiUrl` del frontend está mal.
- Gmail rechaza credenciales: `SMTP_PASS` no es contraseña de aplicación.
- El correo no cambia tras confirmar: refresca sesión o vuelve a iniciar sesión para que el frontend actualice el usuario local.
- Registro devuelve 201 pero no llega correo: mira logs de `MailService`; si no hay log, el backend que está corriendo no tiene el código actualizado o no se reinició.
