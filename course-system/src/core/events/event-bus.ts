import { EventType, EventPayload } from '../../types/events';
import { Logger } from "../../utilities";
import { EventHandler, IEventBus } from "./interfaces";

export class EventBus implements IEventBus {
  private listeners: Map<EventType, Set<EventHandler<any>>> = new Map();
  private logger = new Logger('EventBus');


  on<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler);
    this.logger.debug(`Handler registered for event: ${eventType}`);
  }

  off<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      this.logger.debug(`Handler removed for event: ${eventType}`);
    }
  }

  async emit<T extends EventType>(
    eventType: T,
    payload: EventPayload<T>
  ): Promise<void> {
    const handlers = this.listeners.get(eventType);

    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers for event: ${eventType}`);
      return;
    }

    this.logger.info(`Emitting event: ${eventType} to ${handlers.size} handlers`);

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error(
          `Error in event handler for ${eventType}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    });

    Promise.allSettled(promises).catch((error) => {
      this.logger.error('Unexpected error in event emission:', error);
    });
  }

  removeAllListeners(): void {
    this.listeners.clear();
    this.logger.info('All event listeners removed');
  }
}