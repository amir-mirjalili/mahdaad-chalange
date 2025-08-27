import { IEmailService } from "./interfaces/email.service";
import { Logger } from "../../utilities";
import { Course, User } from "../../types/models";

export class EmailService implements IEmailService {
  private logger = new Logger('EmailService');

  async sendCourseCreatedNotification(course: Course): Promise<void> {
    this.logger.info(`📧 Sending notification emails for course: "${course.title}"`);

    await this.delay(100);

    const recipients = ['admin@example.com', 'students@example.com'];

    for (const recipient of recipients) {
      this.logger.info(`  ✉️  Email sent to ${recipient} about "${course.title}"`);
    }

    this.logger.info(`📧 All notification emails sent for course: "${course.title}"`);
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    this.logger.info(`📧 Sending welcome email to: ${user.email}`);
    await this.delay(75);
    this.logger.info(`📧 Welcome email sent to: ${user.email}`);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}