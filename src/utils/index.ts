import fs from 'fs/promises';
import path from 'path';
import { ApiErrorResponse } from '../types';

// Simple color functions to replace chalk
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`
};

/**
 * Formats an error message with color
 * @param message Error message
 * @returns Formatted error message
 */
export function formatError(message: string): string {
  return colors.red(`Error: ${message}`);
}

/**
 * Formats a success message with color
 * @param message Success message
 * @returns Formatted success message
 */
export function formatSuccess(message: string): string {
  return colors.green(`✓ ${message}`);
}

/**
 * Formats a warning message with color
 * @param message Warning message
 * @returns Formatted warning message
 */
export function formatWarning(message: string): string {
  return colors.yellow(`⚠ ${message}`);
}

/**
 * Formats an info message with color
 * @param message Info message
 * @returns Formatted info message
 */
export function formatInfo(message: string): string {
  return colors.blue(`ℹ ${message}`);
}

/**
 * Formats code snippets with color
 * @param code Code snippet
 * @returns Formatted code snippet
 */
export function formatCode(code: string): string {
  return colors.cyan(code);
}

/**
 * Checks if a file exists
 * @param filePath Path to the file
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves a file path relative to the current working directory
 * @param filePath Path to resolve
 * @returns Resolved path
 */
export function resolvePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

/**
 * Parses an API error response
 * @param error Error object
 * @returns Parsed API error response
 */
export function parseApiError(error: any): ApiErrorResponse {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      status: error.response.status,
      message: error.response.data?.message || 'API Error',
      details: error.response.data?.details || JSON.stringify(error.response.data),
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      message: 'No response received from server',
      details: 'This could be due to network issues or the server being down',
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      status: 0,
      message: error.message || 'Unknown error',
      details: error.stack,
    };
  }
}