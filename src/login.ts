import logger from './logger.js'
import Api from './api.js'
import { setToken } from './token.js'

interface LoginResponse {
  partner?: {
    'x-partner-token'?: string
    [key: string]: any
  }
  [key: string]: any
}

export const login = (email: string, password: string): Promise<void> =>
  new Api()
    .addBaseUrl()
    .addRoute('/market/partner-login')
    .addHeaders([{ key: 'Content-Type', value: 'application/json' }])
    .addBody({
      email,
      password
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
      } else {
        logger.error('Authentication failed. Invalid response from server.')
        throw new Error('Invalid response from server')
      }
    })
    .catch((error) => {
      logger.error('Authentication failed')
      throw error
    })
