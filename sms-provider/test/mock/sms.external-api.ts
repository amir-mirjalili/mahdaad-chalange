import { SMSResponse } from "../../src/types";

export class ExternalSMSAPI {
  private failureRate = 0.3;
  private responseTime = 1000;

  async sendSMS(phoneNumber: string, message: string): Promise<SMSResponse> {
    await new Promise((resolve) => setTimeout(resolve, this.responseTime));

    if (Math.random() < this.failureRate) {
      throw new Error("SMS API temporarily unavailable");
    }

    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  setResponseTime(time: number): void {
    this.responseTime = Math.max(100, time);
  }
}
