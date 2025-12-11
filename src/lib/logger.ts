export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string
  operation?: string
  component?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
}

class Logger {
  private isEnabled: boolean
  private logLevel: LogLevel

  constructor() {
    // Check if debug mode is enabled via environment variable
    this.isEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true' || process.env.DEBUG === 'true'
    
    // Set minimum log level (default to INFO in production, DEBUG in development)
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL
    this.logLevel = this.isEnabled ? LogLevel.DEBUG : LogLevel.INFO
    
    if (envLevel) {
      switch (envLevel.toUpperCase()) {
        case 'DEBUG':
          this.logLevel = LogLevel.DEBUG
          break
        case 'INFO':
          this.logLevel = LogLevel.INFO
          break
        case 'WARN':
          this.logLevel = LogLevel.WARN
          break
        case 'ERROR':
          this.logLevel = LogLevel.ERROR
          break
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.isEnabled && level >= this.logLevel
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = LogLevel[entry.level].padEnd(5)
    const contextStr = entry.context ? this.formatContext(entry.context) : ''
    const message = entry.message
    const errorStr = entry.error ? `\nError: ${entry.error.message}\nStack: ${entry.error.stack}` : ''
    
    return `[${timestamp}] ${level} ${contextStr}${message}${errorStr}`
  }

  private formatContext(context: LogContext): string {
    const parts: string[] = []
    
    if (context.userId) {
      parts.push(`User:${context.userId}`)
    }
    
    if (context.operation) {
      parts.push(`Op:${context.operation}`)
    }
    
    if (context.component) {
      parts.push(`Comp:${context.component}`)
    }
    
    // Add other context key-value pairs
    Object.entries(context).forEach(([key, value]) => {
      if (!['userId', 'operation', 'component'].includes(key)) {
        // Skip sensitive data
        if (this.isSensitiveField(key)) {
          parts.push(`${key}:[REDACTED]`)
        } else {
          parts.push(`${key}:${JSON.stringify(value)}`)
        }
      }
    })
    
    return parts.length > 0 ? `[${parts.join(' ')}] ` : ''
  }

  private isSensitiveField(key: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'key',
      'secret',
      'auth',
      'authorization',
      'cookie',
      'session',
      'credential',
    ]
    
    return sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const formattedMessage = this.formatMessage(entry)
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage)
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.log(entry)
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.log(entry)
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.log(entry)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.log(entry)
  }

  // Convenience methods for common operations
  operationStart(operation: string, context?: LogContext): void {
    this.info(`Starting operation: ${operation}`, { ...context, operation })
  }

  operationSuccess(operation: string, context?: LogContext): void {
    this.info(`Operation completed successfully: ${operation}`, { ...context, operation })
  }

  operationFailure(operation: string, error?: Error, context?: LogContext): void {
    this.error(`Operation failed: ${operation}`, error, { ...context, operation })
  }

  // Component lifecycle logging
  componentMount(component: string, context?: LogContext): void {
    this.debug(`Component mounted: ${component}`, { ...context, component })
  }

  componentUnmount(component: string, context?: LogContext): void {
    this.debug(`Component unmounted: ${component}`, { ...context, component })
  }

  // API request logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${url}`, { ...context, method, url })
  }

  apiResponse(method: string, url: string, status: number, context?: LogContext): void {
    this.info(`API Response: ${method} ${url} - ${status}`, { ...context, method, url, status })
  }

  // Database operation logging
  dbQuery(operation: string, table?: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation}${table ? ` on ${table}` : ''}`, { ...context, operation, table })
  }

  dbSuccess(operation: string, table?: string, recordCount?: number, context?: LogContext): void {
    this.debug(`DB Success: ${operation}${table ? ` on ${table}` : ''}${recordCount ? ` (${recordCount} records)` : ''}`, { ...context, operation, table, recordCount })
  }

  dbError(operation: string, error?: Error, table?: string, context?: LogContext): void {
    this.error(`DB Error: ${operation}${table ? ` on ${table}` : ''}`, error, { ...context, operation, table })
  }

  // File operation logging
  fileOperation(operation: string, fileName?: string, context?: LogContext): void {
    this.info(`File Operation: ${operation}${fileName ? ` - ${fileName}` : ''}`, { ...context, operation, fileName })
  }

  fileSuccess(operation: string, fileName?: string, context?: LogContext): void {
    this.info(`File Operation Success: ${operation}${fileName ? ` - ${fileName}` : ''}`, { ...context, operation, fileName })
  }

  fileError(operation: string, error?: Error, fileName?: string, context?: LogContext): void {
    this.error(`File Operation Error: ${operation}${fileName ? ` - ${fileName}` : ''}`, error, { ...context, operation, fileName })
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, { ...context, operation, duration })
  }

  // Create a child logger with preset context
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    const originalLog = childLogger.log.bind(childLogger)
    
    childLogger.log = (entry: LogEntry) => {
      entry.context = { ...context, ...entry.context }
      originalLog(entry)
    }
    
    return childLogger
  }
}

// Create and export the default logger instance
export const logger = new Logger()

// Export a function to create child loggers
export const createLogger = (context: LogContext): Logger => {
  return logger.child(context)
}

// Export convenience functions for common use cases
export const logAuth = (message: string, context?: LogContext) => {
  logger.info(`[AUTH] ${message}`, { ...context, component: 'auth' })
}

export const logCamera = (message: string, context?: LogContext) => {
  logger.info(`[CAMERA] ${message}`, { ...context, component: 'camera' })
}

export const logUpload = (message: string, context?: LogContext) => {
  logger.info(`[UPLOAD] ${message}`, { ...context, component: 'upload' })
}

export const logOCR = (message: string, context?: LogContext) => {
  logger.info(`[OCR] ${message}`, { ...context, component: 'ocr' })
}

export const logSupabase = (message: string, context?: LogContext) => {
  logger.info(`[SUPABASE] ${message}`, { ...context, component: 'supabase' })
}