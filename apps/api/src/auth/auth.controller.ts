import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UserRole } from '@dsu/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

export class LoginDto {
  email: string;
  password?: string;
}

@Controller('api/auth')
export class AuthController {
  // Mock user registry adhering to Stage 1 User Roles
  private users = [
    {
      id: 'usr-super',
      email: 'admin@dsu.edu.in',
      fullName: 'Super Administrator',
      role: UserRole.SUPER_ADMIN,
      departmentCode: 'ADMIN',
      token: 'dev-token-superadmin',
    },
    {
      id: 'usr-dean',
      email: 'dean.research@dsu.edu.in',
      fullName: 'Dr. Suresh Kumar (Dean Research)',
      role: UserRole.RESEARCH_ADMIN,
      departmentCode: 'RESEARCH',
      token: 'dev-token-researchadmin',
    },
    {
      id: 'usr-hod-cse',
      email: 'hod.cse@dsu.edu.in',
      fullName: 'Dr. P. Venkat (HOD - CSE)',
      role: UserRole.DEPT_ADMIN,
      departmentCode: 'CSE',
      token: 'dev-token-deptadmin',
    },
    {
      id: 'usr-fac-1',
      email: 'ramesh.sharma@dsu.edu.in',
      fullName: 'Dr. Ramesh Sharma',
      role: UserRole.FACULTY,
      departmentCode: 'CSE',
      facultyId: 'fac-1',
      token: 'dev-token-faculty',
    },
    {
      id: 'usr-viewer',
      email: 'management@dsu.edu.in',
      fullName: 'DSU Executive Management',
      role: UserRole.VIEWER,
      departmentCode: 'MANAGEMENT',
      token: 'dev-token-viewer',
    },
  ];

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    const user = this.users.find(u => u.email.toLowerCase() === loginDto.email.toLowerCase());

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials or user not registered in DSU Directory',
      };
    }

    return {
      success: true,
      message: 'Authentication successful',
      accessToken: user.token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        departmentCode: user.departmentCode,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: any) {
    return {
      success: true,
      user: req.user,
    };
  }

  @Get('admin-only-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.RESEARCH_ADMIN)
  testAdminPrivilege(@Request() req: any) {
    return {
      success: true,
      message: `Privileged access granted to ${req.user.email} with role ${req.user.role}`,
    };
  }
}
