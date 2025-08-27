import { Application } from "./app";

const main = async () => {
  const app = new Application();

  try {
    await app.demonstrateEventDrivenSystem();
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await app.shutdown();
  }
};

main().catch(console.error);