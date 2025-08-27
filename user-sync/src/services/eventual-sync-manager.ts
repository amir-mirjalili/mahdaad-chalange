import { SyncTask, UserProfileUpdate } from "../models";
import { ExternalService } from "../models";

export class EventualSyncManager {
  private retryQueue: Map<string,
    SyncTask> = new Map();
  private services: Map<string, ExternalService> = new Map();
  private isProcessing = false;
  private readonly maxAttempts = 5;
  private readonly baseDelayMs = 1000;
  private readonly maxDelayMs = 300000;

  constructor() {
    setInterval(() => this.processQueue(), 5000);
  }

  registerService(service: ExternalService): void {
    this.services.set(service.id, service);
  }

  async syncProfileUpdate(update: UserProfileUpdate): Promise<void> {
    console.log(`Starting sync for user ${update.userId}`);

    for (const [serviceId, service] of this.services) {
      const taskId = `${update.userId}-${serviceId}-${Date.now()}`;

      const task: SyncTask = {
        id: taskId,
        serviceId,
        update,
        attempts: 0,
        maxAttempts: this.maxAttempts,
        nextRetryAt: Date.now(),
        createdAt: Date.now()
      };

      this.retryQueue.set(taskId, task);
      console.log(`Queued sync task ${taskId} for service ${service.name}`);
    }

    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.retryQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    const now = Date.now();
    const tasksToProcess = Array.from(this.retryQueue.values())
      .filter(task => task.nextRetryAt <= now)
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const task of tasksToProcess) {
      await this.processTask(task);
    }

    this.isProcessing = false;
  }

  private async processTask(task: SyncTask): Promise<void> {
    const service = this.services.get(task.serviceId);
    if (!service) {
      console.error(`Service ${task.serviceId} not found, removing task`);
      this.retryQueue.delete(task.id);
      return;
    }

    task.attempts++;
    console.log(`Processing task ${task.id} (attempt ${task.attempts}/${task.maxAttempts})`);

    try {
      await service.updateProfile(task.update);
      console.log(`✅ Successfully synced to ${service.name}`);
      this.retryQueue.delete(task.id);

    } catch (error) {
      console.error(`❌ Failed to sync to ${service.name}:`, error);

      if (task.attempts >= task.maxAttempts) {
        console.error(`Max attempts reached for task ${task.id}, moving to dead letter queue`);
        await this.moveToDeadLetterQueue(task);
        this.retryQueue.delete(task.id);
      } else {
        const delay = Math.min(
          this.baseDelayMs * Math.pow(2, task.attempts - 1),
          this.maxDelayMs
        );
        const jitter = Math.random() * 1000;

        task.nextRetryAt = Date.now() + delay + jitter;
        console.log(`Scheduling retry in ${Math.round((delay + jitter) / 1000)}s`);
      }
    }
  }

  private async moveToDeadLetterQueue(task: SyncTask): Promise<void> {
    console.error(`DEAD LETTER: Task ${task.id} failed permanently`, {
      serviceId: task.serviceId,
      userId: task.update.userId,
      attempts: task.attempts,
      age: Date.now() - task.createdAt
    });

  }

  getQueueStatus(): { pending: number; oldestTask?: Date } {
    const tasks = Array.from(this.retryQueue.values());
    const oldestTask = tasks.length > 0
      ? new Date(Math.min(...tasks.map(t => t.createdAt)))
      : undefined;

    return { pending: tasks.length, oldestTask };
  }

  async retryFailedTasks(userId?: string): Promise<void> {
    const tasks = Array.from(this.retryQueue.values());
    const filteredTasks = userId
      ? tasks.filter(t => t.update.userId === userId)
      : tasks;

    for (const task of filteredTasks) {
      task.nextRetryAt = Date.now();
      task.attempts = 0;
    }

    console.log(`Reset ${filteredTasks.length} tasks for manual retry`);
    await this.processQueue();
  }
}