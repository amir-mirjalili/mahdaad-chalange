import { CourseStatus } from "./enums";


export interface Course {
  readonly id: string;
  title: string;
  description: string;
  tags: string[];
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
  instructorId: string;
  duration?: number;
  price?: number;
}
