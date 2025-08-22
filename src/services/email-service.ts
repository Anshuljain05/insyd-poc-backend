import nodemailer from 'nodemailer';
import { Notification } from '../types';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.warn('Email service not properly configured:', error);
      return false;
    }
  }

  async sendNotificationEmail(
    notification: Notification,
    recipientEmail: string
  ) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: notification.title,
      text: notification.body,
      html: this.generateEmailHtml(notification),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private generateEmailHtml(notification: Notification): string {
    // Simple HTML template - in a real system, use a proper template engine
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notification.title}</h2>
        <p>${notification.body}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          This is a notification from Insyd. 
          You can manage your notification preferences in your account settings.
        </p>
      </div>
    `;
  }
}
