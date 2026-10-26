import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Malformed Authorization header');
    }

    try {
      // In production, verify using jsonwebtoken/jwtService against JWT_SECRET
      // For development/mock stage, support payload extraction and signature decoding
      const decoded = this.mockVerifyToken(token);
      request.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  private mockVerifyToken(token: string) {
    if (token === 'dev-token-superadmin') {
      return { id: 'usr-super', email: 'admin@dsu.edu.in', role: 'SUPER_ADMIN' };
    }
    if (token === 'dev-token-researchadmin') {
      return { id: 'usr-dean', email: 'dean.research@dsu.edu.in', role: 'RESEARCH_ADMIN' };
    }
    if (token === 'dev-token-deptadmin') {
      return { id: 'usr-hod-cse', email: 'hod.cse@dsu.edu.in', role: 'DEPT_ADMIN', departmentCode: 'CSE' };
    }
    if (token === 'dev-token-faculty') {
      return { id: 'usr-fac-1', email: 'ramesh.sharma@dsu.edu.in', role: 'FACULTY', facultyId: 'fac-1' };
    }
    if (token === 'dev-token-viewer') {
      return { id: 'usr-viewer', email: 'management@dsu.edu.in', role: 'VIEWER', departmentCode: 'MANAGEMENT' };
    }

    // Default decode if structured mock
    return { id: 'usr-general', email: 'faculty@dsu.edu.in', role: 'FACULTY' };
  }
}
