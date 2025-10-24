
export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.logs); // Send current logs immediately

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random()}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    this.logs.push(entry);
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
    this.notify();
  }

  info(message: string, details?: any) {
    this.log('info', message, details);
  }

  success(message: string, details?: any) {
    this.log('success', message, details);
  }

  warning(message: string, details?: any) {
    this.log('warning', message, details);
  }

  error(message: string, details?: any) {
    this.log('error', message, details);
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
