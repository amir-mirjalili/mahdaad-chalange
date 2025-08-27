import { Course,CreateCourseRequest } from "../../../types/models";

export interface ICourseService {
  createCourse(request: CreateCourseRequest): Promise<Course>;
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course>;
}