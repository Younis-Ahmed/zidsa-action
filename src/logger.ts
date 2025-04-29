import type { AnnotationProperties } from '@actions/core'
import {
  error,
  notice,
  warning,
} from '@actions/core'

/**
 * Formats a message or error object to ensure proper string representation
 */
function formatMessage(message: unknown): string {
  if (message instanceof Error) {
    return message.message
  }

  if (typeof message === 'object' && message !== null) {
    try {
      return JSON.stringify(message, null, 2)
    }
    catch {
      // If JSON stringify fails, try to extract properties
      try {
        const errorObj = message as Record<string, unknown>
        const details = Object.entries(errorObj)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => {
            try {
              return `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
            }
            catch {
              return `${key}: [Complex Value]`
            }
          })
          .join(', ')

        return details || '[Empty Object]'
      }
      catch {
        return String(message)
      }
    }
  }

  return String(message)
}

const logger = {
  log: (message: unknown, properties?: AnnotationProperties) => {
    notice(formatMessage(message), properties)
  },
  error: (message: unknown, properties?: AnnotationProperties) => {
    error(formatMessage(message), properties)
  },
  warning: (message: unknown, properties?: AnnotationProperties) => {
    warning(formatMessage(message), properties)
  },
}

export default logger
