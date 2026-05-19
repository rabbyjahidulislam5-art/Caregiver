import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

let transporter: nodemailer.Transporter;

async function setupMailer() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test account automatically for dev if not using real SMTP
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[NotificationService] Using Ethereal Email test account: ${testAccount.user}`);
  }
}
setupMailer().catch(console.error);

export class NotificationService {
  /**
   * Send an in-app notification and an email notification.
   */
  static async send(userId: string, title: string, message: string) {
    try {
      // 1. Create In-App Notification
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
        }
      });

      // 2. Fetch User to get email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.email) return;

      // 3. Send Email
      if (transporter) {
        const info = await transporter.sendMail({
          from: '"CaregiverGO" <noreply@caregivergo.com>',
          to: user.email,
          subject: title,
          text: message,
          html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                  <h2 style="color: #3b82f6;">CaregiverGO</h2>
                  <h3>${title}</h3>
                  <p>${message}</p>
                  <hr/>
                  <p style="font-size: 12px; color: #888;">This is an automated notification. Please do not reply.</p>
                 </div>`,
        });

        if (info.messageId && !process.env.SMTP_USER) {
          console.log(`[Notification Email Sent] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error);
    }
  }
}
