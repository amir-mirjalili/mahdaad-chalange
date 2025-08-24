import { ExternalSMSAPI } from "../test/mock/sms.external-api";
import { CircuitBreakerConfig, RetryConfig } from "./types";
import { ExternalProvider } from "./services/sms/providers/external.provider";

async function start() {
  console.log("Starting SMS Service Demo");

  const externalAPI = new ExternalSMSAPI();

  const circuitConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeout: 5000,
    monitoringPeriod: 10000,
  };

  const retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  const smsService = new ExternalProvider(
    externalAPI,
    retryConfig,
    circuitConfig,
  );

  smsService.on("messageQueued", (data) => {
    console.log(
      `Message queued: ${data.messageId} (Queue size: ${data.queueSize}, Circuit: ${data.circuitState})`,
    );
  });

  smsService.on("messageDelivered", (data) => {
    console.log(
      `Message delivered: ${data.messageId} (Attempts: ${data.attempts})`,
    );
  });

  smsService.on("messageDeliveryFailed", (data) => {
    console.log(
      `Delivery failed: ${data.messageId} (Attempt ${data.attempt}/${data.maxRetries}) - ${data.error}`,
    );
  });

  smsService.on("messageRetryScheduled", (data) => {
    console.log(
      `Retry scheduled: ${data.messageId} (Attempt ${data.retryAttempt}, Delay: ${data.retryDelay}ms)`,
    );
  });

  smsService.on("messageFailed", (data) => {
    console.log(
      `Message permanently failed: ${data.messageId} - ${data.error}`,
    );
  });

  smsService.on("circuitBreakerStateChanged", (state) => {
    console.log(`Circuit breaker: ${state}`);
  });

  console.log("Setting high failure rate to demonstrate circuit breaker...\n");
  externalAPI.setFailureRate(0.8);

  const messages = [
    {
      phone: "+1234567890",
      text: "High priority alert!",
      priority: "high" as const,
    },
    {
      phone: "+1234567891",
      text: "Normal message",
      priority: "normal" as const,
    },
    {
      phone: "+1234567892",
      text: "Low priority update",
      priority: "low" as const,
    },
    {
      phone: "+1234567893",
      text: "Another normal message",
      priority: "normal" as const,
    },
    {
      phone: "+1234567894",
      text: "Emergency notification",
      priority: "high" as const,
    },
  ];

  for (const msg of messages) {
    try {
      const result = await smsService.sendSMS(
        msg.phone,
        msg.text,
        msg.priority,
      );
      console.log(`Submitted: ${result.messageId} - Status: ${result.status}`);
    } catch (error) {
      console.error("Failed to submit message:", error);
    }
  }

  setTimeout(() => {
    console.log("Improving API reliability...");
    externalAPI.setFailureRate(0.1);
    externalAPI.setResponseTime(500);
  }, 8000);

  const statusInterval = setInterval(() => {
    const status = smsService.getQueueStatus();
    const pendingCount = smsService.getPendingMessages().length;
    console.log(
      `Status - Queue: ${status.size}, Pending: ${pendingCount}, Circuit: ${status.circuitState}`,
    );
  }, 3000);

  setTimeout(() => {
    clearInterval(statusInterval);
    console.log("Demo completed");
  }, 30000);
}

start();
