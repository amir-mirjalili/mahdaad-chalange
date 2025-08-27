import { CourseStatus } from "../../../types/models";

export interface ISearchService {
  search(query: string): Promise<string[]>;
  removeCourse(courseId: string): Promise<void>;
}

export interface SearchEntry {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: CourseStatus;
  indexedAt: string;
}