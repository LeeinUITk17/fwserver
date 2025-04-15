import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body()
    body: { name: string; email: string; password: string; phone?: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signup(body);
    this.setAuthCookies(res, tokens);
    return res.send({ message: 'Signup successful' });
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.login(body);
    this.setAuthCookies(res, tokens);
    return res.send({ message: 'Login successful' });
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req) {
    return req.user;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).send({ message: 'No refresh token' });

    const tokens = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(res, tokens);
    return res.send({ message: 'Token refreshed' });
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Use passthrough
    // Clear cookies on client with matching options
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Match the setting during creation (false for HTTP dev)
      sameSite: 'lax' as const, // Explicitly type 'lax' or 'strict' or 'none'
      path: '/', // <<< MATCHING PATH
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    return { message: 'Logged out successfully' };
  }

  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction; // Use false for HTTP dev

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax', // 'lax' is generally good for dev
      path: '/', // <<< ADD THIS LINE
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: secureFlag,
      sameSite: 'lax',
      path: '/', // <<< ADD THIS LINE
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
