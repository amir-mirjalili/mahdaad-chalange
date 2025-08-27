import { BaseEventHandler } from "./base.handler";
import {  ISearchService } from "../core/services/interfaces";
import { SearchService } from "../core/services";
import { CourseCreatedPayload, CourseUpdatedPayload, EventMap } from "../types/events";
import { IEventBus } from "../core/events/interfaces";

export class SearchIndexHandler extends BaseEventHandler {
  private searchService: ISearchService;

  constructor(eventBus: IEventBus) {
    super(eventBus, 'SearchIndexHandler');
    this.searchService = new SearchService();
  }

  protected setupEventHandlers(): void {
    this.eventBus.on('course.created', this.handleCourseCreated.bind(this));
    this.eventBus.on('course.updated', this.handleCourseUpdated.bind(this));
    this.eventBus.on('course.deleted', this.handleCourseDeleted.bind(this));
  }

  private async handleCourseCreated(payload: CourseCreatedPayload): Promise<void> {
    const { course, metadata } = payload;

    this.logEventProcessing('course.created', course.title, metadata.correlationId);

    try {

      this.logger.info(
        `🔍 Search index now contains ${(this.searchService as SearchService).getIndexSize()} courses`
      );
    } catch (error) {
      this.logger.error(`Failed to index course: "${course.title}"`, error);
      throw error;
    }
  }

  private async handleCourseUpdated(payload: CourseUpdatedPayload): Promise<void> {
    const { course, metadata } = payload;

    this.logEventProcessing('course.updated', course.title, metadata.correlationId);

    try {

      this.logger.info(`🔍 Course "${course.title}" re-indexed after update`);
    } catch (error) {
      this.logger.error(`Failed to re-index course: "${course.title}"`, error);
      throw error;
    }
  }

  private async handleCourseDeleted(payload: EventMap['course.deleted']): Promise<void> {
    const { courseId, metadata } = payload;

    this.logEventProcessing('course.deleted', courseId, metadata.correlationId);

    try {
      await this.searchService.removeCourse(courseId);

      this.logger.info(`🔍 Course ${courseId} removed from search index`);
    } catch (error) {
      this.logger.error(`Failed to remove course from search index: ${courseId}`, error);
      throw error;
    }
  }

  async search(query: string): Promise<string[]> {
    return this.searchService.search(query);
  }
}
