import fs from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import logger from './logger.js'

const homeDir = homedir()
const configDir = path.join(homeDir, '.zid-theme')
export const configPath = path.join(configDir, 'config.json')

function getToken() {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    if (config.access_token) {
      return config.access_token
    }
  }
  logger.log('No session found. Attempting login first.')
  return null
}

function setToken(token: string) {
  fs.writeFile(configPath, JSON.stringify({ access_token: token }), (err) => {
    if (err) {
      logger.error(`Failed to save token: ${err}`)
      return false
    }
  })
  return true
}

export { getToken, setToken }
