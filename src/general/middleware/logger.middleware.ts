import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip, headers, body, query, params } = req;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || 'N/A';
    const contentType = req.get('Content-Type') || 'N/A';
    const authorization = req.get('Authorization') ? '[PRESENT]' : '[NONE]';
    const cookies = req.headers.cookie ? '[PRESENT]' : '[NONE]';
    
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Добавляем request ID к объекту запроса для дальнейшего отслеживания
    (req as any).requestId = requestId;

    // Подробный лог входящего запроса
    this.logger.log(
      `🔵 [${requestId}] ${method} ${originalUrl}`,
      {
        ip,
        userAgent: this.truncate(userAgent, 100),
        referer,
        contentType,
        authorization,
        cookies,
        queryParams: Object.keys(query).length > 0 ? query : 'NONE',
        routeParams: Object.keys(params).length > 0 ? params : 'NONE',
        bodySize: body ? `${JSON.stringify(body).length}b` : '0b',
        bodyPreview: this.sanitizeAndTruncateBody(body),
        headers: this.getImportantHeaders(headers),
        timestamp: new Date().toISOString(),
      }
    );

    // Перехватываем ответ
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const responseTime = Date.now() - startTime;
      const location = res.get('Location') || 'N/A';
      const setCookie = res.get('Set-Cookie') ? '[SET]' : '[NONE]';
      
      // Определяем уровень логирования и эмодзи по статус коду
      const { logLevel, emoji } = this.getLogLevelAndEmoji(statusCode);
      
      this.logger[logLevel](
        `${emoji} [${requestId}] ${method} ${originalUrl} → ${statusCode} (${this.getStatusText(statusCode)})`,
        {
          responseTime: `${responseTime}ms`,
          responseSize: `${contentLength}b`,
          ip,
          userAgent: this.truncate(userAgent, 50),
          location,
          setCookie,
          performance: this.getPerformanceCategory(responseTime),
          timestamp: new Date().toISOString(),
        }
      );

      // Дополнительное предупреждение для медленных запросов
      if (responseTime > 5000) {
        this.logger.warn(
          `🐌 [${requestId}] SLOW REQUEST: ${method} ${originalUrl} took ${responseTime}ms`
        );
      }
    });

    // Обработка ошибок соединения
    res.on('close', () => {
      if (!res.headersSent) {
        this.logger.warn(
          `🔌 [${requestId}] Connection closed before response: ${method} ${originalUrl}`
        );
      }
    });

    res.on('error', (error) => {
      this.logger.error(
        `💥 [${requestId}] Response error: ${method} ${originalUrl}`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
    });

    next();
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  private sanitizeAndTruncateBody(body: any): string {
    if (!body) return 'EMPTY';
    
    try {
      // Клонируем объект для безопасного изменения
      const sanitized = JSON.parse(JSON.stringify(body));
      
      // Убираем чувствительные данные
      const sensitiveFields = [
        'password', 'token', 'rawInitData', 'auth-token', 
        'authorization', 'secret', 'key', 'apiKey'
      ];
      
      const sanitizeObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key in obj) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            obj[key] = '[REDACTED]';
          } else if (typeof obj[key] === 'object') {
            obj[key] = sanitizeObject(obj[key]);
          }
        }
        return obj;
      };

      const clean = sanitizeObject(sanitized);
      const preview = JSON.stringify(clean);
      
      return this.truncate(preview, 200);
    } catch (error) {
      return '[INVALID_JSON]';
    }
  }

  private getImportantHeaders(headers: any): object {
    const important = [
      'host', 'origin', 'x-forwarded-for', 'x-real-ip', 
      'x-request-id', 'x-correlation-id', 'accept', 'accept-language'
    ];
    
    const filtered: any = {};
    important.forEach(header => {
      if (headers[header]) {
        filtered[header] = this.truncate(headers[header], 50);
      }
    });
    
    return filtered;
  }

  private getLogLevelAndEmoji(statusCode: number): { logLevel: string; emoji: string } {
    if (statusCode >= 500) return { logLevel: 'error', emoji: '🔴' };
    if (statusCode >= 400) return { logLevel: 'warn', emoji: '🟡' };
    if (statusCode >= 300) return { logLevel: 'log', emoji: '🟠' };
    if (statusCode >= 200) return { logLevel: 'log', emoji: '🟢' };
    return { logLevel: 'log', emoji: '⚪' };
  }

  private getStatusText(statusCode: number): string {
    const statusTexts: { [key: number]: string } = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
      500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable'
    };
    
    return statusTexts[statusCode] || 'Unknown';
  }

  private getPerformanceCategory(responseTime: number): string {
    if (responseTime < 100) return 'FAST ⚡';
    if (responseTime < 500) return 'NORMAL 🟢';
    if (responseTime < 1000) return 'SLOW 🟡';
    if (responseTime < 5000) return 'VERY_SLOW 🟠';
    return 'CRITICAL 🔴';
  }

  private truncate(str: string, maxLength: number): string {
    if (!str) return 'N/A';
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  }
}