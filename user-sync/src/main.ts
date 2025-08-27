import { EventualSyncManager } from "./services/eventual-sync-manager";
import { MockExternalService } from "./services/mock/external-service.mock";
import { UserProfileUpdate } from "./models";

async function run() {
  const syncManager = new EventualSyncManager();

  syncManager.registerService(new MockExternalService('billing', 'Billing Service', '/billing/api', 0.4));
  syncManager.registerService(new MockExternalService('crm', 'CRM Service', '/crm/api', 0.2));
  syncManager.registerService(new MockExternalService('analytics', 'Analytics Service', '/analytics/api', 0.6));

  const profileUpdate: UserProfileUpdate = {
    userId: 'user-123',
    changes: {
      email: 'newemail@example.com',
      name: 'John Doe',
      preferences: { theme: 'dark' }
    },
    timestamp: Date.now()
  };

  await syncManager.syncProfileUpdate(profileUpdate);

  setInterval(() => {
    const status = syncManager.getQueueStatus();
    if (status.pending > 0) {
      console.log(`Queue status: ${status.pending} pending tasks, oldest: ${status.oldestTask}`);
    }
  }, 10000);
}

run().catch(console.error);
