/* eslint-disable unused-imports/no-unused-vars */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import FormData from 'form-data'
import Api from './api.js'
import logger from './logger.js'
import zip_theme from './zip-theme.js'

export interface TArguments {
  theme_id: string
  change_type: 'major' | 'minor' | 'patch'
  release_notes: string
}

export default async function updateTheme(
  theme_id: string,
  theme_path: string,
): Promise<any> {
  process.chdir(theme_path)
  const { releaseType, reason } = await zip_theme('theme', theme_path)
  const api = new Api()
  const form = new FormData()
  const fileStream = fs.createReadStream(theme_path)

  return new Promise((resolve, reject) => {
    fileStream.on('error', (err) => {
      logger.error('File stream error')
      reject(err) // Reject promise on stream error
    })

    fileStream.on('open', () => {
      form.append('theme_file', fileStream, path.basename(theme_path))
      form.append('change_type', releaseType)
      form.append('release_notes', reason)

      api
        .reset()
        .addBaseUrl()
        .addRoute(`/partners/themes/cli_update/${theme_id}`)
        .addUserToken()
        .addFormData(form)
        .post()
        .send()
        .then(resolve)
        .catch((err) => {
          // Enhanced error handling with detailed error information
          let errorDetails: string

          if (err instanceof Error) {
            errorDetails = err.message
            // Include stack trace for debugging
            logger.error(`API call error: ${err.message}`)
            if (err.stack) {
              logger.error(`Stack trace: ${err.stack}`)
            }
          }
          else if (typeof err === 'object' && err !== null) {
            try {
              // Try to extract meaningful properties from the error object
              const errorObj = err as Record<string, unknown>

              // Extract response details if available
              if ('response' in errorObj && errorObj.response) {
                try {
                  const responseDetails = JSON.stringify(errorObj.response, null, 2)
                  logger.error(`Response details: ${responseDetails}`)
                }
                catch (e) {
                  logger.error('Failed to stringify response details')
                }
              }

              // Format all properties
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
                .join('\n')

              errorDetails = details || JSON.stringify(err, null, 2)
            }
            catch (e) {
              errorDetails = 'Failed to process error object'
              logger.error(`Error processing error object: ${e instanceof Error ? e.message : String(e)}`)
            }
          }
          else {
            errorDetails = String(err)
          }

          logger.error(`Error during API call: ${errorDetails}`)
          reject(err) // Reject promise on API error
        })
    })
  })
}
