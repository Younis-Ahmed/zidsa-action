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
        .addBaseUrl()
        .addRoute(`/partners/themes/cli_update/${theme_id}`)
        .addUserToken()
        .addFormData(form)
        .post()
        .send()
        .then(resolve)
        .catch((err) => {
          logger.error('Error during API call')
          reject(err) // Reject promise on API error
        })
    })
  })
}
