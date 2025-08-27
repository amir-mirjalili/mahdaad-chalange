import { BaseEventHandler } from "./base.handler";
import { EmailNotificationHandler } from "./email-notification.handler";
import { AdminDashboardHandler } from "./admin-dashboard.handler";
import { SearchIndexHandler } from "./search-index.handler";
import { IEventBus } from "../core/events/interfaces";

export class HandlerRegistry {
  private static handlers: BaseEventHandler[] = [];

  static registerAllHandlers(eventBus: IEventBus): void {
    this.handlers = [];

    // Register all handlers
    this.handlers.push(new EmailNotificationHandler(eventBus));
    this.handlers.push(new AdminDashboardHandler(eventBus));
    this.handlers.push(new SearchIndexHandler(eventBus));

    console.log(`✅ Registered ${this.handlers.length} event handlers`);
  }

  static getHandlers(): BaseEventHandler[] {
    return this.handlers;
  }
}