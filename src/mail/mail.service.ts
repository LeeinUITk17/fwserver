import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendAlertEmail(
    to: string,
    subject: string,
    message: string,
    imageUrl?: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject,
      template: 'alert',
      context: {
        message,
        imageUrl,
      },
    });
  }
}
