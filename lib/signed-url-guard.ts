import {
  Injectable,
  CanActivate,
  ExecutionContext,
  MethodNotAllowedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithSignature } from './interfaces';
import { UrlGeneratorService } from './url-generator.service';

@Injectable()
export class SignedUrlGuard implements CanActivate {
  constructor(private readonly urlGeneratorService: UrlGeneratorService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: RequestWithSignature): boolean {
    if (!request.headers.host) {
      throw new MethodNotAllowedException(
        'Unable to derive host name from request',
      );
    }

    if (!request.path) {
      throw new MethodNotAllowedException('Unable to derive path from request');
    }

    if (!request.query) {
      throw new MethodNotAllowedException('Signed Query is invalid');
    }

    return this.urlGeneratorService.isSignatureValid({
      protocol: request.protocol,
      host: request.headers.host,
      routePath: request.path,
      query: request.query,
    });
  }
}
