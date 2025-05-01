import Api from './api.js'
import logger from './logger.js'
import { setToken } from './token.js'

interface LoginResponse {
  partner?: {
    'x-partner-token'?: string
    [key: string]: any
  }
  [key: string]: any
}

export async function login(email: string, password: string): Promise<void> {
  return new Api()
    .reset()
    .addBaseUrl()
    .addRoute('/market/partner-login')
    .addHeaders([{ key: 'Content-Type', value: 'application/json' }])
    .addBody({
      email,
      password,
    })
    .post()
    .send<LoginResponse>()
    .then(({ partner }) => {
      if (partner && partner['x-partner-token']) {
        if (!setToken(partner['x-partner-token'])) {
          logger.error('Failed to save token.')
          throw new Error('Failed to save token')
        }
        logger.log('Authentication successful!')
      }
      else {
        logger.error('Authentication failed. Invalid response from server.')
        throw new Error('Invalid response from server')
      }
    })
    .catch((error) => {
      if (error instanceof Error) {
        logger.error(`Authentication failed: ${error.message}`)
        if (error.stack) {
          logger.error(`Stack trace: ${error.stack}`)
        }
      }
      else if (typeof error === 'object' && error !== null) {
        try {
          logger.error(`Authentication failed: ${JSON.stringify(error)}`)
        }
        catch {
          logger.error('Authentication failed: [Unstringifiable error object]')
        }
      }
      else {
        logger.error(`Authentication failed: ${String(error)}`)
      }
      throw error
    })
}
