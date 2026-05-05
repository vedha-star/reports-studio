import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  ConflictException,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { name: string; email: string; password: string },
  ) {
    console.log('DEBUG: Registration Request Body:', body);
    try {
      return await this.authService.register(
        body.name,
        body.email,
        body.password,
      );
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('DEBUG: Registration Error:', error.message);
      if (error instanceof ConflictException) throw error;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new BadRequestException(error.message);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh')
  refresh(@Request() req: { user: { userId: string } }) {
    return this.authService.refresh(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  updateProfile(@Request() req: any, @Body() body: any) {
    return this.authService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body() body: any) {
    return this.authService.changePassword(
      req.user.userId,
      body.oldPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('delete-account')
  deleteAccount(@Request() req: any) {
    return this.authService.deleteAccount(req.user.userId);
  }
}
