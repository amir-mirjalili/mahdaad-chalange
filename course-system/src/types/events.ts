import { Course,User } from "./models";

export interface BaseEventPayload {
  timestamp: string;
  metadata: {
    source: string;
    version: string;
    correlationId?: string;
  };
}

export interface CourseCreatedPayload extends BaseEventPayload {
  course: Course;
}

export interface CourseUpdatedPayload extends BaseEventPayload {
  course: Course;
  changes: Partial<Course>;
}

export interface UserRegisteredPayload extends BaseEventPayload {
  user: User;
}

export interface EventMap {
  'course.created': CourseCreatedPayload;
  'course.updated': CourseUpdatedPayload;
  'course.deleted': { courseId: string } & BaseEventPayload;
  'user.registered': UserRegisteredPayload;
}

export type EventType = keyof EventMap;
export type EventPayload<T extends EventType> = EventMap[T];