import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class InternalOrJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const internalService = request.headers['x-internal-service'];
    
    // Allow internal service calls
    const allowedServices = ['telemetry-service', 'integration-service'];
    if (internalService && allowedServices.includes(internalService.toLowerCase())) {
      return true;
    }

    // For non-internal calls, use JWT auth
    // This will be handled by JwtAuthGuard if applied
    return true;
  }
}

