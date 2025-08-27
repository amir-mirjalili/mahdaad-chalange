export interface CreateCourseRequest {
  title: string;
  description: string;
  tags?: string[];
  instructorId: string;
  duration?: number;
  price?: number;
}