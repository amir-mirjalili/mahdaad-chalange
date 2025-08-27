import { Course } from "../../../types/models";

export interface IDashboardService {
  updateCourseCount(): Promise<void>;
  getStats(): Promise<{ totalCourses: number; latestCourse?: Course }>;
}