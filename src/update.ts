import Api from './api.js'
import fs from 'node:fs'
import process from 'node:process'
import path from 'node:path'
import logger from './logger.js'
import FormData from 'form-data'
import zip_theme from './zip-theme.js'

export type TArguments = {
  theme_id: string
  change_type: 'major' | 'minor' | 'patch'
  release_notes: string
}

export default async function updateTheme(
  theme_id: string,
  theme_path: string,
  change_type: string,
  release_notes: string
): Promise<any> {
  process.chdir(theme_path)
  await zip_theme('theme', theme_path)
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
      form.append('change_type', change_type)
      form.append('release_notes', release_notes)

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
