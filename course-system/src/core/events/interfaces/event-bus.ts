import { EventType, EventPayload } from '../../../types/events';

export type EventHandler<T extends EventType> = (
  payload: EventPayload<T>
) => Promise<void> | void;

export interface IEventBus {
  on<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void;

  off<T extends EventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void;

  emit<T extends EventType>(
    eventType: T,
    payload: EventPayload<T>
  ): Promise<void>;

  removeAllListeners(): void;
}