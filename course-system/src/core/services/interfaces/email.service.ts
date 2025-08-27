import { Course, User } from "../../../types/models";

export interface IEmailService {
  sendCourseCreatedNotification(course: Course): Promise<void>;
  sendWelcomeEmail(user: User): Promise<void>;
}