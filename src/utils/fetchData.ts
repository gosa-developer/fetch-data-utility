import { 
  FetchOptions, 
  FetchResponse, 
  FetchError, 
  FetchErrorType 
} from '../types/fetch.types';

export async function fetchData<T = any>(
  options: FetchOptions
): Promise<FetchResponse<T>> {
  const {
    url,
    timeout = 8000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Create abort controller for timeout handling
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);

  try {
    const response = await executeWithRetry<T>(
      url,
      {
        ...fetchOptions,
        signal: abortController.signal,
      },
      {
        maxRetries: retries,
        baseDelay: retryDelay,
        currentAttempt: 0,
      }
    );

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    return handleFetchError(error);
  }
}

/**
 * Executes fetch request with retry logic and exponential backoff
 */
async function executeWithRetry<T>(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig
): Promise<FetchResponse<T>> {
  const { maxRetries, baseDelay, currentAttempt } = retryConfig;

  try {
    const response = await fetch(url, options);

    // Handle HTTP errors (4xx, 5xx responses)
    if (!response.ok) {
      const error: FetchError = {
        type: 'http',
        message: `HTTP error ${response.status}: ${response.statusText}`,
        status: response.status,
      };

      // Don't retry client errors (4xx) as they're not likely to succeed
      if (response.status >= 400 && response.status < 500) {
        return { success: false, error };
      }

      // For server errors (5xx), retry if attempts remain
      if (currentAttempt < maxRetries) {
        await delay(calculateBackoff(baseDelay, currentAttempt));
        return executeWithRetry<T>(url, options, {
          ...retryConfig,
          currentAttempt: currentAttempt + 1,
        });
      }

      return { success: false, error };
    }

    // Parse response data
    const data = await parseResponseData<T>(response);
    
    return {
      success: true,
      data,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    // Handle network errors, timeouts, and other exceptions
    return handleRequestError(error, url, options, retryConfig);
  }
}

/**
 * Handles errors that occur during request execution
 */
async function handleRequestError<T>(
  error: unknown,
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig
): Promise<FetchResponse<T>> {
  const { maxRetries, baseDelay, currentAttempt } = retryConfig;
  let errorType: FetchErrorType = 'unknown';
  let errorMessage = 'An unknown error occurred';

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      errorType = 'timeout';
      errorMessage = 'Request timed out';
    } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
      errorType = 'network';
      errorMessage = 'Network error - please check your connection';
    } else {
      errorMessage = error.message;
    }
  }

  // Retry on network errors and timeouts
  if ((errorType === 'network' || errorType === 'timeout') && currentAttempt < maxRetries) {
    await delay(calculateBackoff(baseDelay, currentAttempt));
    return executeWithRetry<T>(url, options, {
      ...retryConfig,
      currentAttempt: currentAttempt + 1,
    });
  }

  return {
    success: false,
    error: {
      type: errorType,
      message: errorMessage,
      originalError: error,
    },
  };
}

/**
 * Parses response data based on content type
 */
async function parseResponseData<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return await response.json() as T;
  } else if (contentType?.includes('text/')) {
    return await response.text() as unknown as T;
  } else {
    return await response.blob() as unknown as T;
  }
}

/**
 * Handles and categorizes fetch errors
 */
function handleFetchError<T>(error: unknown): FetchResponse<T> {
  const fetchError: FetchError = {
    type: 'unknown',
    message: 'An unexpected error occurred',
  };

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      fetchError.type = 'timeout';
      fetchError.message = 'Request timed out';
    } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
      fetchError.type = 'network';
      fetchError.message = 'Network error - please check your internet connection';
    } else {
      fetchError.message = error.message;
    }
    fetchError.originalError = error;
  }

  return {
    success: false,
    error: fetchError,
  };
}

/**
 * Calculates exponential backoff delay
 * Uses formula: baseDelay * (2 ^ attempt) + random jitter
 */
function calculateBackoff(baseDelay: number, attempt: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 100; // Add random jitter to prevent thundering herd
  return exponentialDelay + jitter;
}

/**
 * Promise-based delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper interface for retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  currentAttempt: number;
}