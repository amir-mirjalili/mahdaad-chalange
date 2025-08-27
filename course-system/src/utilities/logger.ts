export class Logger {
  constructor(private context: string) {}

  info(message: string, meta?: any): void {
    console.log(`[${this.context}] ℹ️  ${message}`, meta || '');
  }

  error(message: string, error?: any): void {
    console.error(`[${this.context}] ❌ ${message}`, error || '');
  }

  debug(message: string, meta?: any): void {
    console.log(`[${this.context}] 🐛 ${message}`, meta || '');
  }
}