import { ExternalService, UserProfileUpdate } from "../../models";

export class MockExternalService implements ExternalService {
  constructor(
    public id: string,
    public name: string,
    public endpoint: string,
    private failureRate = 0.3
  ) {}

  async updateProfile(update: UserProfileUpdate): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    if (Math.random() < this.failureRate) {
      throw new Error(`Network timeout to ${this.name}`);
    }

    console.log(`${this.name} updated profile for user ${update.userId}`);
  }
}