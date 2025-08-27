import { IDashboardService } from "./interfaces";
import { Course } from "../../types/models";

export class DashboardService implements IDashboardService {
  private courseCount: number = 0;
  private latestCourse?: Course;

  async updateCourseCount(): Promise<void> {
    await this.delay(50);
    this.courseCount++;
  }

  async getStats(): Promise<{ totalCourses: number; latestCourse?: Course }> {
    return {
      totalCourses: this.courseCount,
      latestCourse: this.latestCourse
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}