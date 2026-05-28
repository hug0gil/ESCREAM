import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LogRequestsInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Request');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const { authorization: _a, cookie: _c, ...headers } = req.headers;
        const { password: _p, ...body } = (req.body ?? {}) as Record<string, unknown>;

        this.logger.log({
          url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          ip: req.ip,
          method: req.method,
          headers,
          body,
          status: res.statusCode,
        });
      }),
    );
  }
}
