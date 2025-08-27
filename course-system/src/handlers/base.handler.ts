import { Logger } from "../utilities";
import { IEventBus } from "../core/events/interfaces";

export abstract class BaseEventHandler {
  protected logger: Logger;

  constructor(
    protected eventBus: IEventBus,
    handlerName: string
  ) {
    this.logger = new Logger(handlerName);
    this.setupEventHandlers();
  }

  protected abstract setupEventHandlers(): void;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected logEventProcessing(eventType: string, entityName: string, correlationId?: string): void {
    this.logger.info(
      `Processing ${eventType} event for: "${entityName}"`,
      correlationId ? { correlationId } : undefined
    );
  }
}