import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendVerificationEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'ESCREAM: verifica tu correo',
      text: this.buildTextEmail(
        'Verifica tu cuenta de ESCREAM',
        'Activa tu cuenta para poder iniciar sesión y crear tus perfiles.',
        'Verificar correo',
        url,
      ),
      html: this.buildActionEmail({
        title: 'Verifica tu cuenta',
        eyebrow: 'Cuenta nueva',
        intro:
          'Activa tu cuenta de ESCREAM para poder iniciar sesión, elegir tu perfil y empezar a guardar tu actividad.',
        buttonText: 'Verificar correo',
        url,
        footer:
          'Si no has creado una cuenta en ESCREAM, puedes ignorar este mensaje.',
      }),
    });
    this.logDelivery(email, info);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'ESCREAM: cambia tu contraseña',
      text: this.buildTextEmail(
        'Restablece tu contraseña',
        'Hemos recibido una solicitud para cambiar la contraseña de tu cuenta.',
        'Cambiar contraseña',
        url,
      ),
      html: this.buildActionEmail({
        title: 'Restablece tu contraseña',
        eyebrow: 'Seguridad',
        intro:
          'Hemos recibido una solicitud para cambiar la contraseña de tu cuenta. El enlace caduca en 1 hora.',
        buttonText: 'Cambiar contraseña',
        url,
        footer:
          'Si no has pedido este cambio, no tienes que hacer nada. Tu contraseña seguirá siendo la misma.',
      }),
    });
    this.logDelivery(email, info);
  }

  async sendEmailChangeVerification(email: string, token: string) {
    const url = `${process.env.FRONTEND_URL}/confirm-email-change?token=${token}`;

    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'ESCREAM: confirma tu nuevo correo',
      text: this.buildTextEmail(
        'Confirma tu nuevo correo',
        'Confirma que este correo pertenece a tu cuenta de ESCREAM.',
        'Confirmar correo',
        url,
      ),
      html: this.buildActionEmail({
        title: 'Confirma tu nuevo correo',
        eyebrow: 'Cambio de correo',
        intro:
          'Confirma que este correo pertenece a tu cuenta de ESCREAM. El cambio no se aplicará hasta que pulses el botón.',
        buttonText: 'Confirmar correo',
        url,
        footer:
          'Si no has solicitado cambiar tu correo, ignora este mensaje y revisa la seguridad de tu cuenta.',
      }),
    });
    this.logDelivery(email, info);
  }

  private buildTextEmail(
    title: string,
    intro: string,
    buttonText: string,
    url: string,
  ) {
    return [
      title,
      '',
      intro,
      '',
      `${buttonText}: ${url}`,
      '',
      'ESCREAM',
    ].join('\n');
  }

  private buildActionEmail({
    title,
    eyebrow,
    intro,
    buttonText,
    url,
    footer,
  }: {
    title: string;
    eyebrow: string;
    intro: string;
    buttonText: string;
    url: string;
    footer: string;
  }) {
    const safeUrl = this.escapeHtml(url);

    return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>${this.escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#080511;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${this.escapeHtml(intro)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080511;margin:0;padding:32px 14px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-collapse:separate;border-spacing:0;background:#120d1f;border:1px solid #332852;border-radius:16px;overflow:hidden;box-shadow:0 18px 42px rgba(0,0,0,0.45);">
            <tr>
              <td style="padding:0;background:linear-gradient(180deg,#160435 0%,#2f2fff 100%);border-bottom:3px solid #ff3c38;">
                <div style="padding:28px 28px 24px;text-align:center;">
                  <div style="font-size:34px;line-height:1;font-weight:900;letter-spacing:2px;color:#ff9f1c;text-shadow:0 0 14px rgba(255,60,56,0.55);">
                    ESCREAM
                  </div>
                  <div style="margin-top:10px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.72);">
                    Horror streaming
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:34px 30px 10px;">
                <div style="display:inline-block;margin-bottom:14px;padding:7px 12px;border:1px solid rgba(255,159,28,0.45);border-radius:999px;background:rgba(255,159,28,0.08);color:#ff9f1c;font-size:12px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;">
                  ${this.escapeHtml(eyebrow)}
                </div>

                <h1 style="margin:0 0 14px;color:#ffffff;font-size:30px;line-height:1.15;font-weight:900;letter-spacing:0;text-transform:uppercase;">
                  ${this.escapeHtml(title)}
                </h1>

                <p style="margin:0;color:rgba(255,255,255,0.78);font-size:16px;line-height:1.65;">
                  ${this.escapeHtml(intro)}
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:26px 30px 20px;">
                <a href="${safeUrl}" target="_blank" style="display:inline-block;width:auto;min-width:220px;padding:15px 24px;border-radius:10px;background:#ff3c38;color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;box-shadow:0 0 20px rgba(255,60,56,0.45);">
                  ${this.escapeHtml(buttonText)}
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:0 30px 30px;">
                <div style="padding:16px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:rgba(255,255,255,0.04);">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.62);font-size:13px;line-height:1.5;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </p>
                  <a href="${safeUrl}" target="_blank" style="word-break:break-all;color:#ff9f1c;font-size:13px;line-height:1.5;text-decoration:none;">
                    ${safeUrl}
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 30px 28px;background:#0d0a16;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;color:rgba(255,255,255,0.58);font-size:13px;line-height:1.55;">
                  ${this.escapeHtml(footer)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private logDelivery(email: string, info: nodemailer.SentMessageInfo) {
    this.logger.log({
      msg: 'Mail sent',
      to: email,
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
      response: info.response,
    });
  }
}
