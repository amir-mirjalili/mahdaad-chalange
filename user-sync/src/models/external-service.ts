import { UserProfileUpdate } from "./user-profile";

export interface ExternalService {
  id: string;
  name: string;
  endpoint: string;
  updateProfile(update: UserProfileUpdate): Promise<void>;
}
