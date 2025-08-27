import { ISearchService, SearchEntry } from "./interfaces";
import { Logger } from "../../utilities";

export class SearchService implements ISearchService {
  private searchIndex: Map<string, SearchEntry> = new Map();
  private logger = new Logger('SearchService');

  async search(query: string): Promise<string[]> {
    const results: string[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [id, entry] of this.searchIndex) {
      if (entry.title.includes(lowerQuery) ||
        entry.description.includes(lowerQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        results.push(id);
      }
    }

    return results;
  }

  async removeCourse(courseId: string): Promise<void> {
    this.searchIndex.delete(courseId);
    this.logger.info(`🔍 Course ${courseId} removed from search index`);
  }

  getIndexSize(): number {
    return this.searchIndex.size;
  }

}