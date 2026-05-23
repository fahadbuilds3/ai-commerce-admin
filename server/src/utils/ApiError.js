/**
 * Custom error class for consistent API error handling in Express apps.
 */
 export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 500).
   * @param {string} message - Human-readable error message.
   * @param {object} [details] - Optional additional error metadata.
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (details) {
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;