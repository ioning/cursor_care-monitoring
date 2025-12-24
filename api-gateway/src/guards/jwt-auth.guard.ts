import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Локальный JWT guard для api-gateway.
 *
 * Важно: не импортируем guard из @care-monitoring/shared, потому что это приводит к
 * конфликтам Nest DI (разные копии @nestjs/* в разных пакетах).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}


