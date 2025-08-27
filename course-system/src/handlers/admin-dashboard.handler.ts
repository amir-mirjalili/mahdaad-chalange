import { BaseEventHandler } from "./base.handler";
import { IDashboardService } from "../core/services/interfaces";
import { DashboardService } from "../core/services";
import { CourseCreatedPayload, CourseUpdatedPayload } from "../types/events";
import { IEventBus } from "../core/events/interfaces";

export class AdminDashboardHandler extends BaseEventHandler {
  private dashboardService: IDashboardService;

  constructor(eventBus: IEventBus) {
    super(eventBus, 'AdminDashboardHandler');
    this.dashboardService = new DashboardService();
  }

  protected setupEventHandlers(): void {
    this.eventBus.on('course.created', this.handleCourseCreated.bind(this));
    this.eventBus.on('course.updated', this.handleCourseUpdated.bind(this));
  }

  private async handleCourseCreated(payload: CourseCreatedPayload): Promise<void> {
    const { course, metadata } = payload;

    this.logEventProcessing('course.created', course.title, metadata.correlationId);

    try {
      await this.dashboardService.updateCourseCount();

      const stats = await this.dashboardService.getStats();

      this.logger.info(`📊 Dashboard updated - Total courses: ${stats.totalCourses}`);
      this.logger.info(`📊 Latest course: "${course.title}" (${course.id})`);
    } catch (error) {
      this.logger.error(`Failed to update dashboard for course: "${course.title}"`, error);
      throw error;
    }
  }

  private async handleCourseUpdated(payload: CourseUpdatedPayload): Promise<void> {
    const { course, changes, metadata } = payload;

    this.logEventProcessing('course.updated', course.title, metadata.correlationId);

    try {

      this.logger.info(
        `📊 Dashboard updated for course modification: "${course.title}"`,
        { changes: Object.keys(changes) }
      );
    } catch (error) {
      this.logger.error(`Failed to update dashboard for course: "${course.title}"`, error);
      throw error;
    }
  }
}