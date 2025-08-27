import { ICourseService } from "./core/services/interfaces";
import { Logger } from "./utilities";
import { EventBus } from "./core/events/event-bus";
import { CourseService } from "./core/services";
import { Course, CourseStatus, CreateCourseRequest } from "./types/models";
import { HandlerRegistry, SearchIndexHandler } from "./handlers";
import { IEventBus } from "./core/events/interfaces";

export class Application {
  private readonly eventBus: IEventBus;
  private courseService: ICourseService;
  private logger = new Logger('Application');
  private searchHandler: SearchIndexHandler;


  constructor() {
    this.eventBus = new EventBus();
    this.courseService = new CourseService(this.eventBus);

    HandlerRegistry.registerAllHandlers(this.eventBus);
    const handlers = HandlerRegistry.getHandlers();
    this.searchHandler = handlers.find(h => h instanceof SearchIndexHandler) as SearchIndexHandler;

  }

  async demonstrateEventDrivenSystem(): Promise<void> {
    this.logger.info('Starting TypeScript Event-Driven Course Creation Demo');
    console.log('='.repeat(60));

    const courseRequests: CreateCourseRequest[] = [
      {
        title: 'Advanced TypeScript Patterns',
        description: 'Master advanced TypeScript design patterns and techniques',
        tags: ['typescript', 'patterns', 'advanced'],
        instructorId: 'inst-001',
        duration: 120,
        price: 299.99
      },
      {
        title: 'Event-Driven Architecture with TypeScript',
        description: 'Build scalable event-driven systems using TypeScript',
        tags: ['typescript', 'events', 'architecture'],
        instructorId: 'inst-002',
        duration: 180,
        price: 399.99
      },
      {
        title: 'Node.js Microservices in TypeScript',
        description: 'Create robust microservices using Node.js and TypeScript',
        tags: ['nodejs', 'microservices', 'typescript'],
        instructorId: 'inst-003',
        duration: 240,
        price: 449.99
      }
    ];

    this.logger.info('📚 Creating courses with full type safety...\n');

    const createdCourses: Course[] = [];

    for (const courseRequest of courseRequests) {
      const course = await this.courseService.createCourse(courseRequest);
      createdCourses.push(course);
      console.log('---');
    }

    await this.delay(600);

    this.logger.info('\n🔄 Demonstrating course updates...');
    if (createdCourses.length > 0) {
      const courseToUpdate = createdCourses[0];
      await this.courseService.updateCourse(courseToUpdate.id, {
        status: CourseStatus.ACTIVE,
        price: 249.99
      });
      console.log('---');
    }

    await this.delay(300);

    this.logger.info('\n🔍 Testing search functionality:');
    const searchResults = await this.searchHandler.search('typescript');
    this.logger.info(`Found ${searchResults.length} courses matching "typescript":`, searchResults);


    this.logger.info('\n📋 All Courses Created:');
    const allCourses = await this.courseService.getAllCourses();
    allCourses.forEach(course => {
      this.logger.info(`  • ${course.title} (${course.status}) - ${course.price || 'Free'}`);
    });

    console.log('\n' + '='.repeat(60));
    this.logger.info('TypeScript Event-Driven Demo completed successfully!');
    this.logger.info('All side effects were handled independently with full type safety.');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown(): Promise<void> {
    this.eventBus.removeAllListeners();
    this.logger.info('Application shut down gracefully');
  }
}
