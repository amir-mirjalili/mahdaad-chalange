import EventEmitter from "events";
import { CircuitBreaker } from "../../../circuit-breaker/circuit-breaker";
import { PriorityQueue } from "../priority-queue.sms";
import { CircuitBreakerConfig, RetryConfig, SMSMessage } from "../../../types";
import { ExternalSMSAPI } from "../../../../test/mock/sms.external-api";
import { CircuitState } from "../../../circuit-breaker/circuit-breaker-states";

export class ExternalProvider extends EventEmitter {
  private circuitBreaker: CircuitBreaker;
  private messageQueue: PriorityQueue<SMSMessage>;
  private processingQueue = false;
  private messageStore = new Map<string, SMSMessage>();

  constructor(
    private externalAPI: ExternalSMSAPI,
    private retryConfig: RetryConfig,
    circuitConfig: CircuitBreakerConfig,
  ) {
    super();
    this.circuitBreaker = new CircuitBreaker(circuitConfig);
    this.messageQueue = new PriorityQueue<SMSMessage>();

    this.circuitBreaker.on("stateChanged", (state) => {
      this.emit("circuitBreakerStateChanged", state);
      console.log(`Circuit breaker state changed to: ${state}`);

      if (state === CircuitState.CLOSED || state === CircuitState.HALF_OPEN) {
        this.processQueue();
      }
    });

    this.processQueue();
  }

  async sendSMS(
    phoneNumber: string,
    message: string,
    priority: "high" | "normal" | "low" = "normal",
  ): Promise<{ messageId: string; status: string }> {
    const smsMessage: SMSMessage = {
      id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      phoneNumber,
      message,
      priority,
      maxRetries: this.retryConfig.maxRetries,
      currentRetries: 0,
      createdAt: new Date(),
    };

    this.messageStore.set(smsMessage.id, smsMessage);

    const priorityValue = { high: 3, normal: 2, low: 1 }[priority];
    this.messageQueue.enqueue(smsMessage, priorityValue);

    this.emit("messageQueued", {
      messageId: smsMessage.id,
      queueSize: this.messageQueue.size(),
      circuitState: this.circuitBreaker.getState(),
    });

    if (!this.processingQueue) {
      await this.processQueue();
    }

    return {
      messageId: smsMessage.id,
      status:
        this.circuitBreaker.getState() === CircuitState.OPEN
          ? "queued_service_unavailable"
          : "queued_for_processing",
    };
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.messageQueue.isEmpty()) {
      return;
    }

    this.processingQueue = true;

    while (!this.messageQueue.isEmpty()) {
      const message = this.messageQueue.dequeue();
      if (!message) break;

      try {
        await this.processSingleMessage(message);
      } catch (error) {
        console.error(`Failed to process message ${message.id}:`, error);

        if (message.currentRetries < message.maxRetries) {
          await this.scheduleRetry(message);
        } else {
          this.emit("messageFailed", {
            messageId: message.id,
            error: "Max retries exceeded",
            finalAttempt: true,
          });
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processingQueue = false;
  }

  private async processSingleMessage(message: SMSMessage): Promise<void> {
    try {
      const response = await this.circuitBreaker.execute(async () => {
        return await this.externalAPI.sendSMS(
          message.phoneNumber,
          message.message,
        );
      });

      if (response.success) {
        this.emit("messageDelivered", {
          messageId: message.id,
          externalMessageId: response.messageId,
          attempts: message.currentRetries + 1,
        });
        this.messageStore.delete(message.id);
      } else {
        throw new Error(response.error || "Unknown SMS API error");
      }
    } catch (error) {
      message.currentRetries++;
      this.emit("messageDeliveryFailed", {
        messageId: message.id,
        error: error instanceof Error ? error.message : "Unknown error",
        attempt: message.currentRetries,
        maxRetries: message.maxRetries,
      });
      throw error;
    }
  }

  private async scheduleRetry(message: SMSMessage): Promise<void> {
    const delay = this.calculateRetryDelay(message.currentRetries);
    message.scheduledAt = new Date(Date.now() + delay);

    this.emit("messageRetryScheduled", {
      messageId: message.id,
      retryAttempt: message.currentRetries,
      retryDelay: delay,
      scheduledAt: message.scheduledAt,
    });

    setTimeout(() => {
      const priorityValue = { high: 3, normal: 2, low: 1 }[message.priority];
      this.messageQueue.enqueue(message, priorityValue);
      if (!this.processingQueue) {
        this.processQueue();
      }
    }, delay);
  }

  private calculateRetryDelay(retryCount: number): number {
    const delay =
      this.retryConfig.baseDelay *
      Math.pow(this.retryConfig.backoffMultiplier, retryCount);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  getQueueStatus(): { size: number; circuitState: CircuitState } {
    return {
      size: this.messageQueue.size(),
      circuitState: this.circuitBreaker.getState(),
    };
  }

  getPendingMessages(): SMSMessage[] {
    return Array.from(this.messageStore.values());
  }
}
