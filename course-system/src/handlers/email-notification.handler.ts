import { BaseEventHandler } from "./base.handler";
import { IEmailService } from "../core/services/interfaces/email.service";
import { EmailService } from "../core/services";
import { CourseCreatedPayload, UserRegisteredPayload } from "../types/events";
import { IEventBus } from "../core/events/interfaces";

export class EmailNotificationHandler extends BaseEventHandler {
private emailService: IEmailService;

  constructor(eventBus: IEventBus) {
    super(eventBus, 'EmailNotificationHandler');
    this.emailService = new EmailService();
  }

protected setupEventHandlers(): void {
    this.eventBus.on('course.created', this.handleCourseCreated.bind(this));
    this.eventBus.on('user.registered', this.handleUserRegistered.bind(this));
  }

private async handleCourseCreated(payload: CourseCreatedPayload): Promise<void> {
    const { course, metadata } = payload;

    this.logEventProcessing('course.created', course.title, metadata.correlationId);

    try {
      await this.emailService.sendCourseCreatedNotification(course);

      this.logger.info(
        `Email notifications completed for course: "${course.title}"`,
        { correlationId: metadata.correlationId }
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email notifications for course: "${course.title}"`,
        error
      );
      throw error;
    }
  }

private async handleUserRegistered(payload: UserRegisteredPayload): Promise<void> {
    const { user, metadata } = payload;

    this.logEventProcessing('user.registered', user.email, metadata.correlationId);

    try {
      await this.emailService.sendWelcomeEmail(user);

      this.logger.info(
        `Welcome email sent to: ${user.email}`,
        { correlationId: metadata.correlationId }
      );
    } catch (error) {
      this.logger.error(`Failed to send welcome email to: ${user.email}`, error);
      throw error;
    }
  }
}
