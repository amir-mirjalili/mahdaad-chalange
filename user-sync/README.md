# User Sync Service

Eventual consistency system for syncing user profile updates across multiple services with automatic retries.

## Quick Start

```bash
npm install
npm run dev
```

## Usage

```typescript
// Register services
syncManager.registerService(billingService);
syncManager.registerService(crmService);

// Sync profile update
await syncManager.syncProfileUpdate({
  userId: 'user-123',
  changes: { email: 'new@email.com' },
  timestamp: Date.now()
});
```

## Features

- ✅ Automatic retries with exponential backoff
- ✅ Dead letter queue for failed tasks