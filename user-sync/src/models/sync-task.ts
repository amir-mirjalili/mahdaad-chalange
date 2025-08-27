import { UserProfileUpdate } from "./user-profile";

export interface SyncTask {
  id: string;
  serviceId: string;
  update: UserProfileUpdate;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  createdAt: number;
}