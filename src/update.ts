import fs from 'node:fs'
import path from 'node:path'
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
  // Don't change directory as it can cause path resolution issues
  // Let's use absolute paths instead

  // Run the zip theme function - this now guarantees the zip is complete before continuing
  const { releaseType, reason } = await zip_theme('theme', theme_path)

  // Get the absolute path to the zip file
  const zipFilePath = path.resolve(theme_path, 'theme.zip')

  // Verify the zip file exists
  if (!fs.existsSync(zipFilePath)) {
    const errorMsg = `Zip file not found at: ${zipFilePath}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  logger.log(`Uploading theme zip file: ${zipFilePath}`)

  try {
    // Create form data
    const form = new FormData()

    // Add the zip file to the form
    const fileStream = fs.createReadStream(zipFilePath)
    form.append('theme_file', fileStream, 'theme.zip')

    // Add other required form fields
    form.append('change_type', releaseType)
    form.append('release_notes', reason)

    // Create API instance
    const api = new Api()

    // Make the API request
    const result = await api
      .reset()
      .addBaseUrl()
      .addRoute(`/partners/themes/cli_update/${theme_id}`)
      .addUserToken()
      .addFormData(form)
      .post()
      .send()

    logger.log('Theme update API request successful')
    return result
  }
  catch (error) {
    // Handle errors
    if (error instanceof Error) {
      logger.error(`Theme update failed: ${error.message}`)

      if (error.stack) {
        logger.error(`Stack trace: ${error.stack}`)
      }
    }
    else {
      logger.error(`Theme update failed with unexpected error: ${String(error)}`)
    }

    throw error
  }
}
