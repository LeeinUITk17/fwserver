import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    console.log('Cookies:', request.cookies); // Kiểm tra xem cookies có không
    console.log('User in AdminGuard:', request.user); // Kiểm tra user

    if (!request.user) {
      throw new ForbiddenException('User is not authenticated.');
    }
    if (request.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Access denied: Admins only.');
    }
    return true;
  }
}
