/**
 * カスタムエラークラス
 */

export class ToolError extends Error {
  constructor(
    message: string,
    public readonly toolName: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export class NetworkError extends ToolError {
  constructor(
    message: string,
    toolName: string,
    public readonly url?: string,
    originalError?: Error
  ) {
    super(message, toolName, originalError);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends ToolError {
  constructor(
    message: string,
    toolName: string,
    public readonly field?: string,
    originalError?: Error
  ) {
    super(message, toolName, originalError);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends NetworkError {
  constructor(
    timeoutMs: number,
    toolName: string,
    url?: string
  ) {
    super(`リクエストがタイムアウトしました（${timeoutMs}ms）`, toolName, url);
    this.name = 'TimeoutError';
  }
}