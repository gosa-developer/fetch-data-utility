/**
 * Error types for categorizing fetch failures
 */
export type FetchErrorType = 'http' | 'network' | 'timeout' | 'unknown';

/**
 * Structured error object returned on failed requests
 */
export interface FetchError {
  type: FetchErrorType;
  message: string;
  status?: number;
  originalError?: unknown;
}

/**
 * Success response structure
 */
export interface FetchSuccess<T> {
  success: true;
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Failure response structure
 */
export interface FetchFailure {
  success: false;
  error: FetchError;
}

/**
 * Union type for all possible responses
 */
export type FetchResponse<T> = FetchSuccess<T> | FetchFailure;

/**
 * Configuration options for fetchData utility
 */
export interface FetchOptions extends RequestInit {
  url: string;
  timeout?: number;           // Timeout in milliseconds (default: 8000)
  retries?: number;            // Number of retry attempts (default: 3)
  retryDelay?: number;         // Base delay for exponential backoff (default: 1000)
  headers?: Record<string, string>;
}

/**
 * Internal retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  currentAttempt: number;
}