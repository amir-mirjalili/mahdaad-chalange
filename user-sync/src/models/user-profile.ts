export interface UserProfileUpdate {
  userId: string;
  changes: Record<string, any>;
  timestamp: number;
}