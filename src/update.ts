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

  const { releaseType, reason } = await zip_theme('theme', theme_path)
  const zipFilePath = path.resolve(theme_path, 'theme.zip')

  if (!fs.existsSync(zipFilePath)) {
    const errorMsg = `Zip file not found at: ${zipFilePath}`
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  logger.log(`Uploading theme zip file: ${zipFilePath}`)

  const form = new FormData()
  const api = new Api()
  const fileStream = fs.createReadStream(zipFilePath)

  return new Promise((resolve, reject) => {
    fileStream.on('error', (err) => {
      logger.error('File stream error')
      reject(err)
    })

    fileStream.on('open', () => {
      form.append('theme_file', fileStream, 'theme.zip')
      form.append('change_type', releaseType)
      form.append('release_notes', reason)

      api.reset()
        .addBaseUrl()
        .addRoute(`/partners/themes/cli_update/${theme_id}`)
        .addUserToken()
        .addFormData(form)
        .post()
        .send()
        .then((result: any) => {
          logger.log(`Theme update API request successful: ${result}`)
          if (result.status !== 200) {
            logger.error('Theme update API request failed')
            reject(new Error(`API request failed with status: ${result.status}`))
            return
          }
          resolve(result)
        })
        .catch((err: any) => {
          logger.error('Error during API call')
          reject(err)
        })
    })
  })
}
