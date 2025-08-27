import { CourseCreatedPayload } from '../../types/events';
import { Course,CourseStatus } from "../../types/models";
import { ICourseService } from "./interfaces";
import { CreateCourseRequest } from "../../types/models";
import { generateId, Logger } from "../../utilities";
import { IEventBus } from "../events/interfaces";

export class CourseService implements ICourseService {
  private courses: Map<string, Course> = new Map();
  private logger = new Logger('CourseService');

  constructor(private eventBus: IEventBus) {}

  async createCourse(request: CreateCourseRequest): Promise<Course> {
    try {
      const course: Course = {
        id: generateId(),
        ...request,
        tags: request.tags || [],
        status: CourseStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.courses.set(course.id, course);

      const eventPayload: CourseCreatedPayload = {
        course,
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'CourseService',
          version: '1.0',
          correlationId: generateId()
        }
      };

      await this.eventBus.emit('course.created', eventPayload);

      this.logger.info(`Course created: ${course.title} (${course.id})`);
      return course;

    } catch (error) {
      this.logger.error('Failed to create course:', error);
      throw error;
    }
  }

  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const course = this.courses.get(id);
    if (!course) {
      throw new Error(`Course not found: ${id}`);
    }

    const updatedCourse: Course = {
      ...course,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.courses.set(id, updatedCourse);

    await this.eventBus.emit('course.updated', {
      course: updatedCourse,
      changes: updates,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'CourseService',
        version: '1.0',
        correlationId: generateId(),
      }
    });

    return updatedCourse;
  }
}